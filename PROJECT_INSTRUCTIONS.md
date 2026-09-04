You are my senior full-stack engineer and AI systems architect.



I am building a serious portfolio project for the Razorpay internship challenge.



The project must be a REAL, WORKING, DEMONSTRABLE repository — not a prototype full of mock buttons, fake APIs, TODOs, or placeholder functionality.



The current directory is intentionally EMPTY.



BUILD THE ENTIRE PROJECT FROM SCRATCH IN THIS CURRENT DIRECTORY.



Do not ask me for an existing codebase.



Name:



RazorGrowth AI — Agentic Merchant Revenue \& Commerce Engine



Track:



AI Growth \& Agentic Commerce



Challenge:



"Build an agent that grows revenue for a merchant on Razorpay test-mode APIs, or that makes a merchant transactable by an AI buyer end to end."



Core concept:



Build an AI-powered merchant growth agent that can:



Understand a merchant's product catalog.

Accept natural-language shopping requests.

Find relevant products.

Recommend explainable upsells and cross-sells.

Create a Razorpay Test Mode order after explicit customer approval.

Apply strict spending and business-policy limits before ANY money-related action.

Complete payment using Razorpay Test Mode Checkout.

Receive and verify Razorpay webhook events.

Maintain a complete immutable-style audit trail.

Explain why the agent recommended a product and why a payment action was allowed.

Handle failures gracefully.

Provide a merchant dashboard showing revenue, orders, recommendations, conversions and agent actions.



The project should feel like a real fintech/agentic-commerce product.



The AI must NEVER have unrestricted authority over money.



Architecture:



AI Agent

↓

Intent / Recommendation Engine

↓

Policy \& Risk Guardrail Engine

↓

Human/Customer Approval Gate

↓

Razorpay Test Mode API

↓

Webhook Verification

↓

Database

↓

Audit Trail



Every money action must be:



Explainable

Bounded

Gated

Auditable



The AI can recommend.



The policy engine decides whether the action is permitted.



The customer explicitly approves the purchase.



Only then can the backend create the Razorpay order.



Never put Razorpay secret keys in the frontend.



Never allow the LLM to directly execute arbitrary payment APIs.



The application should ship with a realistic demo merchant.



Merchant:



"NovaGear"



Category:



Consumer electronics / accessories



Seed products such as:



Wireless Headphones — ₹2999

Laptop Stand — ₹1499

USB-C Hub — ₹1999

Wireless Mouse — ₹999

Mechanical Keyboard — ₹3499

Laptop Sleeve — ₹799

Webcam — ₹2499

65W GaN Charger — ₹1799



Use realistic descriptions, categories and relationships.



Define product relationships such as:



Headphones → Laptop Sleeve

Laptop → Laptop Stand

Laptop → USB-C Hub

Keyboard → Mouse

Phone → GaN Charger



These relationships can be stored as merchant-defined cross-sell metadata.



Create a beautiful modern commerce UI.



The user should see:



Merchant branding

Product catalog

AI shopping assistant

Cart

AI recommendations

Checkout

Payment status



The main experience should be conversational.



Example:



Customer:



"I need something for working from home under ₹4000."



Agent:



"I found 3 good options:



Wireless Headphones — ₹2,999

Laptop Stand — ₹1,499

Webcam — ₹2,499



For your use case, I'd recommend the headphones because they are suitable for calls and focus work.



Would you like me to add them to your cart?"



Customer:



"Yes."



Agent:



"Since you're buying headphones, the merchant has a related Laptop Sleeve for ₹799.



Your current cart is ₹2,999.



Adding the sleeve would bring the total to ₹3,798.



Would you like to add it?"



Customer:



"Yes."



Agent:



"Your total is ₹3,798.



Your spending limit for this session is ₹5,000.



Everything is within the allowed limit.



Do you approve this purchase?"



Customer:



"Approve."



Only now should the backend create the Razorpay Test Mode order.



Implement an AI agent abstraction.



The system must support an LLM provider through environment variables.



Preferred implementation:



OpenAI-compatible API if API key exists.

Deterministic fallback mode if no LLM API key exists.



VERY IMPORTANT:



The application must remain runnable without an LLM API key.



Therefore implement:



AI mode:

LLM-powered intent extraction/recommendation.



Fallback mode:

Deterministic rule-based intent and recommendation engine.



Display in the dashboard:



"AI Mode: LLM"



or



"AI Mode: Deterministic Fallback"



