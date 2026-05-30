import os
import sys
import json
import math
import re
import csv
import hashlib
import pickle
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# Scikit-learn imports
try:
    import numpy as np
    import pandas as pd
    from sklearn.ensemble import RandomForestClassifier, IsolationForest
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("WARNING: scikit-learn not installed. Using rule-based fallbacks.")

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, '..', 'datasets')
MODEL_DIR   = os.path.join(BASE_DIR, 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

def load_csv(path):
    rows = []
    try:
        with open(path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)
    except Exception as e:
        logger.error(f"Failed to load {path}: {e}")
    return rows

IP_DATASET       = load_csv(os.path.join(DATASET_DIR, 'ips', 'suspicious_ips.csv'))
PHISHING_DATASET = load_csv(os.path.join(DATASET_DIR, 'phishing', 'phishing_urls.csv'))
MALWARE_DATASET  = load_csv(os.path.join(DATASET_DIR, 'malware', 'malware_signatures.csv'))

# Build quick lookup dicts
IP_LOOKUP       = {row['ip_address']: row for row in IP_DATASET}
PHISHING_LOOKUP = {row['url']: row for row in PHISHING_DATASET}
MALWARE_LOOKUP  = {row['md5_hash']: row for row in MALWARE_DATASET}

logger.info(f"Loaded {len(IP_DATASET)} IPs, {len(PHISHING_DATASET)} phishing URLs, {len(MALWARE_DATASET)} malware records")

def extract_url_features(url):
    """Extract ML features from a URL string."""
    features = {}
    try:
        features['length']            = len(url)
        features['has_https']         = 1 if url.startswith('https') else 0
        features['dot_count']         = url.count('.')
        features['dash_count']        = url.count('-')
        features['at_count']          = url.count('@')
        features['slash_count']       = url.count('/')
        features['question_count']    = url.count('?')
        features['equal_count']       = url.count('=')
        features['underscore_count']  = url.count('_')
        features['has_ip']            = 1 if re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url) else 0
        features['special_char_count']= len(re.findall(r'[^a-zA-Z0-9./:-]', url))

        # Suspicious keywords
        suspicious_words = ['login','verify','secure','account','update','confirm','banking',
                           'paypal','amazon','microsoft','apple','google','netflix','wallet',
                           'suspended','locked','alert','urgent','password','credential']
        features['suspicious_word_count'] = sum(1 for w in suspicious_words if w in url.lower())

        # Domain features
        try:
            domain_match = re.search(r'(?:https?://)?([^/]+)', url)
            if domain_match:
                domain = domain_match.group(1)
                features['domain_length']    = len(domain)
                features['subdomain_count']  = max(0, domain.count('.') - 1)
                features['has_numbers_in_domain'] = 1 if re.search(r'\d', domain) else 0
            else:
                features['domain_length']    = 0
                features['subdomain_count']  = 0
                features['has_numbers_in_domain'] = 0
        except Exception:
            features['domain_length']    = 0
            features['subdomain_count']  = 0
            features['has_numbers_in_domain'] = 0

        # TLD check
        suspicious_tlds = ['.xyz','.top','.info','.biz','.ru','.cn','.tk','.ml','.ga','.cf']
        features['suspicious_tld'] = 1 if any(url.lower().endswith(t) or (t + '/') in url.lower() for t in suspicious_tlds) else 0

    except Exception as e:
        logger.error(f"Feature extraction error: {e}")
    return features

def extract_ip_features(ip, additional_data=None):
    """Extract features for IP risk scoring."""
    features = {}
    try:
        parts = ip.split('.')
        features['first_octet']   = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 0
        features['is_private']    = 1 if (parts[0] in ['10','172','192'] or ip.startswith('127.')) else 0
        features['is_multicast']  = 1 if (parts[0].isdigit() and int(parts[0]) >= 224) else 0
        features['octet_variance'] = 0

        if additional_data:
            features['report_count']    = int(additional_data.get('report_count', 0))
            features['is_tor']          = 1 if additional_data.get('is_tor', 'false') == 'true' else 0
            features['is_proxy']        = 1 if additional_data.get('is_proxy', 'false') == 'true' else 0
        else:
            features['report_count'] = 0
            features['is_tor']       = 0
            features['is_proxy']     = 0
    except Exception as e:
        logger.error(f"IP feature extraction error: {e}")
    return features

phishing_model    = None
phishing_scaler   = None
ip_model          = None
anomaly_detector  = None

