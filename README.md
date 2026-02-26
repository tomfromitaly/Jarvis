# Jarvis
CFO Dashboard and AI Assistant

---

PROJECT: Personal Financial Command Center

OVERVIEW

Build a local-first personal financial advisor that runs on macOS. This is NOT a chatbot—it's a persistent financial intelligence system that understands my life context, tracks my money across multiple accounts, and provides proactive insights.

The system should feel like having a personal CFO who knows everything about my financial situation and life circumstances.

CORE PHILOSOPHY

1. Local-first: Everything runs on my MacBook. Data never leaves my machine except for optional Claude API calls for complex reasoning.

2. Context-aware: The system understands my life (relationships, work trips, recurring patterns) not just my transactions.

3. Proactive, not reactive: It surfaces insights and warnings without me asking.

4. Minimal friction: Importing data, asking questions, and getting answers should be effortless.

USER PROFILE

I have a complex financial situation with work trips paid personally and reimbursed 1-3 months later. I use three accounts: N26 (primary), AMEX (work expenses), Revolut (travel/secondary). I live with my girlfriend who contributes 750 EUR per month to shared expenses. I travel frequently for work (expenses are 100% reimbursable). I have loyalty points across Miles and More, Flying Blue, and Qatar Privilege Club.

DATA SOURCES

Banking (CSV Import):
- N26: Primary checking, salary deposits, rent, daily expenses
- AMEX: Primarily work expenses, some personal
- Revolut: Travel, foreign currency, secondary spending

Manual Input:
- Work trips (dates, destination, what counts as work expense)
- Life events (moved in with girlfriend, job changes, etc.)
- Future plans (upcoming trips, large purchases)
- Loyalty point balances

TECHNICAL STACK

Required:
- Python 3.11+ as core language
- SQLite for local database, single file, no server
- Streamlit for dashboard UI
- Pandas for data processing
- Ollama with Llama 3.1 8B for local LLM categorization (no API costs)

Optional:
- Claude API for complex advisory questions (user provides own key)
- Playwright for browser automation for CSV downloads

HIGH-LEVEL ARCHITECTURE

The system has five layers:

LAYER 1 - PRESENTATION LAYER
Streamlit Dashboard with these views:
- Overview (balances, trends, alerts)
- Transactions (searchable, filterable)
- Work Trips (manage, track reimbursements)
- Projections (scenarios, forecasts)
- Advisor (natural language interface)

LAYER 2 - INTELLIGENCE LAYER
Three components working together:
- Ollama (Local): Categorize transactions, summarize patterns, extract entities
- Claude (API): Complex Q&A, life advice, sophisticated projections
- Rule Engine (Python): Pattern detection, anomaly alerts, auto-tagging

LAYER 3 - ANALYSIS LAYER
Three modules:
- Balances: True balance calculation, by-account breakdown, pending reimbursements
- Patterns: Spending trends, seasonal analysis, anomaly detection
- Projections: Cash flow forecast, scenario modeling, "can I afford X" logic

LAYER 4 - DATA LAYER
SQLite Database with these tables:
- transactions
- work_trips
- life_events
- people
- recurring
- loyalty_programs
- categories
- projections
- settings

LAYER 5 - INGESTION LAYER
Three input methods:
- CSV Parsers: N26, AMEX, Revolut
- Manual Input: Trips, events, goals
- Browser Automation (optional): Auto-download CSVs via Playwright

DATABASE SCHEMA

Design a normalized SQLite schema with these core entities:

TRANSACTIONS TABLE
Core financial data from all accounts. Must handle deduplication across imports. Links to work_trips, people, categories. Tracks reimbursement status for work expenses.

WORK_TRIPS TABLE
Destination, dates, classification rules. Auto-tags transactions within date/location range. Tracks reimbursement lifecycle (submitted, pending, received).

LIFE_EVENTS TABLE
Major life changes that affect financial patterns. Examples: moved in with girlfriend, started new job, trip to Paris. Used to explain pattern changes and segment historical analysis.

PEOPLE TABLE
Relationships with financial implications. Partner contributions, expense splitting patterns. Employer info for reimbursement tracking.

RECURRING TABLE
Subscriptions and regular payments. Expected amounts, frequency, category. Alerts when amounts change unexpectedly.

LOYALTY_PROGRAMS TABLE
Points balances across programs. Expiry tracking and alerts.

CATEGORIES TABLE
Hierarchical spending categories. User-customizable. Mapping rules (merchant patterns to category).

KEY FEATURES

FEATURE 1: TRUE BALANCE CALCULATION
Not just sum of accounts, but:
- Current account balances
- Minus upcoming bills (credit card due dates)
- Plus pending reimbursements (with confidence based on age)
- Minus committed future expenses

