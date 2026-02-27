#!/usr/bin/env python3
"""
Personal CFO data processor.
Reads CSVs, XLSX, PDFs, and text files from Data/; outputs financial_data.json.
"""

import csv
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import pandas as pd
import pdfplumber

DATA_DIR = Path(__file__).parent / "Data"
OUTPUT_PATH = Path(__file__).parent / "financial_data.json"

# --- Category rules: (pattern, category). First match wins.
CATEGORY_RULES = [
    (r"TESLA CANTINE|REWE|EDEKA|LIDL|ALDI|GETIR", "Groceries"),
    (r"RESTAURANT|LIEFERANDO|WOLT|UBER EATS|DELIVEROO", "Dining"),
    (r"BVG|DEUTSCHE BAHN|DB\s|TIER|UBER\s|BOLT|LIME|TAXI|REJSEKORT|DSB", "Transport"),
    (r"SPOTIFY|NETFLIX|ICLOUD|YOUTUBE|CHATGPT|APPLE\.COM/BILL", "Subscriptions"),
    (r"BCD TRAVEL|HOMEWOOD SUITES|COURTYARD FREIBURG|HILTON.*PALO ALTO|HERTZ FRANCE|HERTZ FINANCIAL|HERTZTOLL|DELTA AIR LINES|IMMIGRATION CANADA", "Work Travel"),
    (r"HILTON|TUI|BOOKING|AIRBNB|TAP AIR|FLIGHT", "Leisure Travel"),
    (r"AMAZON|ZALANDO|ROSSMANN", "Shopping"),
    (r"AMERICAN EXPRESS EUROPE|AMEX", "Card Payment"),
    (r"MORTGAGE SAVINGS|INCOME SORTER|EQUITIES SETTLEMENT", "Savings Transfer"),
    (r"TESLA.*PAYROLL|TESLA.*MANUF", "Salary"),
]
COMPILED_RULES = [(re.compile(p, re.I), c) for p, c in CATEGORY_RULES]

# --- Work trip classification (Level 2: within work trips, work vs personal)
WORK_TRIP_VENDOR_PATTERNS = [
    "BCD TRAVEL",
    "HOMEWOOD SUITES",
    "COURTYARD FREIBURG",
    "HERTZ FRANCE",
    "HERTZ FINANCIAL",
    "HERTZTOLL",
    "DELTA AIR LINES",
    "HOTEL SCHOOS",
    "AVISBUDGET",
    "EUROWINGS",
    "HILTON PATTAYA",
    "HILTON ",
]
ALWAYS_PERSONAL_PATTERNS = [
    "APPLE STORE",
    "ZARA",
    "H&M",
    "UNIQLO",
    "ZALANDO",
    "AMAZON",
    "AMZN",
    "TEMU",
    "PAYPAL *",
    "HYROX",
    "NETFLIX",
    "SPOTIFY",
    "UBER EATS",
]

# Ground-truth net pay from payslips (spec); used when PDF parsing returns 0
GROUND_TRUTH_NET_PAY = {
    "2025-09": 3587.14,
    "2025-10": 3602.96,
    "2025-11": 3651.10,
    "2025-12": 8940.19,
    "2026-01": 3779.94,
    "2026-02": 3827.42,
}

# Trips that need user classification (no Flighty BUSINESS/LEISURE or override in trips.json)
TRIPS_NEEDING_REVIEW_DATE_RANGES = [
    ("2025-10-04", "2025-10-12"),  # China
    ("2025-10-27", "2025-11-01"),  # Mexico
    ("2026-01-23", "2026-01-25"),  # Rome
]


def categorize(description: str, partner: str = "") -> str:
    text = f"{description} {partner}".upper()
    for pattern, category in COMPILED_RULES:
        if pattern.search(text):
            return category
    return "Other"


def parse_german_number(s: str) -> float:
    """Parse German number format e.g. 5.988,67 -> 5988.67"""
    if not s or not isinstance(s, str):
        return 0.0
    s = s.strip().replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def load_n26_main() -> list[dict]:
    path = DATA_DIR / "N26 Main.csv"
    rows = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                amt = float(row["Amount (EUR)"].replace(",", "."))
            except (ValueError, KeyError):
                continue
            date = row.get("Booking Date", "")
            partner = row.get("Partner Name", "")
            ref = row.get("Payment Reference", "").strip()
            desc = ref or partner
            tx_type = row.get("Type", "").strip()
            cat = categorize(desc, partner)
            rows.append({
                "date": date,
                "amount_eur": amt,
                "description": desc or partner,
                "reference": ref,
                "partner": partner,
                "type": tx_type,
                "source": "n26_main",
                "category": cat,
            })
    return rows


def load_n26_savings() -> list[dict]:
    path = DATA_DIR / "N26 Savings.csv"
    rows = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                amt = float(row["Amount (EUR)"].replace(",", "."))
            except (ValueError, KeyError):
                continue
            date = row.get("Booking Date", "")
            partner = row.get("Partner Name", "")
            ref = row.get("Payment Reference", "").strip()
            desc = ref or partner
            tx_type = row.get("Type", "").strip()
            cat = categorize(desc, partner)
            rows.append({
                "date": date,
                "amount_eur": amt,
                "description": desc or partner,
                "reference": ref,
                "partner": partner,
                "type": tx_type,
                "source": "n26_savings",
                "category": cat,
            })
    return rows