def train_phishing_model():
    global phishing_model, phishing_scaler
    if not SKLEARN_AVAILABLE or not PHISHING_DATASET:
        return
    try:
        X, y = [], []
        for row in PHISHING_DATASET:
            features = extract_url_features(row['url'])
            if features:
                X.append(list(features.values()))
                y.append(1)  # All dataset entries are phishing

        # Add some benign URL features synthetically
        benign_urls = [
            'https://www.google.com/search',
            'https://github.com/user/repo',
            'https://stackoverflow.com/questions',
            'https://docs.python.org/3/',
            'https://www.wikipedia.org/wiki/Machine_learning',
            'https://nodejs.org/en/docs',
            'https://reactjs.org/docs/getting-started.html',
            'https://tailwindcss.com/docs',
            'https://developer.mozilla.org/en-US/',
            'https://www.microsoft.com/en-us/windows',
        ]
        for url in benign_urls:
            features = extract_url_features(url)
            if features:
                X.append(list(features.values()))
                y.append(0)

        if len(X) < 10:
            return

        X, y = np.array(X), np.array(y)
        phishing_scaler = StandardScaler()
        X_scaled = phishing_scaler.fit_transform(X)

        phishing_model = RandomForestClassifier(n_estimators=100, random_state=42)
        phishing_model.fit(X_scaled, y)
        logger.info(f"Phishing model trained on {len(X)} samples")

    except Exception as e:
        logger.error(f"Phishing model training error: {e}")

def train_anomaly_detector():
    global anomaly_detector
    if not SKLEARN_AVAILABLE or not IP_DATASET:
        return
    try:
        X = []
        for row in IP_DATASET:
            try:
                X.append([
                    float(row.get('abuse_score', 0)),
                    float(row.get('report_count', 0)),
                    1 if row.get('is_tor','false') == 'true' else 0,
                    1 if row.get('is_proxy','false') == 'true' else 0,
                ])
            except Exception:
                pass

        if len(X) < 5:
            return
        X = np.array(X)
        anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        anomaly_detector.fit(X)
        logger.info(f"Anomaly detector trained on {len(X)} IP samples")
    except Exception as e:
        logger.error(f"Anomaly detector training error: {e}")

# Train models on startup
train_phishing_model()
train_anomaly_detector()

def rule_based_phishing_score(url):
    """Returns 0.0–1.0 phishing probability using rules when ML unavailable."""
    score = 0.0
    url_lower = url.lower()
    features = extract_url_features(url)

    # Length penalty
    if features.get('length', 0) > 75:     score += 0.15
    if features.get('length', 0) > 100:    score += 0.10

    # Protocol
    if not features.get('has_https'):       score += 0.10

    # IP in URL
    if features.get('has_ip'):              score += 0.30

    # Suspicious chars
    if features.get('at_count', 0) > 0:    score += 0.20
    if features.get('dash_count', 0) > 3:  score += 0.15
    if features.get('special_char_count', 0) > 5: score += 0.10

    # Keywords
    score += min(0.30, features.get('suspicious_word_count', 0) * 0.06)

    # TLD
    if features.get('suspicious_tld'):     score += 0.20

    # Subdomain abuse
    if features.get('subdomain_count', 0) > 2: score += 0.15

    # Dataset match
    for phish_row in PHISHING_DATASET:
        if phish_row.get('domain','').lower() in url_lower:
            score = max(score, float(phish_row.get('ml_score', 0.9)))
            break

    return min(1.0, score)

