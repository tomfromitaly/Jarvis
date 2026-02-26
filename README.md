PROJECT: Personal Financial Command Center

VISION

I want complete clarity over my financial life. Not just tracking expenses, but understanding my entire wealth picture: where my money is, where it's going, what's driving changes, and what I should do about it.

I have a complex financial situation spread across multiple bank accounts, credit cards, investments, company equity, and pending reimbursements. My income fluctuates with bonuses, RSU vesting, and delayed work expense reimbursements. I pay for things on behalf of my girlfriend and get reimbursed informally. I travel frequently for work and personally.

Right now I have no single place that tells me: What is my actual net worth? Am I building wealth? What's driving the changes? Am I leaking money somewhere? Am I missing opportunities?

I want a system that acts as my personal CFO. It knows everything about my financial life, understands the context behind the numbers, and gives me genuine insight rather than just reports.

THE CORE QUESTIONS IT MUST ANSWER

AM I BUILDING WEALTH?

What is my total net worth today across all assets and liabilities? How has it changed over the last month, quarter, year? What's my trajectory? Am I on track for my goals?

WHAT'S DRIVING THE CHANGES?

My wealth grew by X this month. Why? How much came from savings versus investment gains versus RSU vesting? My expenses were high this month. What drove that? Was it a one-time thing or a trend?

WHERE AM I LEAKING MONEY?

Are there subscriptions I'm not using? Fees I could avoid? Money sitting idle that could be working harder? Points expiring? Suboptimal choices I'm making without realizing?

WHAT AM I MISSING?

Opportunities to optimize taxes. Better account or card options for my usage patterns. Concentration risk in my portfolio. Cash earning nothing when it could be invested.

WHAT SHOULD I ACTUALLY FOCUS ON?

Of all the things I could optimize, what would have the biggest impact? Is it worth cutting back on dining, or would moving idle cash to investments matter more? Give me prioritized, actionable insight.

CAN I AFFORD THIS?

If I want to take a trip to Japan or buy a car, can I actually afford it? Not just "do I have the cash" but factoring in upcoming expenses, reimbursement timing, investment goals, and my overall financial health.

MY FINANCIAL LANDSCAPE

BANK ACCOUNTS N26: Primary checking, salary deposits, rent, daily expenses Revolut: Travel, foreign currency, secondary spending AMEX: Credit card, primarily work expenses, some personal

INVESTMENTS Personal investment accounts: I will provide what I buy and at what price. The system should track current market value using live or daily stock prices.

COMPANY EQUITY RSUs from my employer: I will upload my RSU contracts showing vesting schedule, grant prices, and quantities. The system should track vested versus unvested, current value based on stock price, and upcoming vesting events.

PENDING REIMBURSEMENTS Work travel expenses I pay personally and get reimbursed 1-3 months later. This is essentially money owed to me and should be tracked as an asset.

LOYALTY PROGRAMS Miles and More, Flying Blue, Qatar Privilege Club. Points have real value and can expire.

INCOME STREAMS Base salary: Regular but I'll provide details Bonuses: Sporadic, varying amounts RSU vesting: Periodic based on schedule Reimbursements: Delayed, variable timing Girlfriend contributions: Regular monthly amount for shared housing costs

RELATIONSHIPS AND SHARED EXPENSES I live with my girlfriend. She contributes a fixed amount monthly toward rent. I also frequently pay for shared expenses like dinners, trips, groceries, and activities. She pays me back, sometimes immediately, sometimes later, sometimes by covering the next expense. The system must understand this to calculate my true costs.

WORK TRAVEL I travel frequently for work. I pay for flights, hotels, meals, and transport personally using AMEX. These get reimbursed by my employer but with significant delay. During a work trip, my expenses spike dramatically but my true cost is zero. The system must understand which expenses are work-related and track reimbursement status.

PERSONAL TRAVEL I also travel for leisure, often with my girlfriend. These trips have real costs but are often shared. The system should understand the difference between work and leisure travel and calculate true personal cost for leisure trips.

WHAT THE SYSTEM MUST DO

BUILD A COMPLETE WEALTH PICTURE

Track everything I own and owe: Cash in bank accounts Investment portfolio at current market value Company shares vested and unvested Pending reimbursements owed to me Loyalty points estimated value Credit card balances owed Any other assets or liabilities