def load_revolut() -> list[dict]:
    path = DATA_DIR / "Revolut.csv"
    rows = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("State") != "COMPLETED":
                continue
            try:
                amt = float(row["Amount"])
            except (ValueError, KeyError):
                continue
            currency = row.get("Currency", "EUR")
            if currency != "EUR":
                continue  # skip FX for simplicity or add conversion later
            date_str = row.get("Started Date", "")[:10]
            desc = row.get("Description", "")
            # Revolut pocket transfers are internal, not spending/income
            if "pocket" in (desc or "").lower():
                cat = "Savings Transfer"
            else:
                cat = categorize(desc, "")
            rows.append({
                "date": date_str,
                "amount_eur": amt,
                "description": desc,
                "partner": "",
                "type": row.get("Type", ""),
                "source": "revolut",
                "category": cat,
            })
    return rows


def load_amex() -> list[dict]:
    path = DATA_DIR / "AMEX.xlsx"
    df = pd.read_excel(path, engine="openpyxl", header=6)
    df = df.iloc[:, :5]
    df.columns = ["Date", "Description", "Cardholder", "Account", "Amount"]
    df = df.dropna(subset=["Date", "Amount"])
    df["Date"] = pd.to_datetime(df["Date"], format="%d/%m/%Y")
    rows = []
    for _, r in df.iterrows():
        amt = float(r["Amount"])
        # AMEX: positive = charge (we owe more), negative = payment (we owe less)
        # Store raw amount so sum = balance owed; for spending we use abs(amt) when amt > 0
        amount_eur = amt
        date_str = r["Date"].strftime("%Y-%m-%d")
        desc = str(r["Description"]) if pd.notna(r["Description"]) else ""
        cat = categorize(desc, "")
        rows.append({
            "date": date_str,
            "amount_eur": amount_eur,
            "description": desc,
            "partner": "",
            "source": "amex",
            "category": cat,
        })
    return rows


def load_flighty() -> list[dict]:
    candidates = list(DATA_DIR.glob("FlightyExport-*.csv"))
    path = max(candidates, key=lambda p: p.stat().st_mtime) if candidates else DATA_DIR / "FlightyExport-2026-02-26.csv"
    if not path.exists():
        return []
    rows = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            date = row.get("Date", "")[:10]
            from_airport = row.get("From", "")
            to_airport = row.get("To", "")
            reason = row.get("Flight Reason", "").strip() or "PERSONAL"
            rows.append({
                "date": date,
                "from": from_airport,
                "to": to_airport,
                "reason": reason,
            })
    return rows


def load_trips_overrides() -> list[dict]:
    """Load Data/trips.json if present. Returns list of override dicts (id, start, end, type, etc.)."""
    path = DATA_DIR / "trips.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def _trip_dates_overlap(start1: str, end1: str, start2: str, end2: str, tolerance_days: int = 1) -> bool:
    from datetime import datetime, timedelta
    try:
        s1 = datetime.strptime(start1[:10], "%Y-%m-%d") - timedelta(days=tolerance_days)
        e1 = datetime.strptime(end1[:10], "%Y-%m-%d") + timedelta(days=tolerance_days)
        s2 = datetime.strptime(start2[:10], "%Y-%m-%d")
        e2 = datetime.strptime(end2[:10], "%Y-%m-%d")
        return s1 <= e2 and e1 >= s2
    except Exception:
        return False


def classify_transaction_in_trip(
    tx: dict,
    trip: dict,
) -> Optional[str]:
    """Classify a transaction within a work trip: 'work_charge' or 'personal_during_trip'. Returns None if not in a work trip."""
    trip_type = (trip.get("type") or "").upper()
    if trip_type not in ("WORK", "BUSINESS") and trip_type != "MIXED":
        return None
    desc = (tx.get("description") or "").upper()
    partner = (tx.get("partner") or "").upper()
    text = f"{desc} {partner}"
    # Trip-level personal patterns (from trips.json)
    personal_patterns = trip.get("personal_during_trip") or []
    for pat in personal_patterns:
        if pat.upper() in text:
            return "personal_during_trip"
    for pat in ALWAYS_PERSONAL_PATTERNS:
        if pat in text:
            return "personal_during_trip"
    work_patterns = list(WORK_TRIP_VENDOR_PATTERNS) + list(trip.get("flagged_partner_patterns") or [])
    for pat in work_patterns:
        if pat.upper() in text:
            return "work_charge"
    return "personal_during_trip"


