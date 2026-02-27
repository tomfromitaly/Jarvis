#!/usr/bin/env python3
"""
Reads financial_data.json and template.html; outputs app.html with JSON embedded.
"""

import json
from pathlib import Path

BASE = Path(__file__).parent
JSON_PATH = BASE / "financial_data.json"
TEMPLATE_PATH = BASE / "template.html"
OUTPUT_PATH = BASE / "app.html"
PLACEHOLDER = "__FINANCIAL_DATA__"


def main():
    with open(JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)
    with open(TEMPLATE_PATH, encoding="utf-8") as f:
        html = f.read()
    if PLACEHOLDER not in html:
        raise SystemExit(f"Placeholder {PLACEHOLDER!r} not found in template")
    json_str = json.dumps(data, ensure_ascii=False)
    json_str = json_str.replace("</", "<\\/")  # avoid breaking out of script tag
    html = html.replace(PLACEHOLDER, json_str)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