def rule_based_ip_score(ip):
    """Returns 0–100 risk score using dataset + rules."""
    if ip in IP_LOOKUP:
        row = IP_LOOKUP[ip]
        return int(float(row.get('abuse_score', 50)))

    # Heuristic for unknown IPs
    parts = ip.split('.')
    score = 20
    try:
        first = int(parts[0])
        if first in range(185, 190):  score += 30
        if first in range(45, 50):    score += 20
        if first in range(91, 95):    score += 25
    except Exception:
        pass
    return min(100, score)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'CyberThreatVision ML Service',
        'sklearn': SKLEARN_AVAILABLE,
        'models': {
            'phishing_classifier': phishing_model is not None,
            'anomaly_detector':    anomaly_detector is not None,
        },
        'dataset_sizes': {
            'ips':      len(IP_DATASET),
            'phishing': len(PHISHING_DATASET),
            'malware':  len(MALWARE_DATASET),
        },
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/analyze/url', methods=['POST'])
def analyze_url():
    """Classify a URL as phishing or benign."""
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'url required'}), 400

    url = data['url'].strip()
    features = extract_url_features(url)
    feature_vector = list(features.values())

    # Dataset exact match first
    dataset_match = None
    url_lower = url.lower()
    for row in PHISHING_DATASET:
        if row.get('domain','').lower() in url_lower or url_lower in row.get('url','').lower():
            dataset_match = row
            break

    # ML prediction
    ml_score = None
    if phishing_model and phishing_scaler and SKLEARN_AVAILABLE:
        try:
            X = np.array([feature_vector])
            X_scaled = phishing_scaler.transform(X)
            prob = phishing_model.predict_proba(X_scaled)[0]
            ml_score = float(prob[1]) if len(prob) > 1 else float(prob[0])
        except Exception as e:
            logger.error(f"ML prediction error: {e}")

    # Fallback
    rule_score = rule_based_phishing_score(url)
    final_score = ml_score if ml_score is not None else rule_score

    risk_level = 'critical' if final_score >= 0.85 else 'high' if final_score >= 0.65 else 'medium' if final_score >= 0.40 else 'low'

    return jsonify({
        'url':           url,
        'phishing_score': round(final_score, 4),
        'risk_level':    risk_level,
        'is_phishing':   final_score >= 0.5,
        'method':        'ml+dataset' if (ml_score and dataset_match) else 'ml' if ml_score else 'rules',
        'features':      features,
        'dataset_match': {
            'found':        True,
            'category':     dataset_match.get('category'),
            'target_brand': dataset_match.get('target_brand'),
            'risk_score':   dataset_match.get('risk_score'),
        } if dataset_match else {'found': False},
        'confidence': round(abs(final_score - 0.5) * 2, 2),
    })


@app.route('/analyze/ip', methods=['POST'])
def analyze_ip():
    """Score an IP address for threat risk."""
    data = request.get_json()
    if not data or 'ip' not in data:
        return jsonify({'error': 'ip required'}), 400

    ip = data['ip'].strip()
    dataset_row = IP_LOOKUP.get(ip)
    risk_score  = rule_based_ip_score(ip)
    risk_level  = 'critical' if risk_score >= 80 else 'high' if risk_score >= 60 else 'medium' if risk_score >= 40 else 'low'

    # Anomaly detection
    is_anomaly = False
    if anomaly_detector and SKLEARN_AVAILABLE and dataset_row:
        try:
            X = np.array([[
                float(dataset_row.get('abuse_score', risk_score)),
                float(dataset_row.get('report_count', 0)),
                1 if dataset_row.get('is_tor','false') == 'true' else 0,
                1 if dataset_row.get('is_proxy','false') == 'true' else 0,
            ]])
            pred = anomaly_detector.predict(X)
            is_anomaly = bool(pred[0] == -1)
        except Exception:
            pass

    return jsonify({
        'ip':          ip,
        'risk_score':  risk_score,
        'risk_level':  risk_level,
        'is_anomaly':  is_anomaly,
        'in_dataset':  dataset_row is not None,
        'details': {
            'country':       dataset_row.get('country_name') if dataset_row else 'Unknown',
            'country_code':  dataset_row.get('country_code') if dataset_row else 'XX',
            'isp':           dataset_row.get('isp') if dataset_row else 'Unknown',
            'attack_types':  dataset_row.get('attack_types') if dataset_row else '',
            'report_count':  dataset_row.get('report_count') if dataset_row else 0,
            'is_tor':        dataset_row.get('is_tor','false') if dataset_row else 'false',
            'is_proxy':      dataset_row.get('is_proxy','false') if dataset_row else 'false',
            'latitude':      float(dataset_row.get('latitude', 0)) if dataset_row else 0,
            'longitude':     float(dataset_row.get('longitude', 0)) if dataset_row else 0,
            'last_seen':     dataset_row.get('last_seen') if dataset_row else None,
        }
    })


@app.route('/analyze/hash', methods=['POST'])
def analyze_hash():
    """Look up a file hash in malware dataset."""
    data = request.get_json()
    if not data or 'hash' not in data:
        return jsonify({'error': 'hash required'}), 400

    h = data['hash'].strip().lower()
    row = MALWARE_LOOKUP.get(h)

    if row:
        return jsonify({
            'hash':         h,
            'found':        True,
            'name':         row.get('name'),
            'family':       row.get('family'),
            'type':         row.get('type'),
            'severity':     row.get('severity'),
            'detection_rate': row.get('detection_rate'),
            'av_vendors':   row.get('av_vendors'),
            'source_ip':    row.get('source_ip'),
            'behavior_tags': row.get('behavior_tags','').split(','),
            'mitre_techniques': row.get('mitre_techniques','').split(','),
            'first_seen':   row.get('first_seen'),
        })
    return jsonify({'hash': h, 'found': False, 'message': 'Hash not in local dataset'})