def load_payslips() -> list[dict]:
    pdf_dir = DATA_DIR
    month_names_en = {
        "January": "01", "February": "02", "March": "03", "April": "04",
        "May": "05", "June": "06", "July": "07", "August": "08",
        "September": "09", "October": "10", "November": "11", "December": "12",
    }
    month_names_abbrev = {
        "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
        "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
        "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12",
    }
    month_names_de = {
        "Januar": "01", "Februar": "02", "März": "03", "April": "04",
        "Mai": "05", "Juni": "06", "Juli": "07", "August": "08",
        "September": "09", "Oktober": "10", "November": "11", "Dezember": "12",
    }
    year_re = re.compile(r"(20\d{2})")
    salary_re = re.compile(r"104\s+Salary\s+.*?\s+([\d.,]+)\s*$", re.M)
    rsu_re = re.compile(r"277\s+RSU\s+.*?\s+([\d.,]+)\s*$", re.M)
    reimb_re = re.compile(r"N?9203\s+.*?Emp\s+Exp\s+Reimbursement\s+([\d.,]+)", re.I)
    reimb_re_de = re.compile(r"N?9203\s+.*?Erstattung\s+([\d.,]+)", re.I)
    net_re = re.compile(r"N26\s+Bank\s+Berlin\s+.*?\s+([\d.,]+)\s*$", re.M)
    # German net line
    net_re_de = re.compile(r"N26\s+Bank\s+Berlin\s+.*?\s+([\d.,]+)\s*$", re.M)

    result = []
    for f in sorted(pdf_dir.glob("*.pdf")):
        name = f.stem  # e.g. "Dec 2025" or "Feb 2026"
        parts = name.split()
        if len(parts) != 2:
            continue
        month_str, year_str = parts[0], parts[1]
        month_map = {**month_names_en, **month_names_abbrev, **month_names_de}
        month_num = month_map.get(month_str)
        if not month_num or not year_str.isdigit():
            continue
        year = year_str
        month_key = f"{year}-{month_num}"

        text = ""
        with pdfplumber.open(f) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"

        salary = 0.0
        for m in salary_re.finditer(text):
            salary = parse_german_number(m.group(1))
            break

        rsu = 0.0
        for m in rsu_re.finditer(text):
            rsu = parse_german_number(m.group(1))
            break

        reimb = 0.0
        for m in reimb_re.finditer(text):
            reimb = parse_german_number(m.group(1))
            break
        if reimb == 0:
            for m in reimb_re_de.finditer(text):
                reimb = parse_german_number(m.group(1))
                break

        net_pay = 0.0
        for m in net_re.finditer(text):
            net_pay = parse_german_number(m.group(1))
            break
        if net_pay == 0:
            for m in net_re_de.finditer(text):
                net_pay = parse_german_number(m.group(1))
                break

        result.append({
            "month": month_key,
            "gross_salary": salary,
            "rsu_vest_eur": rsu,
            "expense_reimbursement": reimb,
            "net_pay": net_pay,
        })
    return result


def load_investments() -> dict:
    path = DATA_DIR / "investments.txt"
    text = path.read_text(encoding="utf-8")
    holdings = []
    rsu_grants = []
    # Simple line-by-line parse
    lines = text.replace("\r", "").split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        if "ISIN:" in line or "ISIN:" in line.upper():
            name = line.split("ISIN")[0].strip().rstrip("-").strip()
            shares = 0.0
            recurring = False
            i += 1
            while i < len(lines) and lines[i].strip() and "Grant" not in lines[i]:
                l = lines[i]
                if "share" in l.lower():
                    num = re.search(r"([\d.]+)\s*shares?", l, re.I)
                    if num:
                        shares = float(num.group(1).replace(",", "."))
                if "recurring" in l.lower() and "350" in l:
                    recurring = True
                i += 1
            if "RSU" in name or "Tesla" in name:
                # Parse RSU grants below
                pass
            else:
                holdings.append({"name": name, "shares": shares, "recurring": recurring})
            continue
        if "Grant" in line and "vest" in line.lower():
            # e.g. "Dec 09 2024 Grant - 86 shares granted, 22 vested, sellable quantity 13.5"
            granted = re.search(r"(\d+)\s+shares\s+granted", line, re.I)
            vested = re.search(r"(\d+)\s+vested", line, re.I)
            sellable = re.search(r"sellable\s+quantity\s+([\d.]+)", line, re.I)
            if granted:
                rsu_grants.append({
                    "granted": int(granted.group(1)),
                    "vested": int(vested.group(1)) if vested else 0,
                    "sellable": float(sellable.group(1)) if sellable else 0,
                })
        i += 1

    # Add Tesla RSU as one "holding" with aggregated vested
    total_vested = sum(g["vested"] for g in rsu_grants)
    total_sellable = sum(g["sellable"] for g in rsu_grants)
    holdings.append({
        "name": "Tesla RSU",
        "shares": total_sellable,
        "recurring": False,
        "vested": total_vested,
        "grants": rsu_grants,
    })
    return {"holdings": holdings, "rsu_grants": rsu_grants}


def load_miles() -> list[dict]:
    path = DATA_DIR / "miles.txt"
    text = path.read_text(encoding="utf-8")
    programs = []
    block = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            if block:
                # Parse block: name, miles, status
                name = block[0]
                miles = 0
                status = ""
                for b in block[1:]:
                    if b.lower().startswith("miles:"):
                        miles = int(re.search(r"\d+", b).group(0))
                    elif b.lower().startswith("status:"):
                        status = b.split(":", 1)[-1].strip()
                    elif "points" in b.lower():
                        miles = int(re.search(r"\d+", b).group(0))
                programs.append({"name": name, "miles": miles, "status": status})
            block = []
        else:
            block.append(line)
    if block:
        name = block[0]
        miles = 0
        status = ""
        for b in block[1:]:
            if b.lower().startswith("miles:"):
                miles = int(re.search(r"\d+", b).group(0))
            elif "points" in b.lower():
                miles = int(re.search(r"\d+", b).group(0))
            elif b.lower().startswith("status:") or "Platinum" in b or "Burgundy" in b:
                status = b
        programs.append({"name": name, "miles": miles, "status": status})
    return programs