FEATURE 2: WORK TRIP MANAGEMENT
User says: "I'll be in Buffalo March 9-13, all expenses work-related"
System responds by:
- Creating work_trip record
- Auto-tagging any transaction in Buffalo during those dates
- Tracking running total
- Monitoring reimbursement status
- Alerting if reimbursement is overdue

FEATURE 3: LIFE CONTEXT AWARENESS
The system understands:
- Partner contributions offset housing costs
- Work trips create temporary expense spikes that net to zero
- Seasonal patterns (holiday spending, summer travel)
- Life phases (pre/post moving in together)

FEATURE 4: SMART CATEGORIZATION
Three-tier approach:
- Tier 1 Rules: Known merchants map to known categories (fast, no LLM)
- Tier 2 Local LLM: Unknown transactions categorized by Ollama (free, private)
- Tier 3 Learning: User corrections improve future categorization

FEATURE 5: PROACTIVE INSIGHTS
Dashboard surfaces alerts without being asked:
- "Reimbursement from Sao Paulo trip is 47 days old (avg is 35)"
- "12,400 Flying Blue miles expire June 30"
- "Spending 40% above average this month—driven by work trip"
- "Girlfriend's contribution not received yet this month"

FEATURE 6: SCENARIO ENGINE
Model future financial states:
- User asks: "Can I afford a 3,000 EUR trip in April?"
- System considers: current balance, pending reimbursements, projected income, historical spending patterns, known upcoming expenses
- Returns confidence-weighted answer with reasoning

FEATURE 7: HISTORICAL ONBOARDING
First-run experience:
- Import all historical CSVs
- System detects patterns and anomalies
- Asks clarifying questions: "Your rent changed in November. What happened?"
- Builds life model from answers

DASHBOARD PAGES

PAGE 1 - OVERVIEW
- True balance (prominent)
- Account breakdown
- Pending reimbursements
- This month's spending (personal only)
- Active alerts/insights
- Quick actions

PAGE 2 - TRANSACTIONS
- Searchable, filterable table
- Bulk categorization
- Work expense tagging
- Split transaction support

PAGE 3 - WORK TRIPS
- List of trips with status
- Create new trip (date range, destination, rules)
- Reimbursement tracking
- Historical analysis (avg reimbursement time)

PAGE 4 - PROJECTIONS
- Cash flow forecast (30/60/90 days)
- Scenario modeling
- "What if" simulations
- Goal tracking

PAGE 5 - ADVISOR
- Natural language interface
- Full context awareness
- Cites sources for answers
- Can execute actions ("mark trip as reimbursed")

PAGE 6 - SETTINGS
- Account configuration
- Category management
- People/relationships
- API keys
- Import/export

IMPLEMENTATION PHASES

PHASE 1 - FOUNDATION
- Project structure and database schema
- CSV importers for all three banks
- Basic Streamlit dashboard showing transactions
- Manual categorization

PHASE 2 - INTELLIGENCE
- Ollama integration for auto-categorization
- Work trip system (create, auto-tag, track)
- True balance calculation
- Basic pattern detection

PHASE 3 - LIFE MODEL
- People/relationships tracking
- Life events system
- Partner contribution handling
- Historical onboarding flow

PHASE 4 - ADVISOR
- Claude API integration
- Context builder (summarizes financial state for LLM)
- Natural language queries
- Actionable responses

PHASE 5 - PROJECTIONS
- Cash flow forecasting
- Scenario engine
- "Can I afford X?" logic
- Monte Carlo-style confidence ranges

PHASE 6 - POLISH
- Proactive alerts system
- Browser automation for CSV downloads
- Mobile access (Telegram bot or iOS Shortcut)
- Backup/restore functionality

DESIGN PRINCIPLES

1. Fail gracefully: Missing data should not break the system
2. Explain reasoning: Show how calculations are derived
3. Respect privacy: All data local, API calls optional and explicit
4. Progressive enhancement: Core features work without LLM, LLM makes them better
5. User corrections improve the system: Learning from manual overrides

CREATIVE LATITUDE

Feel free to enhance or extend these ideas:
- Better visualization approaches
- Smarter pattern detection algorithms
- More sophisticated projection models
- Elegant onboarding experiences
- Useful integrations I have not thought of
- UX improvements that reduce friction
- Novel ways to surface insights

The goal is a system I will actually use daily because it provides genuine value and feels effortless.

CONSTRAINTS

- Must run fully offline (except optional Claude API)
- macOS only is fine
- Single user (me)
- No cloud infrastructure
- No recurring costs except optional API usage

FIRST STEPS

Start by:
1. Setting up the project structure
2. Defining the complete database schema
3. Building the CSV importers
4. Creating a minimal dashboard that displays imported transactions

Then iterate from there.