Do NOT fake an LLM response.



If an LLM is unavailable, clearly use deterministic fallback.



The AI may perform:



Intent extraction

Product search

Product ranking

Upsell recommendation

Cross-sell recommendation

Natural-language explanation

Campaign suggestion

Merchant analytics explanation



The AI must NOT directly:



call Razorpay payment APIs

access Razorpay secrets

change payment limits

approve payments

bypass policy checks

modify audit logs

modify product prices



Implement internal tools/functions:



search\_products(query)



get\_product(product\_id)



get\_cart()



add\_to\_cart(product\_id)



remove\_from\_cart(product\_id)



recommend\_cross\_sell(cart)



calculate\_cart\_total()



check\_policy(cart)



request\_purchase\_approval()



create\_razorpay\_order()



get\_payment\_status()



get\_customer\_spending\_limit()



get\_audit\_history()



These tools must have strict server-side authorization.



The LLM should never be able to call arbitrary URLs.



Create a dedicated policy engine.



Example policy:



MAX\_TRANSACTION\_AMOUNT = ₹5000



The policy engine must check:



Cart total

Maximum transaction amount

Product availability

Merchant active status

Customer approval

Duplicate purchase protection

Currency

Valid order

Risk state



Example:



If cart = ₹3798:



ALLOW



If cart = ₹6200:



BLOCK



Response:



{

"allowed": false,

"reason": "Transaction exceeds customer spending limit of ₹5000",

"required\_action": "Remove items or obtain a higher authorized limit"

}



The AI must NOT be able to override this.



Create a visible approval step.



Before payment/order creation:



Show:



Purchase Approval



Items:

Wireless Headphones ₹2999

Laptop Sleeve ₹799



Total:

₹3798



Policy:



Maximum allowed:

₹5000



Status:

ALLOWED



Reason:



"Transaction is within the customer's configured spending limit."



Button:



"Approve Purchase"



Only clicking this button should permit order creation.



Use Razorpay Test Mode.



Use environment variables:



RAZORPAY\_KEY\_ID=

RAZORPAY\_KEY\_SECRET=

RAZORPAY\_WEBHOOK\_SECRET=



Never hardcode credentials.



Never expose RAZORPAY\_KEY\_SECRET to frontend.



Use Razorpay APIs from the backend.



Create Razorpay orders from the backend.



Store:



Razorpay order ID

amount

currency

local order ID

customer ID

status

created timestamp



Use Razorpay Checkout for the payment experience.



Use Test Mode only.



The application must clearly state:



"Razorpay Test Mode — No real money is charged."



Implement:



Customer creates cart.

AI recommends optional cross-sell.

Customer accepts recommendation.

Policy engine evaluates purchase.

Customer explicitly approves.

Backend creates local order.

Backend creates Razorpay Test Mode order.

Frontend opens Razorpay Checkout.

Payment completes.

Frontend receives immediate result.

Backend verifies payment where appropriate.

Razorpay webhook is received.

Webhook signature is verified.

Duplicate webhook events are safely ignored.

Order status is updated.

Audit event is created.

Dashboard updates.



Razorpay webhook processing must be idempotent.



Use the Razorpay event ID to prevent duplicate processing.



Do not assume webhook events always arrive in perfect order.



Support at minimum:



payment.authorized



payment.captured



payment.failed



order.paid



Store webhook events in the database.



Fields:



event\_id



event\_type



payload\_hash



received\_at



processed\_at



processing\_status



error\_message



Ensure the same event cannot modify the order twice.



This is VERY IMPORTANT.



The final project must demonstrate at least ONE realistic failure.



Implement a "Failure Simulation" section in the merchant/admin dashboard.



Allow the developer/demo user to simulate:



Razorpay API timeout

Payment failure

Duplicate webhook

Invalid webhook signature

Policy violation

LLM unavailable



The best demo failure should be:



"Payment webhook arrives twice."



System behavior:



First webhook:



Processed successfully.



Second webhook:



Detected as duplicate.



System does NOT:



create another order

increment revenue twice

create duplicate fulfillment

charge again



Instead show:



"Duplicate webhook detected and safely ignored."



Create an audit event:



WEBHOOK\_DUPLICATE\_IGNORED



This gives us a strong 2 AM failure story.



Create a dedicated audit system.



Every important action must create an audit record.



Example events:



USER\_INTENT\_RECEIVED



PRODUCT\_SEARCHED