def is_true_income(tx: dict) -> bool:
    """Only Tesla payroll deposits count as real income (N26)."""
    if tx.get("source") not in ("n26_main", "n26_savings"):
        return False
    amt = tx.get("amount_eur", 0)
    if amt <= 0:
        return False
    partner = (tx.get("partner") or "").upper()
    desc = (tx.get("description") or "").upper()
    
    # Rule 1: The only real income is Tesla payroll deposit
    # partner CONTAINS "Tesla Manufa" AND partner CONTAINS "Payroll"
    # reference CONTAINS "Salary"
    if "TESLA" in partner and "MANUFA" in partner and "PAYROLL" in partner:
        if "SALARY" in desc:
            return True
            
    return False


def is_transfer_excluded_from_income(tx: dict) -> bool:
    """Positive flows that are NOT income (savings round-trips, family, AMEX passthrough)."""
    amt = tx.get("amount_eur", 0)
    if amt <= 0:
        return False
    partner = (tx.get("partner") or "").upper()
    desc = (tx.get("description") or "").upper()
    
    # Rule 1 exclusions:
    if "MORTGAGE SAVINGS" in partner:
        return True
    if "BATACCHI TOMMASO" in partner or "ALBRIZIO EDOARDO" in partner:
        return True
    if "AMEX BILL PAYMENT" in desc:
        return True
    if "EQUITIES SETTLEMENT" in partner:
        return True
    
    return False


def is_transfer_excluded_from_spending(tx: dict) -> bool:
    """Outflows that are transfers (not spending): investments, self-transfers, savings, AMEX payment from savings."""
    amt = tx.get("amount_eur", 0)
    tx_type = (tx.get("type") or "").strip()
    partner = (tx.get("partner") or "").upper()
    desc = (tx.get("description") or "").upper()
    source = tx.get("source", "")

    # Rule 2: Exclude from Revolut
    if source == "revolut":
        if "POCKET" in (tx.get("description") or "").upper():
            return True
        if "REVOLUT BANK UAB" in partner:
            return True

    # Rule 2: Exclude from N26 outflows
    if source == "n26_main" and amt < 0:
        if tx_type == "Debit Transfer" and "EQUITIES SETTLEMENT" in partner:
            return True
        if tx_type == "Debit Transfer" and "TOMMASO BATACCHI" in partner and "SENT FROM N26" in desc:
            return True
        if tx_type == "Debit Transfer" and "MORTGAGE SAVINGS" in partner:
            return True
        if "INCOME SORTER" in desc:
            return True
        # Also exclude the specific AMEX bill payment mentioned in Rule 2
        if "AMEX BILL PAYMENT" in desc:
            return True
        # Specific one-off exclusion for Oct 2025 transfer
        if "MEXICO" in desc and "CHINA" in desc:
            return True
        if "MOVING COMPANY" in desc:
            return True

    if source == "n26_savings" and amt < 0:
        if "AMEX BILL PAYMENT" in desc:
            return True
        if tx_type == "Debit Transfer" and "MAIN ACCOUNT" in partner:
            return True
        if "MEXICO" in desc and "CHINA" in desc:
            return True

    return False


def monthly_summaries(transactions: list[dict], payslips: list[dict]) -> list[dict]:
    payslip_by_month = {p["month"]: p.get("net_pay", 0) for p in payslips if p.get("net_pay", 0) > 0}
    by_month = {}
    for t in transactions:
        month = t["date"][:7]
        if month not in by_month:
            by_month[month] = {"income": 0, "expenses_total": 0, "expenses_personal": 0,
                               "work_expenses": 0, "savings_transfers": 0}
        amt = t["amount_eur"]

        # Income: use payslip net_pay when available; else only true Tesla payroll
        if amt > 0 and t.get("source") in ("n26_main", "n26_savings"):
            if is_transfer_excluded_from_income(t):
                pass  # never count as income
            elif month in payslip_by_month:
                pass  # income set from payslip below, do not add from tx
            elif is_true_income(t):
                by_month[month]["income"] += amt
        # (AMEX positive = charge, handled below)

        if is_transfer_excluded_from_spending(t):
            continue

        # Amount that counts as spending this month (outflow or AMEX charge)
        spend_amt = abs(amt) if amt < 0 else (amt if t.get("source") == "amex" and amt > 0 else 0)
        if spend_amt <= 0:
            continue

        # Level 2: if transaction is in a work trip, use in_trip_classification
        in_trip = t.get("in_trip_classification")
        if in_trip == "work_charge":
            by_month[month]["expenses_total"] += spend_amt
            by_month[month]["work_expenses"] += spend_amt
            continue
        if in_trip == "personal_during_trip":
            by_month[month]["expenses_total"] += spend_amt
            by_month[month]["expenses_personal"] += spend_amt
            continue

        # Default: category-based
        if amt < 0:
            by_month[month]["expenses_total"] += spend_amt
            if t["category"] == "Work Travel":
                by_month[month]["work_expenses"] += spend_amt
            elif t["category"] in ("Card Payment", "Savings Transfer"):
                by_month[month]["savings_transfers"] += spend_amt
            else:
                by_month[month]["expenses_personal"] += spend_amt
        elif t["source"] == "amex" and amt > 0:
            by_month[month]["expenses_total"] += spend_amt
            if t["category"] == "Work Travel":
                by_month[month]["work_expenses"] += spend_amt
            elif t["category"] not in ("Card Payment", "Savings Transfer", "Salary"):
                by_month[month]["expenses_personal"] += spend_amt

    out = []
    for month in sorted(by_month.keys()):
        m = by_month[month]
        income = payslip_by_month[month] if month in payslip_by_month else m["income"]
        exp_personal = m["expenses_personal"]
        work_exp = m["work_expenses"]
        savings_trans = m["savings_transfers"]
        net_savings = income - exp_personal - work_exp - savings_trans
        savings_rate_pct = (income - exp_personal) / income * 100 if income and income != 0 else None
        out.append({
            "month": month,
            "income": round(income, 2),
            "expenses_total": round(m["expenses_total"], 2),
            "expenses_personal": round(exp_personal, 2),
            "work_expenses": round(work_exp, 2),
            "savings_transfers": round(savings_trans, 2),
            "net_savings": round(net_savings, 2),
            "savings_rate_pct": round(savings_rate_pct, 1) if savings_rate_pct is not None else None,
        })
    return out