Calculate true net worth. Show how it changes over time.

UNDERSTAND THE DRIVERS

When my wealth changes, explain why. Break it down: How much came from income (salary, bonus, RSU vesting) How much came from investment performance How much came from savings (income minus expenses) How much came from reimbursements received What major expenses affected it

DRILL DOWN INTO EXPENSES

Don't just show categories. Show what's normal versus unusual. If I spent more on dining this month, was it a trend or a one-time event? Was it during a trip? Was it shared with my girlfriend?

Connect expenses to context. A dinner in Hamburg during a weekend trip with my girlfriend is different from random Tuesday takeout. The system should understand this.

DETECT TRENDS AND ANOMALIES

If my spending in a category is creeping up over months, alert me. If there's a one-time spike, explain it and don't treat it as a trend. Show me patterns I wouldn't notice myself.

IDENTIFY LEAKAGE AND OPPORTUNITIES

Actively look for money I'm wasting or leaving on the table: Unused subscriptions Fees I could avoid Cash sitting idle Points about to expire Tax optimization opportunities Better options for my usage patterns

PROVIDE ACTIONABLE RECOMMENDATIONS

Don't just show data. Tell me what to do. Rank recommendations by impact. "Moving 10,000 EUR from N26 to investments would add 700 EUR per year. That's worth more than cutting back on coffee."

HANDLE THE COMPLEXITY OF MY LIFE

Understand that: Work expenses are not real spending Girlfriend reimbursements offset shared costs Reimbursement timing affects cash flow but not true wealth RSU vesting is income Investment gains and losses matter Some months look expensive but are actually fine when context is understood

THE ONBOARDING PROCESS

The system knows nothing initially. It must learn everything about my financial life through a thorough interview process.

WHAT IT NEEDS TO LEARN

My income: Employer, salary, bonus patterns, RSU schedule My housing: Rent, living situation, cost sharing arrangement with girlfriend My relationships: Who sends me money, why, what expenses are shared My trips: Every trip in my history, work versus personal, expense breakdown, reimbursement status My recurring expenses: Subscriptions, memberships, regular bills My investments: What I hold, what I've bought, my strategy My company equity: RSU grants, vesting schedule, current holdings My patterns: Typical spending by category, seasonal variations, anomalies explained My goals: What am I trying to achieve financially

HOW IT LEARNS

Import all available data: Bank CSVs, flight history, RSU contracts, investment records. I want a folder for this where I can just dump files and they will be elaborated. Monthly I can upload bank statements, payslips etc. One folder for manual inputs. I will also attach my flights record to be more easily linked to work trips

Analyze the data to form hypotheses about my patterns.

Ask me structured questions to verify and fill gaps. This is not a quick setup. It may take 1-2 hours spread across sessions. That's fine. The goal is complete understanding.

For every trip detected: Ask if it was work or personal, who I was with, how expenses were split, reimbursement status.

For every recurring transfer from an individual: Ask who they are, what the relationship is, what the transfers represent.

For every large or unusual transaction: Ask what it was, whether it was shared, whether it was reimbursed.

For every pattern detected: Verify it's accurate, ask for context if needed.

Store everything learned in a structured way so it can be queried later. Not free text, but typed data: trip records, person records, expense sharing rules, verified patterns.

Allow me to pause and resume. Save progress automatically. Let me correct previous answers as I remember more details.

POST-ONBOARDING LEARNING

Continue learning after initial setup: New transactions that don't match patterns trigger questions New trips need classification Changes in recurring amounts get flagged Periodic check-ins to verify understanding

THE INTERFACE

This must NOT feel like a chat application. No message bubbles. No conversation threads. No "AI is typing" indicators.

COMMAND BAR

A single input field where I type commands or questions. Think Spotlight or Raycast. The system responds by updating the dashboard, not by adding chat messages. Each interaction is atomic. The input clears after each command.

Examples: "what's my net worth" "why did my wealth change this month" "buffalo march 9-13 work trip" "can I afford japan in october" "what's driving my dining spending" "show me the hamburg trip" "mark sao paulo reimbursed 2340"

DASHBOARD AS CANVAS

The main view is a dashboard showing the most important information. When I ask a question, the dashboard transforms to show the answer. Ask about wealth trajectory, it shows the chart and breakdown. Ask about a trip, it shows trip details. Ask what's unusual, it highlights anomalies.

