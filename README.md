# CyberThreatVision — Full Stack AI/ML Threat Intelligence Platform

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5, Tailwind CSS, Shadcn UI |
| State | Zustand + React Context API |
| Routing | React Router v6 |
| Charts | Recharts + Chart.js |
| Map | Leaflet.js |
| Backend | Node.js + Express |
| Primary DB | MySQL 8 |
| Secondary DB | MongoDB (optional) |
| ML | Python (Scikit-learn / TensorFlow) |
| ML Bridge | Node child_process + Flask microservice |
| Auth | JWT + bcrypt |
| Datasets | Local CSV/JSON — fully offline capable |
| APIs | AbuseIPDB, VirusTotal (optional, demo only) |

## Project Structure

```
CyberThreatVision2/
├── frontend/           React + Vite SPA
├── backend/            Node.js + Express API
├── ml/                 Python ML models + Flask microservice
├── datasets/           Local CSV/JSON threat datasets
│   ├── ips/            Suspicious IP dataset
│   ├── phishing/       Phishing URL dataset
│   ├── malware/        Malware signature dataset
│   └── geo/            GeoIP lookup data
├── docs/               API docs
└── scripts/            Setup scripts
```

## Quick Start

```bash
bash scripts/setup.sh

# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — ML Flask microservice
cd ml && python app.py

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Login: admin / CyberAdmin@123
Frontend: http://localhost:5173
Backend:  http://localhost:5000
ML API:   http://localhost:5001