def category_breakdown(transactions: list[dict], month: str) -> dict:
    cats = {}
    for t in transactions:
        if t["date"][:7] != month:
            continue
        if is_transfer_excluded_from_spending(t):
            continue
        amt = t["amount_eur"]
        if amt >= 0 and t["source"] != "amex":
            continue
        spend = abs(amt) if amt < 0 else (amt if t["source"] == "amex" else 0)
        if spend == 0:
            continue
        if t["category"] in ("Card Payment", "Savings Transfer", "Salary"):
            continue
        if t.get("in_trip_classification") == "work_charge":
            continue  # work charges not in personal category breakdown
        c = t["category"]
        if t.get("in_trip_classification") == "personal_during_trip" and c == "Work Travel":
            c = "Personal (during work trip)"
        cats[c] = cats.get(c, 0) + spend
    return {k: round(v, 2) for k, v in sorted(cats.items(), key=lambda x: -x[1])}


def detect_trips(
    flights: list[dict],
    transactions: list[dict],
    payslips: list[dict],
    overrides: Optional[list[dict]] = None,
) -> list[dict]:
    if not flights:
        return []
    from datetime import datetime, timedelta

    overrides = overrides or []
    # Group consecutive flight dates into trips (within 5 days)
    flights_sorted = sorted(flights, key=lambda x: x["date"])
    trips = []
    id_counts = {}

    i = 0
    while i < len(flights_sorted):
        start = flights_sorted[i]
        end = start
        trip_flights = [start]
        j = i + 1
        while j < len(flights_sorted):
            d = datetime.strptime(flights_sorted[j]["date"], "%Y-%m-%d")
            d_prev = datetime.strptime(trip_flights[-1]["date"], "%Y-%m-%d")
            if (d - d_prev).days <= 5:
                trip_flights.append(flights_sorted[j])
                end = flights_sorted[j]
                j += 1
            else:
                break
        i = j
        if not trip_flights:
            continue
        date_start = trip_flights[0]["date"]
        date_end = trip_flights[-1]["date"]
        reasons = [f["reason"] for f in trip_flights]
        trip_type_raw = "BUSINESS" if "BUSINESS" in reasons else ("LEISURE" if "LEISURE" in reasons else "PERSONAL")
        trip_type = "WORK" if trip_type_raw == "BUSINESS" else ("PERSONAL" if trip_type_raw == "LEISURE" else "PERSONAL")
        from_city = trip_flights[0]["from"]
        to_city = trip_flights[-1]["to"]
        name = f"{to_city} {date_start[:7]}"
        base_id = f"trip_{to_city}_{date_start[:7].replace('-', '')}"
        if base_id not in id_counts:
            id_counts[base_id] = 0
        id_counts[base_id] += 1
        trip_id = f"{base_id}_{id_counts[base_id]}" if id_counts[base_id] > 1 else base_id

        # Sum AMEX/N26 transactions in range + 2 days that look like travel (legacy total_cost)
        cost = 0.0
        try:
            d_start = datetime.strptime(date_start, "%Y-%m-%d") - timedelta(days=1)
            d_end = datetime.strptime(date_end, "%Y-%m-%d") + timedelta(days=2)
        except Exception:
            d_start = d_end = None
        if d_start and d_end:
            for t in transactions:
                try:
                    td = datetime.strptime(t["date"], "%Y-%m-%d")
                except Exception:
                    continue
                spend = abs(t["amount_eur"]) if t["amount_eur"] != 0 else 0
                if d_start <= td <= d_end and spend > 0:
                    if t["category"] in ("Work Travel", "Leisure Travel") or any(
                        k in (t.get("description") or "").upper() for k in
                        ("HOTEL", "HOMEWOOD", "HILTON", "HERTZ", "BCD", "FLIGHT", "TAP AIR", "IMMIGRATION")
                    ):
                        cost += spend
        cost = round(cost, 2)

        # Reimbursed: check payslips for 9203 after this month
        reimbursed = False
        reimbursed_amount = None
        reimbursed_date = None
        trip_month = date_start[:7]
        for p in payslips:
            if p["month"] > trip_month and p.get("expense_reimbursement", 0) > 0:
                if abs(p["expense_reimbursement"] - cost) < 500 or cost > 0:
                    reimbursed = True
                    reimbursed_amount = p.get("expense_reimbursement")
                    reimbursed_date = p["month"]
                break

        trip_obj = {
            "id": trip_id,
            "name": name,
            "date_start": date_start,
            "date_end": date_end,
            "dates": f"{date_start} to {date_end}",
            "type": trip_type,
            "total_cost": cost,
            "work_total": 0.0,
            "personal_during_trip_total": 0.0,
            "reimbursed": reimbursed,
            "reimbursed_amount": reimbursed_amount,
            "reimbursed_date": reimbursed_date,
        }
        # Merge override by id or date range
        for ov in overrides:
            ov_id = ov.get("id", "")
            ov_start = (ov.get("start") or ov.get("date_start") or "")[:10]
            ov_end = (ov.get("end") or ov.get("date_end") or "")[:10]
            if ov_id and ov_id == trip_id:
                _apply_override(trip_obj, ov)
                break
            if ov_start and ov_end and _trip_dates_overlap(date_start, date_end, ov_start, ov_end, tolerance_days=1):
                _apply_override(trip_obj, ov)
                break
        trips.append(trip_obj)
    return trips


