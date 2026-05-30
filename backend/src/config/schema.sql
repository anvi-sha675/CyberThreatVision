CREATE DATABASE IF NOT EXISTS cyberthreatvisiondb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cyberthreatvisiondb;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64) NOT NULL UNIQUE,
  email         VARCHAR(128) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','analyst','viewer') DEFAULT 'viewer',
  clearance     VARCHAR(32) DEFAULT 'STANDARD',
  last_login    DATETIME,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS scan_logs (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  scan_type     ENUM('ip','url','hash','bulk') NOT NULL,
  target        TEXT NOT NULL,
  risk_score    TINYINT UNSIGNED DEFAULT 0,
  risk_level    ENUM('critical','high','medium','low') DEFAULT 'low',
  is_threat     BOOLEAN DEFAULT FALSE,
  source        ENUM('dataset','ml','api','rules') DEFAULT 'dataset',
  result_json   JSON,
  user_id       INT,
  ip_address    VARCHAR(45),
  scanned_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_type (scan_type),
  INDEX idx_threat (is_threat),
  INDEX idx_scanned (scanned_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS threat_events (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  ip_address    VARCHAR(45) NOT NULL,
  country_code  CHAR(2),
  country_name  VARCHAR(64),
  isp           VARCHAR(128),
  attack_type   VARCHAR(64) NOT NULL,
  severity      ENUM('critical','high','medium','low') DEFAULT 'medium',
  target_port   SMALLINT UNSIGNED,
  risk_score    TINYINT UNSIGNED DEFAULT 0,
  source        ENUM('dataset','api','simulated') DEFAULT 'dataset',
  status        ENUM('active','blocked','resolved') DEFAULT 'active',
  reported_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip_address),
  INDEX idx_severity (severity),
  INDEX idx_reported (reported_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alert_log (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  alert_id      VARCHAR(32) NOT NULL UNIQUE,
  alert_type    VARCHAR(64) NOT NULL,
  severity      ENUM('critical','high','medium','low') NOT NULL,
  source_ip     VARCHAR(45),
  description   TEXT,
  details       JSON,
  status        ENUM('active','acknowledged','resolved') DEFAULT 'active',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_severity (severity),
  INDEX idx_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS blocked_ips (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ip_address    VARCHAR(45) NOT NULL UNIQUE,
  country_code  CHAR(2),
  reason        VARCHAR(255),
  risk_score    TINYINT UNSIGNED DEFAULT 0,
  blocked_by    INT,
  is_permanent  BOOLEAN DEFAULT FALSE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_log (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,
  username    VARCHAR(64),
  action      VARCHAR(64) NOT NULL,
  resource    VARCHAR(64),
  ip_address  VARCHAR(45),
  details     JSON,
  status      ENUM('success','failure') DEFAULT 'success',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS system_metrics (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  metric_name   VARCHAR(64) NOT NULL,
  metric_value  DECIMAL(10,2) NOT NULL,
  unit          VARCHAR(16),
  recorded_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_metric (metric_name)
) ENGINE=InnoDB;

-- Default admin user (password: CyberAdmin@123)
INSERT IGNORE INTO users (username, email, password_hash, role, clearance)
VALUES ('admin','admin@ctv.local','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX0kxNZkDmxBP8H7Y6dFqZAy2K','admin','ALPHA-7');