PRODUCT\_RECOMMENDED



UPSELL\_RECOMMENDED



UPSELL\_ACCEPTED



CART\_UPDATED



POLICY\_CHECK\_STARTED



POLICY\_CHECK\_PASSED



POLICY\_CHECK\_FAILED



PURCHASE\_APPROVAL\_REQUESTED



PURCHASE\_APPROVED



RAZORPAY\_ORDER\_CREATED



CHECKOUT\_OPENED



PAYMENT\_AUTHORIZED



PAYMENT\_CAPTURED



PAYMENT\_FAILED



WEBHOOK\_RECEIVED



WEBHOOK\_VERIFIED



WEBHOOK\_DUPLICATE\_IGNORED



ORDER\_MARKED\_PAID



AGENT\_ACTION\_BLOCKED



LLM\_FALLBACK\_USED



Each audit record should include:



id



timestamp



actor



action



entity\_type



entity\_id



reason



metadata



result



request\_id



For AI actions include:



agent reasoning summary



DO NOT store hidden chain-of-thought.



Store only a concise user-safe explanation such as:



"Recommended Laptop Sleeve because it is configured by the merchant as a cross-sell for laptops and the resulting cart remains below the customer spending limit."



Every recommendation must show:



"Why was this recommended?"



Example:



WHY THIS PRODUCT?



Merchant configured it as a related product.

It matches the customer's shopping intent.

It is within the customer's budget.

Adding it keeps the cart below the ₹5000 transaction limit.



Every payment action must show:



WHY WAS THIS PAYMENT ALLOWED?



Customer explicitly approved.

Cart total: ₹3798.

Maximum allowed: ₹5000.

Merchant active: Yes.

Products available: Yes.

No duplicate order detected.



Build an admin/merchant dashboard.



Show:



Revenue



Orders



Conversion rate



Average order value



AI recommendation acceptance rate



Upsell revenue



Cross-sell revenue



Payment success rate



Failed payments



Blocked transactions



Agent actions



Webhook events



Audit events



Use attractive charts.



Create a section:



"AI Growth Insights"



Example:



"Customers who purchase Wireless Headphones frequently add Laptop Sleeves."



"Recommended cross-sells generated ₹7,991 in simulated/test revenue."



"12% of carts accepted an AI recommendation."



These analytics should be based on actual database events/data.



Do not hardcode fake numbers if they can be calculated.



If there isn't enough data, show:



"Not enough data yet."



Create a merchant growth assistant.



Merchant can ask:



"How can I increase revenue?"



The agent analyzes:



product sales

cart events

recommendation acceptance

failed payments

average order value

cross-sell performance



It can suggest:



cross-sell opportunities

bundle opportunities

products needing better positioning

abandoned cart recovery opportunities

campaign ideas



Example:



Merchant:



"How can I increase revenue?"



Agent:



"Your headphones have strong demand, but their attach rate is low.



I recommend a Headphones + Laptop Sleeve bundle.



Reason:

42% of headphone purchases occur without a related accessory.



Potential strategy:

Offer the sleeve as a one-click cross-sell after headphones are added to cart."



Recommendations should be backed by actual database metrics where available.



Implement a lightweight campaign feature.



Merchant can create:



Campaign Name



Target Product



Trigger



Recommendation



Discount/Message



Example:



Campaign:



"Work From Home Bundle"



Trigger:



Customer adds Wireless Headphones



Recommendation:



Laptop Stand



Message:



"Complete your work-from-home setup with our Laptop Stand."



Do NOT implement real marketing messages or external messaging integrations unless necessary.



Keep it inside the demo application.



Use PostgreSQL.



Preferred:



Prisma ORM.



Create proper relational schema.



Tables/models:



Merchant



Customer



Product



ProductRelation



Cart



CartItem



Order



OrderItem



Payment



Recommendation



AgentSession



AgentAction



PolicyCheck



WebhookEvent



AuditEvent



Campaign



Preferred stack:



Node.js



TypeScript



Express



Prisma



PostgreSQL



Zod



Razorpay Node SDK or direct Razorpay REST API where appropriate



Implement:



Authentication where necessary.



Input validation.



Centralized error handling.



Request IDs.



Structured logging.



Environment variable validation.



Rate limiting on public AI endpoints.



CORS configuration.



Helmet/security headers.



Do not expose secrets.



Preferred:



React



TypeScript



Vite



Tailwind CSS