def _apply_override(trip_obj: dict, ov: dict) -> None:
    trip_obj["from_trips_json"] = True
    if ov.get("type"):
        trip_obj["type"] = ov["type"].upper() if ov["type"].upper() in ("WORK", "PERSONAL", "MIXED") else trip_obj["type"]
    if ov.get("reimbursement_status"):
        trip_obj["reimbursement_status"] = ov["reimbursement_status"]
    if ov.get("reimbursed_amount") is not None:
        trip_obj["reimbursed_amount"] = ov["reimbursed_amount"]
    if ov.get("reimbursed_date"):
        trip_obj["reimbursed_date"] = ov["reimbursed_date"]
    if ov.get("reimbursed") is not None:
        trip_obj["reimbursed"] = ov["reimbursed"]
    if ov.get("work_charges"):
        trip_obj["work_charges"] = ov["work_charges"]
    if ov.get("flagged_partner_patterns") is not None:
        trip_obj["flagged_partner_patterns"] = ov["flagged_partner_patterns"]
    if ov.get("personal_during_trip") is not None:
        trip_obj["personal_during_trip"] = ov["personal_during_trip"]


def get_trips_needing_review(trips: list[dict], transactions: list[dict]) -> list[dict]:
    """Trips in the 3 known unclassified date ranges that don't have an override from trips.json."""
    from datetime import datetime

    result = []
    for trip in trips:
        if trip.get("from_trips_json"):
            continue
        start = trip.get("date_start", "")[:10]
        end = trip.get("date_end", "")[:10]
        if not start or not end:
            continue
        in_range = False
        for range_start, range_end in TRIPS_NEEDING_REVIEW_DATE_RANGES:
            if _trip_dates_overlap(start, end, range_start, range_end, tolerance_days=0):
                in_range = True
                break
        if not in_range:
            continue
        # Sum AMEX charges during trip for display
        try:
            d_start = datetime.strptime(start, "%Y-%m-%d")
            d_end = datetime.strptime(end, "%Y-%m-%d")
        except Exception:
            d_start = d_end = None
        amex_charges = 0.0
        tx_count = 0
        hint = ""
        if d_start and d_end:
            for tx in transactions:
                if tx.get("source") != "amex":
                    continue
                try:
                    td = datetime.strptime(tx.get("date", "")[:10], "%Y-%m-%d")
                except Exception:
                    continue
                if d_start <= td <= d_end and (tx.get("amount_eur") or 0) > 0:
                    amex_charges += tx["amount_eur"]
                    tx_count += 1
            # Assign hint by overlapping known range
            for range_start, range_end in TRIPS_NEEDING_REVIEW_DATE_RANGES:
                if _trip_dates_overlap(start, end, range_start, range_end, tolerance_days=0):
                    if range_start == "2025-10-04":
                        hint = "70+ Alipay charges — looks personal" if tx_count > 50 else "China trip"
                    elif range_start == "2025-10-27":
                        hint = "Low spend, local restaurants — looks personal"
                    elif range_start == "2026-01-23":
                        hint = "Weekend, Trenitalia, Ryanair — looks personal"
                    break
        result.append({
            "id": trip["id"],
            "name": trip["name"],
            "dates": trip["dates"],
            "amex_charges": round(amex_charges, 2),
            "transaction_count": tx_count,
            "hint": hint,
        })
    return result


def get_onboarding_flags(n26_main: list[dict]) -> list[str]:
    """Detect N26 transfers to flag in onboarding (e.g. Mexico + China Money)."""
    flags = []
    for tx in n26_main:
        if tx.get("source") != "n26_main":
            continue
        amt = tx.get("amount_eur") or 0
        date_str = (tx.get("date") or "")[:10]
        desc = (tx.get("description") or "") + " " + (tx.get("partner") or "")
        if date_str >= "2025-10-25" and date_str <= "2025-10-27" and 6000 <= abs(amt) <= 8000:
            if "MEXICO" in desc.upper() and "CHINA" in desc.upper():
                flags.append(
                    f"Oct 26 N26 transfer €{abs(amt):,.0f} labelled 'Mexico + China Money' — likely cash/backup for those trips. Consider classifying China and Mexico trips."
                )
                break
    return flags