DRILL-DOWN EXPLORATION

Everything should be explorable. Click on net worth change to see what drove it. Click on expenses to see the breakdown. Click on a category to see transactions. Click on a trip to see all associated costs. At any level, understand how it connects to the bigger picture.

INFORMATION DENSITY

Show me real information, not padding. Professional, like a Bloomberg terminal meets modern design. Dense where appropriate, clear always.

PROACTIVE INSIGHTS

Don't wait for me to ask. Surface what matters: Reimbursement overdue Points expiring Unusual spending pattern detected Opportunity identified Goal progress update

TECHNICAL APPROACH

LOCAL FIRST

Everything runs on my MacBook. Data never leaves my machine except for optional external API calls.

DATABASE

SQLite. Single file, no server, portable.

LOCAL LLM

Use Ollama with the latest available Qwen model for most tasks: categorization, command parsing, analysis, onboarding questions. This keeps daily operation completely free.

The model choice should be configurable so I can swap as newer models release.

OPTIONAL EXTERNAL API

For complex reasoning that exceeds local model capability, optionally call an external API. During setup, ask which provider I want: Claude, xAI, OpenAI, or none. Make it configurable and swappable.

Clearly indicate when external API is being used versus local model.

MARKET DATA

For tracking investment and stock values, fetch current prices. This can be from a free API or data source. I'll provide what I own and purchase history. The system tracks current value.

DESIGN PRINCIPLES

INSIGHT OVER REPORTING

Every output must tell me something I couldn't figure out in 30 seconds from my bank app. Don't just show data. Interpret it. Explain what it means. Tell me what to do.

CONTEXT AWARENESS

A transaction is not just an amount and merchant. It's connected to a trip, a relationship, a life event, a pattern. Understanding context is what makes the system valuable.

TRUTH OVER APPEARANCE

My bank balance is not my wealth. My expenses are not my true costs. Reimbursements, shared expenses, and timing all affect the real picture. Always show the true picture, not the superficial one.

TRENDS OVER SNAPSHOTS

One expensive month means nothing. A trend means everything. Distinguish between noise and signal. Alert me to trends, explain away anomalies.

PRIORITIZED RECOMMENDATIONS

Not everything matters equally. Rank insights by impact. Tell me what would actually move the needle versus what's trivial.

PROGRESSIVE DEPTH

Start with the big picture. Allow drilling down to any level of detail. Net worth to drivers to categories to transactions. Always let me go deeper if I want.

FAIL GRACEFULLY

Missing data shouldn't break the system. Incomplete information should degrade quality, not functionality. Be honest about uncertainty.

LEARN AND IMPROVE

My corrections should improve future accuracy. The system gets smarter over time as it learns my patterns and preferences.

WHAT SUCCESS LOOKS LIKE

After using this system for a month, I should:

Know my true net worth and how it's changing Understand what's driving wealth growth or decline Have identified any money leaks or missed opportunities Feel confident answering "can I afford X" for any major decision Spend less time wondering about my finances and more time acting on clear insights Trust the system because it shows its reasoning and lets me verify

The system should feel like a knowledgeable advisor who has studied my entire financial history and gives me personalized, actionable guidance rather than generic reports.

CONSTRAINTS

Must run fully offline except for optional API calls and market data macOS only Single user No cloud infrastructure No recurring costs except optional API usage Pure desktop application

BUILD APPROACH

Start with foundation: project structure, database, data import Build thorough onboarding: this is critical and should be complete before other features Add wealth tracking: net worth calculation, portfolio tracking, market data Add intelligence: categorization, pattern detection, trend analysis Build the interface: command bar, dashboard, drill-down exploration Add insights: recommendations, leak detection, opportunity identification Polish: alerts, refinements, edge cases

CREATIVE LATITUDE

I've described what I want to achieve. For how to achieve it, use your best judgment.

Consider innovative approaches to:

Visualizing wealth and its drivers
Making drill-down exploration intuitive
Detecting patterns and trends
Surfacing actionable insights
Making onboarding thorough but not tedious
Handling the complexity of shared expenses and reimbursements
Presenting recommendations by impact
Building trust through transparency


The goal is a system I'll actually use daily because it provides genuine clarity and insight into my financial life.