@app.route('/dataset/ips', methods=['GET'])
def get_ip_dataset():
    """Return full IP dataset with optional filtering."""
    min_score = request.args.get('min_score', 0, type=int)
    country   = request.args.get('country', None)
    limit     = request.args.get('limit', 100, type=int)

    result = IP_DATASET
    if min_score:
        result = [r for r in result if int(float(r.get('abuse_score',0))) >= min_score]
    if country:
        result = [r for r in result if r.get('country_code','').upper() == country.upper()]

    return jsonify({'ips': result[:limit], 'total': len(result)})


@app.route('/dataset/phishing', methods=['GET'])
def get_phishing_dataset():
    """Return phishing URL dataset."""
    brand  = request.args.get('brand', None)
    limit  = request.args.get('limit', 100, type=int)

    result = PHISHING_DATASET
    if brand:
        result = [r for r in result if brand.lower() in r.get('target_brand','').lower()]

    return jsonify({'urls': result[:limit], 'total': len(result)})


@app.route('/dataset/malware', methods=['GET'])
def get_malware_dataset():
    """Return malware dataset."""
    mtype  = request.args.get('type', None)
    limit  = request.args.get('limit', 100, type=int)

    result = MALWARE_DATASET
    if mtype:
        result = [r for r in result if r.get('type','').lower() == mtype.lower()]

    return jsonify({'samples': result[:limit], 'total': len(result)})


@app.route('/stats/summary', methods=['GET'])
def stats_summary():
    """Summary statistics from all datasets."""
    ip_scores   = [int(float(r.get('abuse_score', 0))) for r in IP_DATASET]
    sev_counts  = {}
    for row in MALWARE_DATASET:
        s = row.get('severity','unknown')
        sev_counts[s] = sev_counts.get(s, 0) + 1

    brand_counts = {}
    for row in PHISHING_DATASET:
        b = row.get('target_brand','Other')
        brand_counts[b] = brand_counts.get(b, 0) + 1

    return jsonify({
        'ip_stats': {
            'total':    len(IP_DATASET),
            'critical': sum(1 for s in ip_scores if s >= 80),
            'high':     sum(1 for s in ip_scores if 60 <= s < 80),
            'medium':   sum(1 for s in ip_scores if 40 <= s < 60),
            'avg_score': round(sum(ip_scores) / max(len(ip_scores),1), 1),
        },
        'phishing_stats': {
            'total':       len(PHISHING_DATASET),
            'by_brand':    dict(sorted(brand_counts.items(), key=lambda x: -x[1])[:10]),
            'active':      sum(1 for r in PHISHING_DATASET if r.get('is_active','true') == 'true'),
        },
        'malware_stats': {
            'total':       len(MALWARE_DATASET),
            'by_severity': sev_counts,
            'ransomware':  sum(1 for r in MALWARE_DATASET if r.get('type','') == 'Ransomware'),
        },
        'ml_status': {
            'sklearn_available':       SKLEARN_AVAILABLE,
            'phishing_model_trained':  phishing_model is not None,
            'anomaly_detector_trained': anomaly_detector is not None,
        }
    })


@app.route('/bulk/scan', methods=['POST'])
def bulk_scan():
    """Scan multiple URLs or IPs at once."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    results = []
    targets = data.get('targets', [])[:50]  # Max 50 per bulk request

    for target in targets:
        t_type  = target.get('type', 'url')
        value   = target.get('value', '')
        if not value:
            continue

        if t_type == 'url':
            score = rule_based_phishing_score(value)
            results.append({
                'value': value, 'type': 'url',
                'score': round(score, 3),
                'is_threat': score >= 0.5,
                'risk_level': 'critical' if score >= 0.85 else 'high' if score >= 0.65 else 'medium' if score >= 0.4 else 'low',
            })
        elif t_type == 'ip':
            score = rule_based_ip_score(value)
            results.append({
                'value': value, 'type': 'ip',
                'score': score,
                'is_threat': score >= 50,
                'risk_level': 'critical' if score >= 80 else 'high' if score >= 60 else 'medium' if score >= 40 else 'low',
            })

    return jsonify({'results': results, 'total': len(results), 'threats': sum(1 for r in results if r['is_threat'])})


if __name__ == '__main__':
    port = int(os.environ.get('ML_PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    logger.info(f"Starting ML microservice on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