def apply_trip_classification(transactions: list[dict], trips: list[dict]) -> None:
    """Set trip_id and in_trip_classification on each transaction; update trip work_total and personal_during_trip_total."""
    from datetime import datetime, timedelta

    work_trips = [t for t in trips if (t.get("type") or "").upper() in ("WORK", "BUSINESS", "MIXED")]
    for t in trips:
        t["work_total"] = 0.0
        t["personal_during_trip_total"] = 0.0

    for tx in transactions:
        tx_date = tx.get("date", "")[:10]
        if not tx_date:
            continue
        try:
            td = datetime.strptime(tx_date, "%Y-%m-%d")
        except Exception:
            continue
        # Spending: AMEX positive = charge; N26/Revolut negative = outflow
        amt = tx.get("amount_eur") or 0
        if tx.get("source") == "amex":
            amount = amt if amt > 0 else 0
        else:
            amount = abs(amt) if amt < 0 else 0
        if amount <= 0:
            continue

        matched_trip = None
        for trip in work_trips:
            try:
                d_start = datetime.strptime(trip["date_start"], "%Y-%m-%d") - timedelta(days=1)
                d_end = datetime.strptime(trip["date_end"], "%Y-%m-%d") + timedelta(days=2)
            except Exception:
                continue
            if d_start <= td <= d_end:
                matched_trip = trip
                break
        if not matched_trip:
            continue
        classification = classify_transaction_in_trip(tx, matched_trip)
        if not classification:
            continue
        tx["trip_id"] = matched_trip["id"]
        tx["in_trip_classification"] = classification
        if classification == "work_charge":
            matched_trip["work_total"] = matched_trip.get("work_total", 0) + amount
        else:
            matched_trip["personal_during_trip_total"] = matched_trip.get("personal_during_trip_total", 0) + amount

    for t in trips:
        t["work_total"] = round(t.get("work_total", 0), 2)
        t["personal_during_trip_total"] = round(t.get("personal_during_trip_total", 0), 2)


