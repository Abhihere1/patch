# Prompts

## Ticketing Agent Prompt

```text
Read the attached requirements file and generate the full ticket set from it. The requirements file is the source of truth. Follow its ticket structure exactly. Do not compress, reinterpret loosely, or omit small UI, persistence, resume, validation, escalation/resolution, category-routing, or prompt-behavior details. Do not invent implementation details beyond what the file states or clearly requires. Preserve dependency labels, dedicated-ticket boundaries, anti-regression rules, and any explicitly stated UI or behavior contracts. Each ticket must be complete enough for a coding agent and testing agent to work from without this conversation.
```

## Scanner Addition Prompt

```text
Create a dedicated implementation ticket to add a new Scanner category tile alongside the existing VDI tile on the main page. The ticket must preserve the current category-tile UI pattern, KB status badge treatment, hover behavior, spacing, and landing-page hierarchy already established for VDI. The Scanner tile must integrate into the existing category-selection and chat flow so selecting it starts or anchors the conversation in the Scanner workflow without breaking the current VDI flow, the no-tile cross-KB retrieval behavior, incident creation, resume behavior, New Chat behavior, or any existing category-routing logic. Treat this as an additive feature, not a redesign, and include all required UI, retrieval, routing, persistence, and acceptance details needed for a coding agent to implement it safely.
```