Use a polished modern SaaS/fintech interface.



Pages:



/



/shop



/assistant



/cart



/checkout



/payment-success



/payment-failed



/dashboard



/audit



/webhooks



/policies



/campaigns



This should NOT look like a basic college CRUD application.



Make it visually polished.



Use:



responsive design

cards

clean typography

modern dashboard

status badges

charts

timeline

AI assistant interface

clear approval modal

payment status

audit timeline



Create a consistent design system.



Use icons where useful.



Implement:



Server-side secret management

Input validation

SQL injection protection through Prisma

Rate limiting

CORS

Helmet

Webhook signature verification

Idempotency

Request IDs

Server-side policy enforcement

No payment secret in frontend

No arbitrary AI tool execution

Maximum transaction limit



Create a one-click Demo Mode.



The reviewer should be able to start the application and immediately understand the product.



Include:



"Load Demo Data"



button.



It should create:



demo merchant

demo customer

products

relationships

historical events

sample analytics



Clearly label generated data as demo/test data.



Create:



Developer Demo Controls



Options:



\[Simulate LLM Unavailable]



\[Simulate Payment Failure]



\[Simulate Duplicate Webhook]



\[Simulate Invalid Webhook Signature]



\[Simulate Policy Violation]



These should be safe simulations.



They must never interact with real money.



Create documented REST endpoints.



Examples:



GET /api/products



GET /api/products/search



POST /api/assistant/message



GET /api/cart



POST /api/cart/items



DELETE /api/cart/items/



POST /api/cart/recommendations



POST /api/policy/check



POST /api/orders/approve



POST /api/orders



POST /api/payments/verify



POST /api/webhooks/razorpay



GET /api/orders/



GET /api/audit



GET /api/dashboard/metrics



GET /api/dashboard/insights



POST /api/campaigns



GET /api/campaigns



POST /api/demo/reset



POST /api/demo/failure



Create:



/docs/API.md



Document:



endpoint

method

request

response

errors

authentication requirements



Also provide Postman collection if practical.



Create automated tests.



At minimum test:



Product search

Recommendation logic

Policy allows valid transaction

Policy blocks transaction above limit

Customer approval required

Razorpay order creation abstraction

Webhook signature verification

Duplicate webhook protection

Payment failure handling

Audit event creation

LLM fallback

Cart calculation



Add integration tests where practical.



Never show raw stack traces to users.



Create user-friendly messages.



Example:



Instead of:



"ECONNRESET"



Show:



"We couldn't confirm the payment right now. Your order has not been marked as paid. We're checking the payment status safely."



Backend logs should contain the technical error.



Create a professional README.md.



Include:



Project overview



Why this project exists



Architecture



Screenshots placeholders



Features



Tech stack



Security model



Agent architecture



Policy engine



Razorpay integration



Webhook handling



Failure handling



Database schema



Local setup



Environment variables



How to run



How to seed demo data



How to test



How to configure Razorpay Test Mode



How to configure webhook endpoint



Deployment instructions



Known limitations



Future improvements



Create:



.env.example



Include:



DATABASE\_URL=



RAZORPAY\_KEY\_ID=



RAZORPAY\_KEY\_SECRET=



RAZORPAY\_WEBHOOK\_SECRET=



OPENAI\_API\_KEY=



OPENAI\_MODEL=



PORT=



FRONTEND\_URL=



Do NOT create a real .env containing fake Razorpay secrets.



Add .env to .gitignore.



Prepare the application for deployment.



Prefer:



Frontend → Vercel



Backend → Render/Railway/Fly.io



Database → Neon/Supabase/PostgreSQL provider



But keep the architecture portable.



The README must explain deployment.



Make sure environment variables are configurable.



Create:



.gitignore



README.md



LICENSE



.env.example



CONTRIBUTING.md if useful



Do not commit secrets.



Do not commit node\_modules.



Do not commit generated database files unnecessarily.



Use meaningful commits if Git is available.



Implement structured server logs.



Every request should have:



request\_id



timestamp



route



status



duration



error if any



Payment-related logs must include safe identifiers only.



Never log:



Razorpay secret



LLM API key



full payment credentials



sensitive customer information



Use Razorpay Test Mode only.



Never claim that a test transaction is real money.



Do not implement fake Razorpay endpoints.



Do not imitate Razorpay API responses when a real Test Mode integration is available.



Create the real Razorpay order using Test Mode credentials.



Use real Razorpay Checkout.



