# Aligned Product Assistant

Aligned Product Assistant is a full-stack AI product recommendation application for consumer computer hardware. It combines a structured product catalogue, a Gemini-powered customer assistant, grounded recommendations, multilingual conversations, response-quality scoring, a business-owner dashboard, and post-conversation reports with customer feedback.

## Live application

- Application: <https://aligned-product-ai-assistant.vercel.app>
- API: <https://aligned-product-assistant.onrender.com>
- Health check: <https://aligned-product-assistant.onrender.com/api/health>

## Why consumer computer hardware

Consumer computer hardware is a useful domain for grounded recommendations because products have objective specifications that support meaningful comparisons. Customers can express practical constraints such as budget, portability, gaming, productivity, programming, and platform compatibility, while the catalogue provides enough variation for the assistant to make evidence-based recommendations.

## Catalogue and product details

The seeded catalogue contains 20 products:

| Category | Products |
| --- | ---: |
| Laptops | 8 |
| Desktop PCs | 5 |
| Monitors | 3 |
| Keyboards | 2 |
| Controllers | 2 |

Each product has a real product image, name, description, price, category, and structured category-specific attributes. Images are bundled as stable assessment assets, rather than loaded from third-party hotlinks at runtime. The public product-details route displays category-specific specifications and can prefill the customer chat with a question about the selected product. Catalogue, recommendation, and report product cards link back to those public details where applicable.

The business owner can create and edit products, deactivate and reactivate them, and permanently delete products when they have no recommendation history. Inactive products remain in the database so historical recommendations continue to reference the product that was originally recommended.

## Grounded assistant

The assistant uses Gemini through `@google/genai`. It receives a compact, active-catalogue context and bounded conversation history. Its instructions require it to:

- recommend only active catalogue products;
- use exact catalogue product IDs and no more than three recommendations;
- use only stored catalogue facts for prices, specifications, compatibility, and comparisons;
- return no recommendations and say so when the catalogue has no suitable product.

Recommended product IDs are validated against active catalogue records before persistence, and duplicate recommendations are removed. The assistant is designed not to invent product facts; generation constraints and server-side recommendation validation form the main grounding safeguards before an assistant message is stored.

### Language handling

- English input receives an English response.
- Arabizi input receives natural Lebanese-style Arabizi.
- Arabic input receives an Arabic-script response.
- Conversations with different user-language classifications are stored as mixed.

Every message stores its language classification. Arabizi instructions deliberately permit natural English technical terms such as `laptop`, `RAM`, `gaming`, and `budget`, while avoiding Arabic script unless the conversation is genuinely mixed.

### Owner-configurable assistant behavior

Business owners can update the assistant name and business-facing behavior instructions from `/dashboard/settings`, so a client can adjust the assistant’s personality and tone without requiring a developer. Those values are stored in `AssistantSettings` and loaded before each Gemini generation. The same settings record supplies the high-risk scoring threshold used when an assistant reply is scored.

These owner settings apply to business-facing behavior, not to safety or grounding guarantees. Developer-controlled safeguards remain enforced in code and cannot be overridden by owner instructions, including catalogue-only grounding, prohibitions on invented products, prices, or specifications, language matching, structured output, recommendation validation, scoring logic, retry and timeout behavior, and rate limits. Settings changes are persisted in the database and take effect dynamically without a redeploy.

## Response quality scoring

Assistant replies are scored with a hybrid approach.

Deterministic catalogue checks verify product existence, exact prices, weights, RAM, GPU names, resolutions, and explicit price or weight comparisons where those can be checked from catalogue data. Gemini then evaluates remaining factual and subjective claims against the same catalogue context.

This approach is more reliable than model-only evaluation because exact catalogue facts are checked deterministically first, while Gemini is used only for claims that need semantic interpretation. It reduces reliance on a second model for facts that can be verified directly, while still evaluating subjective recommendation reasoning.

```text
Accuracy = supported factual claims / total factual claims × 100

Hallucination risk = severity-weighted unsupported factual claims
                     / total weighted factual claims × 100
```

The severity weights are:

| Claim type | Weight |
| --- | ---: |
| Nonexistent product | 4 |
| Incorrect price | 3 |
| Invented specification | 3 |
| Incorrect comparison | 2 |
| Weak suitability claim | 1 |

