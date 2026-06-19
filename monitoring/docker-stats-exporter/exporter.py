"""Minimal Prometheus exporter for per-container metrics on Docker Desktop.

cAdvisor cannot resolve per-container metrics when Docker Desktop uses the
containerd image store (it can't find the graphdriver layer DB). This exporter
instead reads the Docker Engine API over the unix socket — the same source as
`docker stats` — which works regardless of the image store, so it is reliable
on Windows/Mac Docker Desktop as well as Linux.

Exposes, labelled by container `name`:
  container_cpu_usage_percent
  container_memory_usage_bytes / container_memory_limit_bytes
  container_network_receive_bytes_total / container_network_transmit_bytes_total
  container_blkio_read_bytes_total / container_blkio_write_bytes_total
  container_fs_usage_bytes   (writable layer size, SizeRw)
"""

import http.client
import json
import os
import socket
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DOCKER_SOCK = os.getenv("DOCKER_SOCK", "/var/run/docker.sock")
LISTEN_PORT = int(os.getenv("LISTEN_PORT", "9417"))


class _UnixHTTPConnection(http.client.HTTPConnection):
    def __init__(self, path):
        super().__init__("localhost")
        self._path = path

    def connect(self):
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        s.settimeout(10)
        s.connect(self._path)
        self.sock = s


def docker_get(path):
    conn = _UnixHTTPConnection(DOCKER_SOCK)
    try:
        conn.request("GET", path)
        resp = conn.getresponse()
        body = resp.read()
        if resp.status != 200:
            raise RuntimeError(f"docker API {path} -> {resp.status}")
        return json.loads(body)
    finally:
        conn.close()


def cpu_percent(stats):
    cpu = stats.get("cpu_stats", {})
    pre = stats.get("precpu_stats", {})
    try:
        cpu_delta = cpu["cpu_usage"]["total_usage"] - pre["cpu_usage"]["total_usage"]
        system_delta = cpu["system_cpu_usage"] - pre.get("system_cpu_usage", 0)
    except (KeyError, TypeError):
        return 0.0
    online = cpu.get("online_cpus") or len(cpu.get("cpu_usage", {}).get("percpu_usage", []) or [1])
    if system_delta > 0 and cpu_delta > 0:
        return (cpu_delta / system_delta) * online * 100.0
    return 0.0


def memory_usage(stats):
    mem = stats.get("memory_stats", {})
    usage = mem.get("usage", 0)
    # Match `docker stats`: subtract reclaimable page cache.
    inactive = (mem.get("stats", {}) or {}).get("inactive_file", 0)
    return max(usage - inactive, 0), mem.get("limit", 0)


def net_bytes(stats):
    rx = tx = 0
    for iface in (stats.get("networks") or {}).values():
        rx += iface.get("rx_bytes", 0)
        tx += iface.get("tx_bytes", 0)
    return rx, tx


def blkio_bytes(stats):
    read = write = 0
    entries = (stats.get("blkio_stats", {}) or {}).get("io_service_bytes_recursive") or []
    for e in entries:
        op = (e.get("op") or "").lower()
        if op == "read":
            read += e.get("value", 0)
        elif op == "write":
            write += e.get("value", 0)
    return read, write


def collect_one(container):
    cid = container["Id"]
    name = (container.get("Names") or ["/" + cid[:12]])[0].lstrip("/")
    try:
        stats = docker_get(f"/containers/{cid}/stats?stream=false")
    except Exception:
        return None
    cpu = cpu_percent(stats)
    mem_usage, mem_limit = memory_usage(stats)
    rx, tx = net_bytes(stats)
    rd, wr = blkio_bytes(stats)
    return {
        "name": name,
        "cpu": cpu,
        "mem_usage": mem_usage,
        "mem_limit": mem_limit,
        "rx": rx,
        "tx": tx,
        "blk_read": rd,
        "blk_write": wr,
        "fs_rw": container.get("SizeRw", 0) or 0,
    }


def render_metrics():
    # size=true makes Docker report SizeRw (writable layer = filesystem usage).
    containers = docker_get("/containers/json?size=true")
    with ThreadPoolExecutor(max_workers=16) as pool:
        rows = [r for r in pool.map(collect_one, containers) if r]

    out = []

    def metric(name, mtype, help_text, samples):
        out.append(f"# HELP {name} {help_text}")
        out.append(f"# TYPE {name} {mtype}")
        for labels, value in samples:
            out.append(f"{name}{{{labels}}} {value}")

    def lbl(r):
        n = r["name"].replace("\\", "\\\\").replace('"', '\\"')
        return f'name="{n}"'

    # Distinct `dockerstats_` namespace so these never clash with cAdvisor's
    # own container_* metrics.
    metric("dockerstats_cpu_percent", "gauge", "Container CPU usage percent.",
           [(lbl(r), round(r["cpu"], 3)) for r in rows])
    metric("dockerstats_memory_usage_bytes", "gauge", "Container memory usage in bytes.",
           [(lbl(r), r["mem_usage"]) for r in rows])
    metric("dockerstats_memory_limit_bytes", "gauge", "Container memory limit in bytes.",
           [(lbl(r), r["mem_limit"]) for r in rows])
    metric("dockerstats_network_receive_bytes_total", "counter", "Container network received bytes.",
           [(lbl(r), r["rx"]) for r in rows])
    metric("dockerstats_network_transmit_bytes_total", "counter", "Container network transmitted bytes.",
           [(lbl(r), r["tx"]) for r in rows])
    metric("dockerstats_blkio_read_bytes_total", "counter", "Container block I/O read bytes.",
           [(lbl(r), r["blk_read"]) for r in rows])
    metric("dockerstats_blkio_write_bytes_total", "counter", "Container block I/O write bytes.",
           [(lbl(r), r["blk_write"]) for r in rows])
    metric("dockerstats_fs_usage_bytes", "gauge", "Container writable layer size in bytes.",
           [(lbl(r), r["fs_rw"]) for r in rows])

    return "\n".join(out) + "\n"


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.rstrip("/") not in ("/metrics", ""):
            self.send_response(404)
            self.end_headers()
            return
        try:
            payload = render_metrics().encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except Exception as exc:  # never crash the scrape
            msg = f"# exporter error: {exc}\n".encode()
            self.send_response(500)
            self.end_headers()
            self.wfile.write(msg)

    def log_message(self, *args):
        pass  # quiet


if __name__ == "__main__":
    print(f"docker-stats-exporter listening on :{LISTEN_PORT}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", LISTEN_PORT), Handler).serve_forever()