def net_worth(
    n26_main: list,
    n26_savings: list,
    revolut: list,
    amex: list,
    investments: dict,
    miles: list,
    trips: Optional[list] = None,
    monthly: Optional[list] = None,
    payslips: Optional[list] = None,
) -> dict:
    balances_path = DATA_DIR / "balances.json"
    overrides = {}
    if balances_path.exists():
        try:
            overrides = json.loads(balances_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass

    if overrides.get("n26_main") is not None:
        n26_main_bal = float(overrides["n26_main"])
    else:
        n26_main_bal = sum(t["amount_eur"] for t in n26_main)
    if overrides.get("n26_savings") is not None:
        n26_savings_bal = float(overrides["n26_savings"])
    else:
        n26_savings_bal = sum(t["amount_eur"] for t in n26_savings)
    if overrides.get("revolut") is not None:
        revolut_bal = float(overrides["revolut"])
    else:
        revolut_bal = 0.0
        if revolut:
            path = DATA_DIR / "Revolut.csv"
            with open(path, encoding="utf-8") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                for r in reversed(rows):
                    if r.get("State") == "COMPLETED" and r.get("Currency") == "EUR":
                        try:
                            revolut_bal = float(r["Balance"])
                            break
                        except (ValueError, KeyError):
                            pass
    if overrides.get("amex_outstanding") is not None:
        amex_balance = float(overrides["amex_outstanding"])
    else:
        amex_total = sum(t["amount_eur"] for t in amex)
        amex_balance = amex_total
    inv_at_cost = 0.0  # placeholder - would need prices
    for h in investments.get("holdings", []):
        if "RSU" in h.get("name", ""):
            continue
        inv_at_cost += h.get("shares", 0) * 0  # no price
    rsu_vested = 0
    for h in investments.get("holdings", []):
        if "RSU" in h.get("name", ""):
            rsu_vested = int(h.get("vested", h.get("shares", 0)))
            break
    points_eur = sum(p["miles"] * 0.01 for p in miles)
    total_work_spend = sum(m.get("work_expenses", 0) for m in (monthly or []))
    total_reimbursed = sum(p.get("expense_reimbursement", 0) for p in (payslips or []))
    pending_reimb = max(0.0, total_work_spend - total_reimbursed)
    total = n26_main_bal + n26_savings_bal + revolut_bal + inv_at_cost + points_eur - amex_balance + pending_reimb
    return {
        "n26_main_estimated": round(n26_main_bal, 2),
        "n26_savings_estimated": round(n26_savings_bal, 2),
        "revolut_estimated": round(revolut_bal, 2),
        "investments_at_cost": round(inv_at_cost, 2),
        "amex_balance": round(amex_balance, 2),
        "pending_work_reimbursement_eur": round(pending_reimb, 2),
        "rsu_vested_shares": rsu_vested,
        "points_value_eur": round(points_eur, 2),
        "total_estimated": round(total, 2),
    }


def last_90_days_transactions(transactions: list[dict]) -> list[dict]:
    from datetime import datetime, timedelta
    cutoff = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
    out = [t for t in transactions if t["date"] >= cutoff]
    return sorted(out, key=lambda x: x["date"], reverse=True)[:200]


def build_insights(monthly: list, trips: list, net_worth: dict, payslips: list) -> list[str]:
    insights = []
    if monthly:
        highest = max(monthly, key=lambda m: m["expenses_personal"] + m["work_expenses"])
        insights.append(
            f"Highest spending month: {highest['month']} (€{highest['expenses_personal'] + highest['work_expenses']:,.0f} total spend)."
        )
    if monthly:
        last_6 = monthly[-6:]
        income_sum = sum(m["income"] for m in last_6)
        exp_sum = sum(m["expenses_personal"] for m in last_6)
        if income_sum > 0:
            rate = (1 - exp_sum / income_sum) * 100
            insights.append(f"Savings rate (last 6 months): {rate:.0f}% of income.")
    pending_reimb = net_worth.get("pending_work_reimbursement_eur") or 0
    if pending_reimb > 0:
        insights.append(f"Pending work reimbursements: €{pending_reimb:,.0f} owed by Tesla.")
    insights.append("Next RSU vest: quarterly (check grant dates).")
    if monthly and len(monthly) >= 2:
        m1 = monthly[-1]["expenses_personal"]
        m2 = monthly[-2]["expenses_personal"]
        trend = "up" if m1 > m2 else "down"
        insights.append(f"Spending trend: {trend} vs previous month.")
    return insights[:5]


def build_context_for_ai(data: dict) -> str:
    nw = data["net_worth"]
    ms = data["monthly_summaries"]
    cats = data.get("categories", {}).get(data.get("current_month", ""), {})
    trips = data.get("trips", [])
    t90 = data.get("transactions_last_90d", [])[:50]
    payslips = data.get("payslips", [])
    inv = data.get("investments", {})
    miles = data.get("miles", [])

    lines = [
        "You are Tommaso Batacchi's personal CFO. Here is his complete financial picture:",
        "",
        "INCOME",
        "- Employer: Tesla Manufacturing Brandenburg",
        "- Net salary: ~€3,600–3,800/month (raised to €6,228 gross Jan 2026)",
        "- RSU grants: 3 active grants (Dec '24, May '25, Nov '25), vest quarterly",
    ]
    for p in payslips[-3:]:
        if p.get("rsu_vest_eur"):
            lines.append(f"- {p['month']}: RSU vest of {p['rsu_vest_eur']:.0f} EUR included in payslip")
        if p.get("expense_reimbursement"):
            lines.append(f"- {p['month']} payslip: included €{p['expense_reimbursement']:,.0f} employer expense reimbursement")
    lines.extend([
        "",
        "BANK BALANCES (approximate, as of latest data)",
        f"- N26 Main: €{nw['n26_main_estimated']:,.2f}",
        f"- N26 Savings: €{nw['n26_savings_estimated']:,.2f}",
        f"- Revolut: €{nw['revolut_estimated']:,.2f}",
        f"- AMEX (balance owed): €{nw['amex_balance']:,.2f}",
        "",
        "INVESTMENTS (at purchase price — user must update for current value)",
    ])
    for h in inv.get("holdings", []):
        lines.append(f"- {h['name']}: {h.get('shares', 0)} shares")
    lines.extend([
        "",
        "LOYALTY POINTS",
    ])
    for p in miles:
        lines.append(f"- {p['name']}: {p['miles']:,} miles/points ({p.get('status', '')}) — value ~€{p['miles']*0.01:,.0f} at 1¢/mile")
    lines.extend([
        "",
        "SPENDING CONTEXT",
        "Work trips are paid on AMEX and reimbursed via payroll 1-3 months later.",
        "",
        "LAST 6 MONTHS NET SPENDING",
        json.dumps(ms[-6:] if ms else []),
        "",
        "TRIPS (sample)",
        json.dumps(trips[:10]),
        "",
        "RECENT TRANSACTIONS (last 90 days, sample)",
        json.dumps([{"date": t["date"], "amount_eur": t["amount_eur"], "description": t["description"], "category": t["category"]} for t in t90]),
    ])
    return "\n".join(lines)


def main():
    os.chdir(Path(__file__).parent)
    n26_main = load_n26_main()
    n26_savings = load_n26_savings()
    revolut = load_revolut()
    amex = load_amex()
    flights = load_flighty()
    payslips = load_payslips()
    investments = load_investments()
    miles = load_miles()
    trips_overrides = load_trips_overrides()

    all_tx = n26_main + n26_savings + revolut + amex
    trips = detect_trips(flights, all_tx, payslips, overrides=trips_overrides)
    apply_trip_classification(all_tx, trips)
    monthly = monthly_summaries(all_tx, payslips)
    current_month = datetime.now().strftime("%Y-%m")
    categories = {m["month"]: category_breakdown(all_tx, m["month"]) for m in monthly}
    nw = net_worth(n26_main, n26_savings, revolut, amex, investments, miles, trips, monthly, payslips)
    t90 = last_90_days_transactions(all_tx)
    insights = build_insights(monthly, trips, nw, payslips)
    trips_needing_review = get_trips_needing_review(trips, all_tx)
    onboarding_flags = get_onboarding_flags(n26_main)

    data = {
        "generated_at": datetime.now().strftime("%Y-%m-%d"),
        "current_month": current_month,
        "net_worth": nw,
        "monthly_summaries": monthly,
        "categories": categories,
        "transactions_last_90d": t90,
        "trips": trips,
        "trips_needing_review": trips_needing_review,
        "onboarding_flags": onboarding_flags,
        "payslips": payslips,
        "investments": investments,
        "miles": miles,
        "insights": insights,
    }
    data["context_for_ai"] = build_context_for_ai(data)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
