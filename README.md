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

TRUE FINANCIAL CLARITY
I want to know my real financial position at any moment. Not just account balances, but: What do I actually have? What is owed to me? What do I owe? What is my money situation if I account for pending reimbursements and upcoming obligations?

LIFE-AWARE INTELLIGENCE
The system should understand that my rent increased because I moved in with my girlfriend, and that her monthly transfers offset this. It should know that a week of expenses in Buffalo means work trip, not spending spree. It should recognize patterns across my life phases and adjust its understanding accordingly.

WORK TRIP MANAGEMENT
I need to tell it "I am in Buffalo March 9-13, everything is work-related" and have it automatically handle categorization, tracking, and reimbursement monitoring for that trip.

FORWARD-LOOKING INSIGHTS
I want to ask "Can I afford a trip to Japan in October?" and get an intelligent answer that considers my current position, expected reimbursements, historical patterns, and known upcoming expenses.

PROACTIVE ALERTS
It should tell me when something needs attention: overdue reimbursements, expiring loyalty points, unusual spending patterns, missed contributions, upcoming large expenses.

HISTORICAL UNDERSTANDING
When I first load my data, it should analyze patterns, detect anomalies, and ask me questions to understand what happened. This builds the life model. See the detailed onboarding section below.

SCENARIO MODELING
I want to explore "what if" situations. What if I buy a car in June? What if I take two trips this quarter? How do different decisions affect my trajectory?

DATA SOURCES

Banking via CSV import from N26, AMEX, and Revolut.

Flight history import. I can provide my 2025 flight history which helps identify trips and distinguish work from leisure travel.

Manual input for work trips, life events, future plans, and loyalty balances.

Optional browser automation to fetch CSVs automatically.

TECHNICAL FOUNDATION

Python as the core language.

SQLite for local database storage. Single file, no server, portable.

Streamlit for the dashboard interface. Or suggest alternatives if something better fits the UI vision described below.

LOCAL LLM STRATEGY

Use Ollama with the latest available Qwen model. As of now, Qwen 3.5 is the newest release. The system should use whatever the most capable Qwen model available in Ollama is. This provides strong reasoning capability completely free and local.

Check available models with: ollama list
Pull the latest Qwen with: ollama pull qwen3.5 (or qwen2.5:14b as fallback)

The model choice should be configurable in settings so I can swap models as newer versions release. The architecture must be model-agnostic.

For most tasks, the local Qwen model should be sufficient: categorization, command parsing, pattern analysis, onboarding questions, basic projections. This keeps costs at zero for daily use.

OPTIONAL EXTERNAL LLM API

For genuinely complex reasoning that exceeds local model capability, the system can optionally call an external API. This should be rare.

During setup, the system should ask which provider I want to use: Claude, xAI (Grok), OpenAI, or none. This should be configurable and swappable. I currently have credits on xAI.

The system should clearly indicate when it is using external API versus local model. I want to know when I am spending credits.

DATA MODEL CONCEPTS

The database should capture:

Transactions from all accounts with deduplication, categorization, and links to trips/people/events.

Work trips with dates, destinations, expense tracking, and reimbursement status.

Life events that explain financial pattern changes.

People with financial relationships (partner contributions, expense splitting).

Recurring transactions like subscriptions with expected amounts and change detection.

Loyalty programs with balances and expiry tracking.

Onboarding answers stored structured so the system remembers everything learned during the interview process.

Model configuration storing which local model and which external API (if any) is configured.

Design the schema to support the features described. Normalize appropriately but prioritize query simplicity for common operations.

INTELLIGENCE APPROACH

Use a tiered approach:

Tier 1 - Rules: Simple pattern matching for known merchants and transaction types. Instant, no LLM needed.

Tier 2 - Local LLM: Qwen via Ollama for categorization, command parsing, analysis, onboarding. Free, private, handles 95% of needs.

Tier 3 - External API: Optional cloud LLM for complex multi-factor reasoning. Only when local model is insufficient. User-configured provider.

The system should work fully offline using only Tier 1 and Tier 2. External API enhances but is never required.

USER INTERFACE VISION

This is critical. The interface must NOT feel like a chat application.

COMMAND BAR PARADIGM
Think Spotlight, Raycast, or a terminal. A single input field where I type commands or questions. The system responds by updating the dashboard, not by adding messages to a conversation thread.

Examples of inputs:
"buffalo march 9-13 work trip"
"can I afford japan in october"
"show spending last 3 months"
"mark sao paulo reimbursed 2340"
"why is february spending so high"

