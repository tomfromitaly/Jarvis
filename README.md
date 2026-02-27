# Personal CFO

Dashboard and data processor for personal finance (N26, Revolut, AMEX, payslips, investments, trips).

## Quick start

1. Place your data files in `Data/` (N26 Main.csv, N26 Savings.csv, Revolut.csv, AMEX.xlsx, payslip PDFs, etc.).
2. Run `python process.py` to generate `financial_data.json`.
3. Run `python generate.py` to inject data into the template and produce `app.html`.
4. Open `app.html` in a browser (or use `python launch.py` to serve with optional API key injection).

## Net worth: optional balance overrides

Transaction history alone does not provide opening balances, so **net worth is estimated** from the sum of transactions unless you provide current balances.

For accurate net worth, add `Data/balances.json` with your current account balances (copy from `Data/balances.json.example`):

- `n26_main` — N26 main account balance (EUR)
- `n26_savings` — N26 savings/pocket balance (EUR)
- `revolut` — Revolut balance (EUR)
- `amex_outstanding` — AMEX balance owed (EUR; positive = what you owe)

Update these when you run the processor (e.g. monthly). If `balances.json` is missing, the dashboard uses transaction sums and Revolut CSV balance for estimates.

## Metrics

- **Income** is taken from payslip `net_pay` when a payslip exists for that month; otherwise only Tesla payroll deposits (N26) are counted.
- **This month spend** shows personal spend only; work travel on AMEX is excluded (reimbursed later).
- **Savings rate** = (income − personal spend) / income.
- **Pending work reimbursements** are included in net worth as “owed by Tesla” and shown in insights.
