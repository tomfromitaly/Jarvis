#!/usr/bin/env python3
"""
Every time you run the app, the math is recomputed from raw data (Data/ CSVs, PDFs, etc.),
then app.html is regenerated and served.
Run: python launch.py
Then open http://localhost:8765/ in your browser.
"""

import http.server
import re
import subprocess
import sys
import webbrowser
from pathlib import Path

BASE = Path(__file__).parent
APP_HTML = BASE / "app.html"
ENV_PATH = BASE / ".env"
PORT = 8765
PLACEHOLDER = "__OPENAI_API_KEY__"


def refresh_data() -> bool:
    """Run process.py then generate.py so all calculations are redone from raw data. Returns True on success."""
    process_py = BASE / "process.py"
    generate_py = BASE / "generate.py"
    if not process_py.exists() or not generate_py.exists():
        return False
    for name, script in [("process", process_py), ("generate", generate_py)]:
        r = subprocess.run([sys.executable, str(script)], cwd=str(BASE))
        if r.returncode != 0:
            print(f"Warning: {name}.py exited with code {r.returncode}")
            return False
    return True


def load_env_key() -> str:
    if not ENV_PATH.exists():
        return ""
    raw = ENV_PATH.read_text(encoding="utf-8")
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"JARVIS_OPENAI_API_KEY\s*=\s*(.+)", line)
        if m:
            value = m.group(1).strip().strip('"').strip("'")
            return value
    return ""


def escape_js_string(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\r", "\\r")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE), **kwargs)

    def do_GET(self):
        if self.path in ("/", "/index.html", "/app.html"):
            self.serve_app()
        else:
            super().do_GET()

    def serve_app(self):
        if not APP_HTML.exists():
            self.send_error(404, "app.html not found. Run: python process.py && python generate.py")
            return
        body = APP_HTML.read_text(encoding="utf-8")
        key = load_env_key()
        if key:
            body = body.replace(PLACEHOLDER, escape_js_string(key), 1)
        else:
            body = body.replace(PLACEHOLDER, "", 1)
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body.encode("utf-8"))))
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")


def main():
    print("Refreshing data from Data/ (process.py → generate.py)...")
    if not refresh_data():
        if not APP_HTML.exists():
            print("app.html not found. Run: python process.py && python generate.py")
            return
        print("Using existing app.html")
    else:
        print("Data refreshed. Serving app.")
    key = load_env_key()
    if key:
        print("Using JARVIS_OPENAI_API_KEY from .env")
    else:
        print("No JARVIS_OPENAI_API_KEY in .env — you'll be prompted for an API key in the browser.")
    server = http.server.HTTPServer(("127.0.0.1", PORT), Handler)
    url = f"http://127.0.0.1:{PORT}/"
    print(f"Serving at {url}")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.shutdown()


if __name__ == "__main__":
    main()
