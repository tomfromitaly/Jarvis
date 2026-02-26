# Jarvis
CFO Dashboard and AI Assistant

PROJECT: Personal Financial Command Center

OVERVIEW

Build a local-first personal financial advisor that runs on macOS. This is NOT a chatbot. It is a persistent financial intelligence system that understands my life context, tracks my money across multiple accounts, and provides proactive insights.

The system should feel like having a personal CFO who knows everything about my financial situation and life circumstances.

CORE PHILOSOPHY

Local-first: Everything runs on my MacBook. Data never leaves my machine except for optional LLM API calls for complex reasoning.

Context-aware: The system understands my life, not just my transactions. Relationships, work patterns, life phases, future plans.

Proactive: It surfaces insights and warnings without me asking.

Minimal friction: Importing data, asking questions, and getting answers should be effortless.

WHO I AM

I have a complex financial situation. I travel frequently for work, pay expenses personally, and get reimbursed 1-3 months later. This creates a distorted view of my actual financial position.

I use three accounts: N26 (primary), AMEX (work expenses), Revolut (travel/secondary).

I live with my girlfriend who contributes monthly to shared expenses.

I have loyalty points across multiple airline programs that I want to track.

My financial picture only makes sense when you understand my life context.

WHAT I WANT TO ACHIEVE

TRUE FINANCIAL CLARITY I want to know my real financial position at any moment. Not just account balances, but: What do I actually have? What is owed to me? What do I owe? What is my money situation if I account for pending reimbursements and upcoming obligations?

LIFE-AWARE INTELLIGENCE The system should understand that my rent increased because I moved in with my girlfriend, and that her monthly transfers offset this. It should know that a week of expenses in Buffalo means work trip, not spending spree. It should recognize patterns across my life phases and adjust its understanding accordingly.

WORK TRIP MANAGEMENT I need to tell it "I am in Buffalo March 9-13, everything is work-related" and have it automatically handle categorization, tracking, and reimbursement monitoring for that trip.

FORWARD-LOOKING INSIGHTS I want to ask "Can I afford a trip to Japan in October?" and get an intelligent answer that considers my current position, expected reimbursements, historical patterns, and known upcoming expenses.

PROACTIVE ALERTS It should tell me when something needs attention: overdue reimbursements, expiring loyalty points, unusual spending patterns, missed contributions, upcoming large expenses.

HISTORICAL UNDERSTANDING When I first load my data, it should analyze patterns, detect anomalies, and ask me questions to understand what happened. "Your rent changed significantly in November. What happened?" This builds the life model.

SCENARIO MODELING I want to explore "what if" situations. What if I buy a car in June? What if I take two trips this quarter? How do different decisions affect my trajectory?

DATA SOURCES

Banking via CSV import from N26, AMEX, and Revolut.

Manual input for work trips, life events, future plans, and loyalty balances.

Optional browser automation to fetch CSVs automatically.

TECHNICAL FOUNDATION

Python as the core language.

SQLite for local database storage. Single file, no server, portable.

Streamlit for the dashboard interface. Or suggest alternatives if something better fits the UI vision described below.

Ollama with a local LLM for categorization and basic intelligence without API costs.

Optional external LLM API for complex reasoning. The system should ask me during setup which provider I want to use (Claude, xAI, OpenAI, or none). This should be configurable and swappable.

DATA MODEL CONCEPTS

The database should capture:

Transactions from all accounts with deduplication, categorization, and links to trips/people/events.

Work trips with dates, destinations, expense tracking, and reimbursement status.

Life events that explain financial pattern changes.

People with financial relationships (partner contributions, expense splitting).

Recurring transactions like subscriptions with expected amounts and change detection.

Loyalty programs with balances and expiry tracking.

Design the schema to support the features described. Normalize appropriately but prioritize query simplicity for common operations.

INTELLIGENCE APPROACH

Use a tiered approach:

Simple rules for known patterns (fast, no LLM needed).

Local LLM for categorization and basic analysis (free, private).

External LLM API for complex questions and sophisticated reasoning (optional, user-configured).

The system should work fully offline with degraded but functional capability. External API enhances but is not required.

USER INTERFACE VISION

This is critical. The interface must NOT feel like a chat application.

COMMAND BAR PARADIGM Think Spotlight, Raycast, or a terminal. A single input field where I type commands or questions. The system responds by updating the dashboard, not by adding messages to a conversation thread.

Examples of inputs: "buffalo march 9-13 work trip" "can I afford japan in october" "show spending last 3 months" "mark sao paulo reimbursed 2340" "why is february spending so high"

The response appears as dashboard content: cards, tables, charts, summaries. Not as a chat bubble. The input field clears after each command. There is no conversation history visible. Each interaction is atomic.

DASHBOARD AS CANVAS The main view is a dashboard that updates based on context and commands. Default state shows the most important information: true balance, alerts, recent activity, upcoming concerns.

When I ask a question, the dashboard transforms to show the answer. Ask about spending trends, it shows charts. Ask about a trip, it shows trip details. Ask if I can afford something, it shows a projection breakdown.

INFORMATION ARCHITECTURE Primary: True balance, alerts requiring attention, critical metrics. Secondary: Account breakdown, pending reimbursements, monthly summary. On-demand: Transaction lists, trip details, historical analysis, projections.

The interface should be information-dense but not cluttered. Professional, like a Bloomberg terminal meets a modern design system.

INTERACTION PATTERNS Command bar is always accessible, perhaps with a keyboard shortcut. Dashboard sections are clickable for drill-down. Quick actions available for common tasks: add trip, import CSV, mark reimbursed. Settings accessible but not prominent.

NO CHAT ELEMENTS No message bubbles. No conversation threads. No "AI is typing" indicators. No back-and-forth visible history. The system is an instrument I operate, not an entity I converse with.

IMPLEMENTATION APPROACH

Start with the foundation: project structure, database, CSV importers, basic dashboard.

Add intelligence: categorization, work trip logic, pattern detection.

Build the life model: relationships, events, historical onboarding.

Create the command interface: natural language parsing with dashboard responses.

Add projections: forecasting, scenarios, goal tracking.

Polish: alerts, automation, refinements.

DESIGN PRINCIPLES

Fail gracefully when data is missing or incomplete.

Explain reasoning so I can verify and trust the outputs.

Learn from my corrections to improve over time.

Respect privacy with local-first architecture.

Progressive enhancement where core features work without LLM.

CREATIVE DIRECTION

I have described what I want to achieve. For how to achieve it, use your best judgment.

Consider innovative approaches to:

Visualizing complex financial relationships
Detecting patterns I would not notice myself
Making projections trustworthy and transparent
Reducing friction in daily use
Surfacing the right information at the right time
Building an intuitive mental model of my finances
Handling the complexity of reimbursement timing
Comparing trips and predicting costs
Optimizing points and loyalty programs
Finding money I am leaving on the table
Making the command bar feel powerful and intuitive
Designing dashboard transitions that feel responsive and logical
Surprise me with elegant solutions. The goal is a system I will actually use daily because it provides genuine value.

CONSTRAINTS

Must run fully offline except for optional API calls. macOS only. Single user. No cloud infrastructure. No recurring costs except optional API usage. Pure desktop application. No mobile integration for now.

BEGIN

Start by understanding the full scope, then create a plan. Build incrementally, starting with the foundation and evolving toward the complete vision.




