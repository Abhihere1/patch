# Patch — Discount Tire IT Support

Self-service IT support for Discount Tire associates. Patch guides users through AI-powered troubleshooting backed by a local Knowledge Base, with full incident tracking and escalation flows.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB
- **AI**: Anthropic Claude (claude-sonnet-4-6)
- **Auth**: JWT via `jose` (httpOnly cookies)
- **Styling**: Tailwind v4 + custom CSS design system
- **Deployment**: Vercel

## Features

- Split-screen auth (login/signup) with branded left panel
- Landing page with VDI category tile and KB status badge
- Full chat experience: user/assistant bubbles, typing indicator, dynamic controls
- Dynamic response UI: button chips (2–4 options), select lists (5+), structured multi-card forms
- Persistent chat controls: probable options and form state stored in MongoDB and restored on resume
- Resume Chat from incident detail page
- Incident list with status filters (All / Open / Escalated / Resolved)
- Incident detail with conversation history, progress timeline, and metadata
- Escalation and resolution flows with summary cards
- Feedback system (star rating + comment) on resolved/escalated incidents
- Inline image rendering from `knowledge_base/images/` via `/api/images/[filename]`

## Setup

1. Copy `.env.example` to `.env.local` and fill in values:

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB=patch
JWT_SECRET=your-long-random-secret
ANTHROPIC_API_KEY=sk-ant-...
```

2. (Optional) Add KB files to `knowledge_base/workflows/vdi.md` for VDI troubleshooting content.

3. Install dependencies and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx              — Main landing + chat page
  login/page.tsx        — Login
  signup/page.tsx       — Signup
  incidents/page.tsx    — Incident list
  incidents/[id]/page.tsx — Incident detail
  api/
    auth/               — login, logout, signup, me
    chat/               — Main chat endpoint (LLM + MongoDB)
    incidents/          — GET list, GET by id, POST feedback
    kb/status/          — KB availability check
    images/[filename]/  — Serve KB images

lib/
  mongodb.ts            — MongoDB connection
  auth.ts               — JWT auth (jose)
  kb.ts                 — Knowledge base read utilities
  llm.ts                — Anthropic SDK + system prompt + JSON parsing
  incidents.ts          — Incident CRUD

components/
  Header.tsx
  PatchLogo.tsx
  StatusBadge.tsx
  AssistantMessage.tsx  — Markdown renderer + image resolver
  DynamicControls.tsx   — Button chips, select lists, device forms
  FeedbackCard.tsx
  IncidentSummaryCard.tsx

types/index.ts          — Shared TypeScript interfaces
knowledge_base/         — (gitignored content, created externally)
  workflows/            — .md files per category
  images/               — Images referenced in KB files
```

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | Database name (default: `patch`) |
| `JWT_SECRET` | Secret for JWT signing |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

## Knowledge Base

- Place Markdown files in `knowledge_base/workflows/` (e.g., `vdi.md`)
- Place referenced images in `knowledge_base/images/`
- The app is read-only — it never writes to the KB directory
- Image tags in KB Markdown (`![alt](filename.png)`) are rendered inline in chat