The response appears as dashboard content: cards, tables, charts, summaries. Not as a chat bubble. The input field clears after each command. There is no conversation history visible. Each interaction is atomic.

DASHBOARD AS CANVAS
The main view is a dashboard that updates based on context and commands. Default state shows the most important information: true balance, alerts, recent activity, upcoming concerns.

When I ask a question, the dashboard transforms to show the answer. Ask about spending trends, it shows charts. Ask about a trip, it shows trip details. Ask if I can afford something, it shows a projection breakdown.

INFORMATION ARCHITECTURE
Primary: True balance, alerts requiring attention, critical metrics.
Secondary: Account breakdown, pending reimbursements, monthly summary.
On-demand: Transaction lists, trip details, historical analysis, projections.

The interface should be information-dense but not cluttered. Professional, like a Bloomberg terminal meets a modern design system.

INTERACTION PATTERNS
Command bar is always accessible, perhaps with a keyboard shortcut.
Dashboard sections are clickable for drill-down.
Quick actions available for common tasks: add trip, import CSV, mark reimbursed.
Settings accessible but not prominent.

NO CHAT ELEMENTS
No message bubbles. No conversation threads. No "AI is typing" indicators. No back-and-forth visible history. The system is an instrument I operate, not an entity I converse with.

ONBOARDING AND INTERVIEW PROCESS

This is the most critical part of the system. The onboarding must be exhaustive, structured, and thorough. It will take time. That is acceptable. The goal is to build a complete mental model of my financial life.

ONBOARDING PHILOSOPHY

The system knows nothing about me initially. It must learn everything by analyzing my data and asking me questions. Every assumption must be verified. Every pattern must be explained. Every relationship must be mapped.

This is not a quick setup wizard. This is a comprehensive financial interview that may take 1-2 hours spread across multiple sessions. The system should save progress and allow me to continue later.

The onboarding runs entirely on the local Qwen model. No external API needed.

STRUCTURED APPROACH

The onboarding happens in distinct phases, each building on the previous. The system should track completion status and guide me through systematically.

PHASE 1: DATA IMPORT AND INITIAL ANALYSIS

Import all available data: bank CSVs, flight history, any other documents.

The system analyzes everything before asking any questions. It builds hypotheses about my financial patterns that it will then verify with me.

It identifies: all unique merchants, all recurring transactions, all location clusters, all large transactions, all transfers between accounts, all incoming transfers from other people, all trips based on location and timing.

PHASE 2: INCOME AND EMPLOYMENT

Identify my primary income source from transaction patterns.

Ask: Who is my employer? What is my net monthly salary? Do I receive bonuses and when? Are there other income sources?

Understand my pay schedule and typical deposit amounts.

PHASE 3: HOUSING AND FIXED COSTS

Identify rent or mortgage payments from recurring large transactions.

Detect any changes in housing costs over time. If detected, ask what happened. Example: "Your rent changed from 916 EUR to 1700 EUR in November 2025. What happened?"

Understand my living situation. Do I live alone? With a partner? Roommates?

If with a partner: What is the cost split arrangement? Does the partner contribute directly to my account? How much and how often? Map the partner's transfers to understand the true housing cost.

PHASE 4: RELATIONSHIPS AND SHARED EXPENSES

This requires deep exploration. The system must understand that I pay for things on behalf of others and get reimbursed informally.

Identify all incoming transfers from individuals (not companies). For each person who sends me money regularly, ask: Who is this person? What is the relationship? What are these transfers for?

For my girlfriend specifically: Understand that I often pay for shared expenses (dinners, trips, groceries, activities) and she pays me back. This is different from her fixed monthly contribution for rent.

The system should identify large personal expenses and ask: "You spent 450 EUR at Restaurant X on December 15. Was this just for you, or shared with someone? If shared, did you get paid back?"

Build a model of expense sharing: What categories do I typically share? What is the usual split? How does reimbursement happen (transfer, cash, covers next expense)?

PHASE 5: TRIP IDENTIFICATION AND CLASSIFICATION

This is complex and must be thorough.

Using transaction locations, flight history, and timing, identify every trip in my history. A trip is a cluster of transactions in a location away from my home city within a defined time window.

For each identified trip, create a trip record and ask:

Where was this trip? (verify the detected location)
What were the dates? (verify the detected dates)
Was this work or personal?
If work: Was it fully reimbursable? Has it been reimbursed? When was reimbursement received or expected?
If personal: Was I alone or with someone? If with someone, how were expenses split? Did I get paid back for their share?
If mixed: Which expenses were work and which were personal?

