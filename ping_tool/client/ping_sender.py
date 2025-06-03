import requests
from ping3 import ping
import time

RECORDER_BASE = "http://localhost:5001"
CLIENT_NAME = "client1"

ips_to_ping = [
    "8.8.8.8",
    "1.1.1.1",
    "192.168.1.26",
    "192.168.1.102",
    "192.168.1.96"
]

existing_ips = set()

def fetch_existing_ips():
    global existing_ips
    try:
        resp = requests.get(f"{RECORDER_BASE}/ips")
        resp.raise_for_status()
        existing_ips = set((entry['ip'], entry['client']) for entry in resp.json())
        print(f"Existing IPs from recorder: {existing_ips}")
    except Exception as e:
        print(f"Failed to fetch existing IPs: {e}")

def add_ip(ip):
    try:
        resp = requests.post(f"{RECORDER_BASE}/ips", json={"ip": ip, "client": CLIENT_NAME})
        resp.raise_for_status()
        existing_ips.add((ip, CLIENT_NAME))
        print(f"Added new IP {ip} to recorder")
        return True
    except Exception as e:
        print(f"Failed to add IP {ip}: {e}")
        return False

def send_ping_result(ip, latency_ms):
    payload = {"ip": ip, "latency_ms": latency_ms}
    try:
        resp = requests.post(f"{RECORDER_BASE}/record-ping/{CLIENT_NAME}", json=payload)
        resp.raise_for_status()
        print(f"Sent ping data for {ip}: {latency_ms} ms")
    except Exception as e:
        print(f"Failed to send ping data for {ip}: {e}")

def ping_loop(interval=10):
    fetch_existing_ips()
    while True:
        for ip in ips_to_ping:
            if (ip, CLIENT_NAME) not in existing_ips:
                added = add_ip(ip)
                if not added:
                    print(f"Skipping ping for {ip} because it could not be added.")
                    continue
            latency = None
            try:
                latency_sec = ping(ip, timeout=2)
                latency = int(latency_sec * 1000) if latency_sec is not None else None
            except Exception as e:
                print(f"Ping failed for {ip}: {e}")
            send_ping_result(ip, latency)
        time.sleep(interval)

if __name__ == "__main__":
    ping_loop()