Use real webhook verification.



If credentials are missing, provide a deterministic local/demo mode that is clearly labeled.



The final README must include:



"What broke at 2 AM"



Use the actual failure encountered during development.



DO NOT invent a failure.



When you encounter a real error while building/testing the project, document:



What broke

Error message

Root cause

How it was diagnosed

Fix

Test proving the fix

Prevention



Example format:



2:00 AM — Duplicate webhook bug



Problem:

The same webhook event caused revenue to increment twice.



Root cause:

Webhook handler was not idempotent.



Fix:

Stored x-razorpay-event-id in WebhookEvent and rejected already-processed events.



Verification:

Sent the same webhook twice.



Result:

First event processed.

Second event safely ignored.



Do NOT fabricate this if a different real failure occurs.



Create:



docs/DEMO\_SCRIPT.md



The video should be approximately 5 minutes.



Structure:



0:00–0:30



Problem + product pitch.



0:30–1:20



Customer asks AI:



"I need work-from-home accessories under ₹4000."



Show AI finding products.



1:20–2:00



AI recommends cross-sell.



Show explanation.



2:00–2:40



Show policy engine.



Show:



Cart total



Spending limit



Approval gate



Then click:



Approve Purchase



2:40–3:30



Open Razorpay Test Mode Checkout.



Complete test payment.



Show successful payment.



3:30–4:10



Show webhook arriving.



Show order changing to PAID.



Show audit trail.



4:10–4:40



Trigger duplicate webhook failure.



Show:



"Duplicate detected — ignored safely."



4:40–5:00



Merchant dashboard.



Show:



Revenue



AOV



AI recommendations



Upsell revenue



Audit trail



Finish with:



"The agent can recommend and act, but money movement is always bounded by policy and gated by explicit approval."



DO NOT CONSIDER THE PROJECT COMPLETE UNTIL:



\[ ] Frontend runs



\[ ] Backend runs



\[ ] Database works



\[ ] Demo data can be loaded



\[ ] AI assistant works



\[ ] Deterministic fallback works



\[ ] Product search works



\[ ] Recommendations work



\[ ] Cross-sell works



\[ ] Policy engine works



\[ ] Approval gate works



\[ ] Razorpay Test Mode order creation works



\[ ] Razorpay Checkout works



\[ ] Payment verification works



\[ ] Webhook endpoint works



\[ ] Webhook signature verification works



\[ ] Duplicate webhook handling works



\[ ] Audit trail works



\[ ] Dashboard metrics work



\[ ] Failure simulation works



\[ ] Automated tests pass



\[ ] README works for a fresh developer



\[ ] No secrets are committed



\[ ] No TODO placeholders remain for core functionality



\[ ] Production build succeeds



\[ ] Frontend production build succeeds



\[ ] Backend starts successfully



\[ ] Database migrations work



Work autonomously.



Do not stop after creating a plan.



Actually create the files.



First inspect the current directory.



Then:



Design architecture.

Create project structure.

Initialize frontend/backend.

Install dependencies.

Create database schema.

Implement backend.

Implement policy engine.

Implement AI layer.

Implement Razorpay integration.

Implement webhook processing.

Implement audit trail.

Implement frontend.

Implement dashboard.

Implement failure simulations.

Seed demo data.

Write tests.

Run tests.

Run builds.

Start the application.

Fix every error you encounter.

Verify the complete happy path.

Verify at least one failure path.

Write the README.

Write the 5-minute demo script.

Show me the final project structure.

Give me exact commands to run it.



If you encounter an error, DO NOT simply tell me about it.



Diagnose it.



Fix it.



Run the relevant test again.



Continue.



If an external API credential is unavailable, implement a clearly labeled fallback rather than blocking the entire project.



Do not use fake success responses for real Razorpay operations.



When implementation is complete, report:



What was built.

Architecture.

Tech stack.

Files/folders created.

Commands to install.

Commands to run frontend.

Commands to run backend.

Database setup.

Razorpay Test Mode setup.

Webhook setup.

Environment variables required.

Tests executed and their results.

Production build results.

The real failure encountered during development.

How that failure was fixed.

Exact 5-minute demo flow.

Any remaining limitations.



IMPORTANT:



Do not claim something works unless you actually tested it.



Do not claim Razorpay payment works unless the integration has been implemented and tested/configured.



Do not fabricate test results.



Do not fabricate the 2 AM failure story.



Build the project now.