High-risk responses and critical catalogue errors are flagged for business-owner review. The customer-facing chat and public report do not display accuracy, hallucination risk, or flagged state; the owner dashboard displays those values and the fallback-scoring mode.

### Scoring fallback

If Gemini's semantic evaluator is temporarily unavailable after its allowed retry, a valid grounded assistant reply can still be delivered. The application scores only the deterministic evidence that is actually available, adds no fabricated hallucination evidence, stores `scoringMode` as `DETERMINISTIC_FALLBACK`, and flags the response for owner review. Evaluator unavailability is reduced confidence in scoring, not proof that the assistant hallucinated.

If deterministic scoring itself unexpectedly fails, the final defensive fallback stores 0 accuracy, 100 hallucination risk, a flagged state, and `DETERMINISTIC_FALLBACK`.

### High-risk production handling

For this assessment, high-risk replies are stored and flagged for review rather than blocked. A production workflow would hold a high-risk response, regenerate it with stricter grounding, rescore it, and escalate it to a human reviewer if it remains risky.

## Conversations, reports, and feedback

Customers explicitly end a conversation. When it ends, the application generates a concise summary from USER messages only, preserving the conversation's dominant language where possible. A token-scoped public report then shows the customer request summary, the products recommended with their reasons, and a feedback form for a rating and optional comment. A valid report link does not require authentication. It does not expose internal quality scores, flag states, provider metadata, or database conversation IDs.

Customers can update feedback through the same report token. The business-owner conversation detail view shows the stored request summary and feedback alongside the full message history, recommendation history, per-message scores, conversation averages, flagged responses, and fallback-scoring warnings.

## Business-owner dashboard

The reviewer dashboard provides:

- product management with create, edit, deactivate/reactivate, and safe permanent-delete flows;
- a newest-first conversation list with message counts, score averages, and flagged-response counts;
- full conversation detail with USER and ASSISTANT messages displayed distinctly;
- per-assistant-message accuracy, hallucination-risk, flagged state, and scoring mode;
- customer request summaries and submitted feedback;
- `/dashboard/settings`, available from the shared dashboard navigation, where owners can configure the assistant name, behavior instructions, and high-risk scoring threshold.

> This assessment intentionally exposes the dashboard without authentication so reviewers can inspect product management and conversation monitoring. In production, dashboard routes and APIs would be protected by authenticated admin accounts, role-based authorization, and tenant isolation.

## Abuse protection and reliability

Public AI use is enforced server-side:

- IP rate limit: 20 AI message requests per IP per hour by default;
- conversation cap: 15 USER messages per conversation by default;
- USER message length: 1,000 characters by default;
- JSON request-body limit: 10 KB.

Only the provider-triggering message route is rate-limited; catalogue, report, and dashboard reads remain available. The current `express-rate-limit` store is in memory, so a multi-instance production deployment should use shared storage such as Redis.

Gemini requests have a bounded 20-second timeout. Retries are bounded: retryable output failures get one retry, and only transient timeout, network, or provider-503 failures during assistant generation can receive a limited third attempt. Semantic-scoring failures are isolated from an otherwise valid assistant answer through deterministic fallback scoring.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, CSS Modules |
| Backend | Node.js, Express, Prisma |
| Database | PostgreSQL on Supabase |
| AI | Gemini via `@google/genai` |
| Deployment | Vercel frontend, Render backend, Supabase database |

## Data model

- **Product** stores catalogue details, structured attributes, availability, and product imagery.
- **Conversation** stores session state, language, end state, report token, and summary.
- **Message** stores USER and ASSISTANT messages, language, quality scores, flag state, and scoring mode.
- **Recommendation** belongs to an assistant message and references a product.
- **Feedback** belongs to one conversation and stores a rating with an optional comment.
- **AssistantSettings** stores the owner-configurable assistant name, business-facing behavior instructions, and high-risk threshold.

A conversation has many messages, an assistant message can have many recommendations, each recommendation references one product, and a conversation can have one feedback record.

## Local setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure the variables listed below.
npx prisma generate
npx prisma migrate deploy
npm run seed
npm start
```

The current backend package has no separate development script; `npm start` runs `node src/server.js`. Use `prisma migrate dev` only when developing a schema change and creating a new local migration.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the backend URL, without a trailing slash. For local development, the example value is `http://localhost:3000`.

## Environment variables

Backend variables:

- `DATABASE_URL`
- `DIRECT_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `FRONTEND_URL` or `FRONTEND_URLS`
- `AI_RATE_LIMIT_MAX`
- `AI_RATE_LIMIT_WINDOW_MINUTES`
- `MAX_MESSAGES_PER_CONVERSATION`
- `MAX_MESSAGE_LENGTH`

Frontend variables:

- `VITE_API_URL`

Use the included `.env.example` files as placeholders only. Never commit real database credentials or Gemini API keys.

## Production deployment

### Render backend

- Root directory: `backend`
- Build command: `npm ci && npx prisma generate && npx prisma migrate deploy`
- Start command: `npm start`

Set `DATABASE_URL`, `DIRECT_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, the applicable CORS origin (`FRONTEND_URL` or `FRONTEND_URLS`), and the optional rate/message limit variables in Render. Render supplies `PORT` in production.

### Vercel frontend

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL`

`frontend/vercel.json` rewrites routes to `index.html` so direct visits and refreshes of `/chat`, `/products/:id`, `/report/:token`, and dashboard routes continue to load the React SPA.

Run migrations through `npx prisma migrate deploy` in production, not `prisma migrate dev`. Seed the catalogue once after migration with:

```bash
cd backend
npm run seed
```

## Product images

Real manufacturer or retailer product imagery is bundled for assessment stability. A production deployment should use merchant-owned or appropriately licensed assets in object storage with an admin upload workflow. The assistant reasons from structured product data, not raw image understanding.

## Testing and verification

Development verification has included:

- manual and direct API checks for catalogue CRUD, conversations, reports, feedback, scoring, and rate limits;
- Prisma schema validation and migration checks;
- frontend linting and production builds;
- live Gemini checks for English, Arabizi, Arabic, grounded recommendations, no-match handling, prompt-injection resistance, and follow-up context;
- public deployment smoke checks. The deployed health endpoint, catalogue API, and Vercel frontend returned HTTP 200 during the final README review.

There is no comprehensive automated test-suite command in the current package scripts; validation is performed through the focused checks above.

## AI coding assistant disclosure

The existing repository structure and its React/Vite frontend and Express/Prisma backend were used as the application base. The frontend uses React, React Router, Vite, and CSS Modules; the backend uses Express, Prisma, `@google/genai`, `cors`, and `express-rate-limit` in the layers documented above.

ChatGPT was used for planning, architecture discussion, debugging, review, and documentation guidance. OpenAI Codex CLI was used to implement and review scoped code changes. Final design decisions, testing, integration, and review were performed by the developer.

## Production cost estimate

At 1,000 conversations per day with roughly five customer turns each, the normal workload is about 5,000 assistant-generation calls and 5,000 semantic-scoring calls, plus up to 1,000 summary calls when conversations end. Using Gemini 3.1 Flash-Lite paid pricing of [$0.25 per 1M input tokens and $1.50 per 1M output tokens](https://ai.google.dev/gemini-api/docs/pricing), the cost should likely remain in the low tens of US dollars per day under moderate prompt sizes; the actual total depends on token volume, conversation length, and transient retries, so no exact daily amount is claimed without measured usage. Costs can be reduced through the compact catalogue context, bounded conversation history, deterministic checks before semantic scoring, avoiding unnecessary retries, caching reusable context where practical, and lower-cost or batch processing for non-latency-sensitive scoring or summaries.

## What I would build next

- Authentication, authorization, and tenant isolation for dashboard and API access.
- Object storage and admin-managed product image uploads.
- Shared rate-limit storage for multi-instance deployments.
- Stronger observability, traces, and operational alerting.
- Idempotent message handling after provider failures.
- Optional vision-assisted image attribute extraction with review controls.
- Broader automated integration and end-to-end test coverage.

## What I would not trust yet

I would not trust high-risk AI recommendations without human review, fallback-only quality assessments without business-owner review, billing-critical pricing decisions, visually inferred product facts, full production admin security, or large-scale multi-tenant usage. Those cases need the production controls, monitoring, data governance, and review processes described above.

## Known limitations

- Authentication is intentionally omitted for assessment review.
- Rate limiting uses an in-memory store rather than shared infrastructure.
- A manual resend after a provider failure has no idempotency key.
- Image understanding and product image uploads are not implemented.
- Provider availability can affect response latency and retries.
