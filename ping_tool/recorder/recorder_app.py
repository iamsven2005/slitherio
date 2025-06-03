from flask import Flask, request, jsonify, abort
import sqlite3
import os
from datetime import datetime
import logging
from logging.handlers import RotatingFileHandler

# ... your existing imports and code ...

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Current script directory
PARENT_DIR = os.path.dirname(BASE_DIR)                 # Parent directory
DB_DIR = os.path.join(PARENT_DIR, 'data')              # 'data' folder in parent dir
DB_NAME = os.path.join(DB_DIR, 'ips.db')

LOG_DIR = os.path.join(PARENT_DIR, 'log')              # log folder in parent dir
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOG_FILE = os.path.join(LOG_DIR, 'ping_tool.log')

# Setup logging
handler = RotatingFileHandler(LOG_FILE, maxBytes=10*1024*1024, backupCount=5)
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s - %(message)s')
handler.setFormatter(formatter)

# Add handler to Flask's app logger
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)

# Now you can use app.logger.info(), app.logger.error() etc. in your routes and functions

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    app.logger.info("Initializing database...")
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS ips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT NOT NULL,
            client TEXT DEFAULT 'host',
            name TEXT DEFAULT ''
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS pings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_id INTEGER NOT NULL,
            latency_ms INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ip_id) REFERENCES ips (id) ON DELETE CASCADE
        )
    ''')
    conn.commit()
    conn.close()
    app.logger.info("Database initialized.")

@app.route('/ips', methods=['POST'])
def create_ip():
    data = request.json
    ip = data.get('ip')
    client = data.get('client', 'host')
    if not ip:
        app.logger.warning("Create IP failed: no IP provided")
        abort(400, "IP address is required")
    conn = get_db_connection()
    existing = conn.execute('SELECT id FROM ips WHERE ip = ? AND client = ?', (ip, client)).fetchone()
    if existing:
        conn.close()
        app.logger.warning(f"Create IP failed: IP {ip} with client {client} already exists")
        abort(400, f'IP {ip} with client {client} already exists')
    cur = conn.execute('INSERT INTO ips (ip, client) VALUES (?, ?)', (ip, client))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    app.logger.info(f"Created IP {ip} for client {client} with id {new_id}")
    return jsonify({'id': new_id, 'ip': ip, 'client': client}), 201

@app.route('/ips', methods=['GET'])
def get_ips():
    conn = get_db_connection()
    ips = conn.execute('SELECT ip, client FROM ips').fetchall()
    conn.close()
    app.logger.info(f"Fetched {len(ips)} IPs")
    return jsonify([{'ip': ip['ip'], 'client': ip['client']} for ip in ips])

@app.route('/record-ping/<string:client>', methods=['POST'])
def record_ping(client):
    data = request.json
    ip = data.get('ip')
    latency = data.get('latency_ms')

    if not ip or latency is None:
        app.logger.warning("Record ping failed: missing 'ip' or 'latency_ms'")
        abort(400, "Missing 'ip' or 'latency_ms' in JSON payload")

    conn = get_db_connection()
    ip_row = conn.execute('SELECT id FROM ips WHERE ip = ? AND client = ?', (ip, client)).fetchone()
    if ip_row is None:
        cur = conn.execute('INSERT INTO ips (ip, client) VALUES (?, ?)', (ip, client))
        conn.commit()
        ip_id = cur.lastrowid
        app.logger.info(f"Auto-created IP {ip} for client {client} with id {ip_id}")
    else:
        ip_id = ip_row['id']

    conn.execute('INSERT INTO pings (ip_id, latency_ms) VALUES (?, ?)', (ip_id, latency))
    conn.commit()
    conn.close()
    app.logger.info(f"Recorded ping for IP {ip} client {client} latency {latency} ms")
    return jsonify({"status": "success"})

if __name__ == '__main__':
    init_db()
    app.logger.info("Starting Flask app...")
    app.run(host='0.0.0.0', port=5001)