The system should use flight history to anchor trips. A flight to Buffalo on March 9 returning March 13 definitively establishes a trip. All transactions in Buffalo during that window should be associated with that trip.

For each trip, calculate: total spend, amount reimbursable, amount shared with others, true personal cost.

PHASE 6: LARGE TRANSACTION REVIEW

Identify all transactions above a threshold (perhaps 200 EUR) that have not been explained by previous phases.

For each, ask: What was this? Was it a one-time purchase? Was it shared? Was it reimbursed? Should it be categorized specially?

Examples:
"You spent 1200 EUR at Apple Store on February 3. What was this purchase? Was it for you or a gift? Was it reimbursed by anyone?"
"You spent 680 EUR at Booking.com on December 10. I see you were in Paris December 14-18. Was this the hotel for that trip? Was this trip work or personal? Was the cost shared?"

PHASE 7: RECURRING TRANSACTIONS

Identify all recurring charges: subscriptions, memberships, regular bills.

For each, verify: What is this service? Is it still active? Is it personal or shared? If shared, what is my true cost?

Detect changes in recurring amounts and ask about them.

PHASE 8: PATTERN VERIFICATION

Present detected patterns and ask for confirmation:

"I notice you spend an average of 400 EUR per month on dining. Does this seem right?"
"Your spending increases by about 40% in December. Is this typical holiday spending?"
"You receive transfers from [girlfriend name] averaging 850 EUR per month. Is this her contribution to shared expenses?"

Allow me to correct any misunderstandings.

PHASE 9: ANOMALY EXPLANATION

Surface anything unusual that has not been explained:

"In March 2025, your spending was 180% of your average. What happened?"
"You received a 5000 EUR transfer from [unknown source]. What was this?"
"There is a gap in your transaction history from June 1-15. Were you using a different payment method?"

PHASE 10: FUTURE CONTEXT

Ask about known upcoming events:

Any planned trips?
Any large purchases expected?
Any life changes anticipated (moving, job change, etc.)?
Any financial goals I should know about?

ONBOARDING DATA STORAGE

Every answer I provide must be stored in a structured way. Not as free text, but as typed data:

Trip records with all attributes
Person records with relationship type and financial patterns
Life event records with dates and financial impact
Expense sharing rules
Reimbursement expectations
Category preferences
Verified patterns

The system should be able to query this structured knowledge later. "What trips has Tommaso taken with his girlfriend?" should return a list, not require re-reading interview transcripts.

ONBOARDING INTERFACE

The onboarding interface can be more conversational than the main dashboard since it is a one-time process. However, it should still feel structured:

Show progress through phases
Display the data being discussed (transaction list, trip summary, etc.)
Provide clear input methods (buttons for common answers, text for details)
Allow skipping and returning to questions
Save progress automatically
Show what has been learned so far

ONBOARDING RESUMPTION

If I close the application mid-onboarding, it should resume exactly where I left off. It should also allow me to revisit and correct previous answers as I remember more details.

POST-ONBOARDING LEARNING

After initial onboarding, the system continues learning:

New transactions that do not match known patterns trigger questions
New trips are detected and need classification
Changes in recurring amounts are flagged
The system asks periodic clarifying questions as it notices things

IMPLEMENTATION APPROACH

Start with the foundation: project structure, database, CSV importers, basic dashboard.

Build the onboarding system: this is complex and should be built thoroughly before other features.

Add intelligence: categorization, work trip logic, pattern detection.

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
- Making the onboarding feel efficient despite being thorough
- Visualizing complex financial relationships
- Detecting patterns I would not notice myself
- Making projections trustworthy and transparent
- Reducing friction in daily use
- Surfacing the right information at the right time
- Building an intuitive mental model of my finances
- Handling the complexity of reimbursement timing
- Comparing trips and predicting costs
- Optimizing points and loyalty programs
- Finding money I am leaving on the table
- Making the command bar feel powerful and intuitive
- Designing dashboard transitions that feel responsive and logical
- Storing and querying the knowledge learned during onboarding
- Maximizing use of local LLM to minimize external API costs

Surprise me with elegant solutions. The goal is a system I will actually use daily because it provides genuine value.

CONSTRAINTS

Must run fully offline except for optional API calls.
macOS only.
Single user.
No cloud infrastructure.
No recurring costs except optional API usage.
Pure desktop application. No mobile integration for now.
Prefer local Qwen model for all tasks. External API only as optional enhancement.

BEGIN

Start by understanding the full scope, then create a plan. Build incrementally, starting with the foundation and evolving toward the complete vision.
