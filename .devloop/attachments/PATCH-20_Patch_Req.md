# Patch — Self-Service Chatbot Requirements
---

## 1. Overview

Patch is a self-service chatbot designed for Discount Tire store associates. It provides an alternative self-service path to resolution directly from the associate's desktop, reducing Helpdesk call volume. Patch includes a Knowledge Base module that uses curated troubleshooting content stored as Markdown `.md` files to provide smarter, context-aware troubleshooting assistance.

## Agent Instructions

This document is the implementation specification. Treat every requirement in this file as authoritative unless it is explicitly labeled as an example.

Create implementation-ready tickets from this file. Do not summarize away behavior, persistence rules, validation rules, UI rules, or system-prompt rules. Do not merge unrelated behaviors into one broad ticket.

If a section or subsection says it must produce its own dedicated ticket, that ticket must include:
- user-visible behavior
- backend or persistence behavior
- UI requirements
- state handling before, during, and after interaction
- restore/resume behavior when applicable
- acceptance criteria


**Interpretation rules:**
- `Must` means required.
- `Must not` means prohibited.
- If a requirement mentions persistence, history, refresh, resume, or reopening an incident, the ticket must state what is stored, what is restored, and what the user sees after restoration.
- If a specific rule conflicts with a general rule, the specific rule wins for that surface.
- Repeated UI rules are intentional emphasis and must not be dropped.

**Non-negotiable product rules:**
- Patch is an issue-resolution product, not a general-purpose chat app.
- Knowledge Base workflows are the source of truth for troubleshooting behavior.
- MongoDB persistence is required for incident history, dynamic control state, and resume behavior.
- Dynamic chat controls are product workflow, not throwaway UI.
- Resume Chat must restore actionable state, not just transcript text.
- The UI must use a deliberate white/red product language. Generic dashboard styling does not satisfy this document.

**Ticket rules:**
- One dedicated ticket per section or subsection marked as dedicated.
- Do not omit explicit data fields, edge cases, restore behavior, or validation behavior.
- Do not reduce UI requirements to phrases like `match mockup`, `nice styling`, or `use clean design`.
- If backend, frontend, persistence, and prompt behavior are coupled, the ticket must say so explicitly.
- Nothing described in this document is optional unless the document explicitly says it is optional.
- If a line exists in the requirements, the ticketing agent must assume it needs to be represented in a ticket either as scope, acceptance criteria, data behavior, or implementation notes.

**Required ticket structure:**
- Ticket title
- Objective / user outcome
- Scope
- Included UI requirements
- Included backend / persistence requirements
- State handling and edge cases
- Dependencies or coupled systems
- Implementation pass recommendation
- Can be implemented independently? (`Yes`, `Partially`, or `No`)
- Acceptance criteria
- Explicit out-of-scope items only if the document clearly excludes them

**Dependency and pass-planning rules:**
- Tickets should be structured so they can be handed to a coding agent in separate implementation passes whenever possible.
- Each ticket must be as self-contained as possible without hiding real dependencies.
- If a ticket depends on another ticket, the dependency must be named explicitly rather than assumed.
- If a ticket can be built independently, the ticket should say so clearly.
- If a ticket can be built only after another ticket exists, the ticket should say `Depends on` and name the prerequisite tickets or sections.
- The ticketing agent must prefer explicit dependency labeling over merging unrelated tickets together.
- The ticketing agent must not create artificial independence by removing required context, persistence rules, or shared behavior.
- If two tickets share context but are still separable, each ticket should contain a short `Context needed from prerequisites` note instead of being merged.
- Tickets should be written so a later implementation pass can pick them up without re-reading the entire specification, as long as the listed dependencies are also provided.
- The ticketing agent should add one of these dependency labels to every ticket:
  - `Independent`
  - `Depends on`
  - `Blocks`
  - `Can run in parallel with`

Every section below that says "This section must produce its own dedicated ticket" or "This subsection must produce its own dedicated ticket" must become its own separate ticket. The full dedicated-ticket list is:
- Section 4: Authentication (login + signup pages)
- Section 5: Main Page (landing, welcome, VDI tile)
- Section 5.1: Main Application Layout (pre-chat state, active chat state, header navigation)
- Section 6: Knowledge Base Management (user-supplied KB folder usage, retrieval, filename-based image parsing)
- Section 6.2: Inline Image Rendering in Chat — critical standalone ticket, must not be merged into KB retrieval. This ticket is high-importance because the UI must preserve inline troubleshooting images exactly where they appear in the workflow response.
- Section 7: MongoDB Persistence
- Section 7.0: Incident Pages (incidents list + incident detail page)
- Section 8: Conversation Flow
- Section 8.1: Conversation Continuity Rules
- Section 8.2: Dynamic Response UI — LLM-driven buttons, select lists, input forms
- Section 8.2.1: Probable Option Persistence And Resume Behavior
- Section 8.2.2: Structured Form Sessions And Frontend Validation
- Section 8.3: LLM System Prompt — JSON schema, output sanitization, escalation and resolution triggers
- Section 8.3.1: LLM Behavioral Guardrails And Scope Control
- Section 9.1: Escalation flow — summary card, feedback placement, MongoDB update
- Section 9.2: Resolution flow — summary card, feedback placement, MongoDB update
- Section 10: Feedback — star rating, optional comment, integrated final-outcome feedback section, persistence
- Section 11: Resume Chat and New Chat
- Section 14: Visual Design System — global palette, typography, cards, buttons, chat UI, status badges

**Critical ticketing rules:**
- Distinct persisted behavior, resume behavior, system-prompt behavior, validation behavior, and final-state behavior must be tracked explicitly in tickets.
- Do not collapse dynamic controls, probable options, structured forms, and resume behavior into one generic "chat improvements" ticket.
- If a control must remain visible in history, the ticket must state both active-chat behavior and restored-history behavior.
- If the frontend must validate before continuing, the ticket must state the validation rule and blocked-continue behavior.
- Do not create one generic "UI polish" ticket for all screens. Functional tickets must carry their own UI requirements. The design system ticket complements them.
- Before finalizing any ticket, the agent must check that it has captured:
  - every explicit UI behavior
  - every persistence or MongoDB rule
  - every restore/resume rule
  - every validation rule
  - every final-state rule
  - every LLM or system-prompt rule tied to that feature
  - every acceptance criterion implied by the section text

**Completeness rules:**
- Do not compress multiple explicit bullets into one vague summary bullet.
- Do not drop a detail because it appears small, visual, repetitive, or implementation-specific.
- Do not assume a detail is covered indirectly if it is stated explicitly elsewhere; restate it in the relevant ticket when needed.
- If a section contains UI details, data behavior, and persistence behavior, the ticket must contain all three.
- If a section describes what happens in active chat, incident history, and resume flows, the ticket must contain all three states separately.
- If a requirement affects both active chat and incident detail pages, the ticket must call out both surfaces explicitly.

---

## 2. Goals & Objectives

- Reduce inbound Helpdesk call volume for common, well-supported issues.
- Provide store associates with a fast, guided, self-service troubleshooting experience.
- Maintain a searchable Knowledge Base of extracted troubleshooting text that the AI can reference.
- Capture every interaction in MongoDB so the business can measure adoption and effectiveness.
- Log escalation events for L2 / Trusted Experts when Patch cannot resolve an issue.
- Deliver a clean, amazing, production-grade UI that feels premium and cohesive across the full website, not just functionally complete.

## 3. Technology Stack

- **Frontend / Application Framework:** Next.js
- **Data Store:** MongoDB (Users, Transactions, Knowledge Base metadata)
- **AI/LLM:** Ollama using the `gemma4:31b-cloud` model via the cloud API at `https://ollama.com`, authenticated with an API key
- **Authentication:** Username, email, and password stored in MongoDB
- **External Integrations:** Internal user profile API for store name and location lookup

MongoDB must be used for:
- incident persistence
- conversation history
- knowledge base metadata
- retrieved knowledge base text references
- escalation details
- feedback information
- active assistant response controls and resumeable structured-input state

Ollama with the `gemma4:31b-cloud` model must be used as the primary LLM runtime for troubleshooting response generation. Do not use Anthropic SDK, OpenAI SDK, or any other LLM provider — Ollama via direct fetch to `OLLAMA_BASE_URL` is the only permitted integration.

**Ollama API Key requirement (critical):**
- The Ollama endpoint is the remote cloud service at `https://ollama.com`. Do not configure or assume a local installation or `localhost`.
- `OLLAMA_BASE_URL` must be set to `https://ollama.com` in the environment configuration.
- All requests to the Ollama API must include an `Authorization: Bearer <OLLAMA_API_KEY>` header.
- `OLLAMA_API_KEY` must be read from an environment variable at runtime. It must never be hardcoded in source code.
- If `OLLAMA_API_KEY` is missing or empty at startup, the application must fail with a clear configuration error rather than silently sending unauthenticated requests.
- Every fetch call to `OLLAMA_BASE_URL` must include the header: `Authorization: Bearer ${process.env.OLLAMA_API_KEY}`.

**Model requirement (critical):**
- The only permitted model is `gemma4:31b-cloud`. No other model name may be used anywhere in the codebase.
- The model name must be read from the environment variable `OLLAMA_MODEL`. Its value must always be `gemma4:31b-cloud`.
- The implementation must never substitute, override, or fall back to any other model (e.g., `llama3`, `mistral`, `gemma2`, or any default). If `OLLAMA_MODEL` is missing, the application must fail at startup with a clear configuration error.
- Every request body sent to `OLLAMA_BASE_URL` must use `model: process.env.OLLAMA_MODEL`.

## 4. Access & Launch

This section must produce its own dedicated ticket.

- Patch is launched from a desktop icon labeled **Patch**.
- When the user clicks the Patch icon, the system opens the Patch login screen.
- Users must be able to **log in** using their **email** and **password**.
- Users must be able to **sign up** using their **username**, **email**, and **password**.
- Authentication is handled by verifying the credentials against the **Users** collection in MongoDB.
- If authentication succeeds, the user is logged into Patch.
- If authentication fails, the user must see a clear inline error message beneath the form.

**Login page UI:**
- Full-viewport split layout with no scrolling. Left panel is a branded atmosphere panel; right panel is the form panel.
- Left panel: soft warm off-white to pale blush gradient background with faint radial glow and subtle geometric tire-track or grid texture at very low opacity.
- Left panel top-left: Patch logo lockup with the red circular mark and the word `Patch`.
- Left panel hero content, vertically centered:
  - eyebrow: `Discount Tire Information Center`
  - heading: `IT support, resolved faster.`
  - supporting copy: one short sentence explaining guided self-service support for store associates
  - two small supporting stats or proof points displayed inline, visually subdued and enterprise-like
- Right panel: clean white or near-white surface with the sign-in form centered vertically and horizontally.
- Form treatment: no heavy chrome. Use a floating form layout or a very subtle card with soft shadow and generous whitespace.
- Card heading: `Sign in to Patch` in bold with a short muted subheading beneath it.
- Fields: Email, Password — both full-width with label above each field.
- Inputs: pill or softly rounded rectangular fields, premium spacing, clear focus state in the Patch red family.
- Primary red `Sign In` button, full-width, below the fields.
- A secondary text link below the button: `Don't have an account? Sign up` that navigates to the signup page.
- Inline error must appear directly near the form content and must not use a bulky alert-box treatment.

**Signup page UI:**
- Same split layout and visual language as login.
- Card heading: `Create your account`
- Fields: Username, Email, Password — all full-width with label above each field.
- Primary red `Sign Up` button, full-width.
- Secondary text link: `Already have an account? Sign in`
- On successful signup, redirect to login page with a success message.
- Success message should be compact and lighter than the error state.

## 5. Main Page

This section must produce its own dedicated ticket.

**Screen contract:**
- Surface: one centered hero/workspace composition on a light page background
- Primary focal order: Patch mark -> welcome text -> VDI tile -> chat input
- Maximum hero content width: approximately 720–840px
- The page must look intentionally centered; it must not read like a left-aligned admin dashboard

- The header does **not** display the username — username appears only in the welcome message on the main page (see welcome copy below).
- If a username is unavailable, the welcome message must display the email prefix as the fallback.
- The main page presents one issue category as a clickable card in Phase 1 scope:
  - **VDI**
- **Knowledge Base Status Indicator:** Each card must visually display whether troubleshooting text is available for that category in the Knowledge Base (for example, `KB Available` or `KB Missing`).
- The home page focuses on the active Patch experience with one production-ready VDI support tile.
- The landing experience should introduce the assistant as **Patch**.
- The welcome copy must be displayed as two lines:
  - Line 1: `Welcome to the Discount Tire Information Center, {username}.` — the username must be visually highlighted in red so it stands out from the surrounding text
  - Line 2: `My name is Patch. Let's get you taken care of.` — rendered in a lighter weight or muted color beneath line 1
  - Clear hierarchy and generous spacing are required.
- Landing composition: centered Patch mark, strong headline, one primary support tile, and generous spacing.
- VDI tile: refined iconography, strong hover state, soft shadow, and compact KB status badge.
- The landing hero block should use a controlled reading width so the page does not stretch into a generic dashboard layout.
- The single VDI tile should read as the primary selectable object on the page: centered, visually elevated, and large enough to feel deliberate rather than incidental.
- Patch mark block:
  - centered above the welcome copy
  - separated from the headline by a clear vertical gap
  - visually smaller than the headline but large enough to anchor the page
- Welcome block:
  - line 1 must be the dominant text
  - line 2 must sit directly below with lighter emphasis
  - the red username highlight must feel deliberate and must not wrap awkwardly under normal desktop widths
- VDI tile footprint:
  - one card only in Phase 1
  - target visual width should feel like a deliberate feature card, not a tiny pill or a full-row table cell
  - icon above label
  - label centered
  - KB badge directly beneath label with tight spacing
  - card padding must be generous enough that the tile feels premium even as a single object on the page

## 5.1 Main Application Layout

This section must produce its own dedicated ticket.

After login, the user remains on a single main page for the primary workflow.

The main page must support two UI states:

### Pre-chat / Landing State
Before the first user message is sent, the page must show:
- persistent top navigation
- welcome section
- a single VDI category tile
- chat input area

This state is the starting workspace for troubleshooting.

Layout requirements:
- the landing welcome block should be centered within the main content container
- the greeting heading and helper text should align with the centered workspace layout
- the pre-chat welcome section, single category tile, and chat input should share the same centered container alignment
- the landing page must use a centered assistant mark, strong welcome headline, one available support tile, and a bottom-anchored chat input
- the page background should use a refined light radial wash or atmospheric gradient so the landing state feels designed, not empty
- whitespace must remain generous even with only one active tile
- the chat input area should read like a persistent workspace tool, with clean separation from the rest of the page and subtle elevation
- the landing container should not exceed the active-chat reading width by a large margin; both states must feel like the same product surface
- the VDI tile should support a hover lift, border-color change, and subtle shadow increase so selection feels responsive
- the KB status badge on the tile should sit close to the tile label and should read like product status, not debug text
- Vertical order contract:
  - top nav
  - centered Patch mark
  - welcome copy
  - single VDI tile
  - bottom-anchored composer
- Spacing contract:
  - clear space between nav and hero block
  - clear space between welcome copy and tile
  - clear space between tile and composer
  - the composer should sit close enough to the hero stack to feel connected, but low enough to preserve the workspace feel
- Composer contract in pre-chat:
  - visually centered with the hero stack
  - same width language as active chat composer
  - rounded outer shell
  - no heavy toolbar chrome
  - strong focus ring in the Patch red family

### Active Chat State
After the user sends the first message, whether a tile is selected or not:
- the page continues on the same route
- the UI must switch into a chat-focused layout
- the tile grid and pre-chat helper content must be hidden
- the conversation area must become the primary focus
- the selected tile context stays active if a tile was chosen
- the page must show conversation history, incident status, and incident actions
- the top navigation stays visible
- when a chat is active or resumed, the conversation area should display the current incident identifier, category, and status near the top of the chat panel

Active chat presentation requirements:
- while the LLM is generating a response, show a typing indicator in the assistant message position — three animated dots or a subtle pulsing placeholder inside an assistant response card. The chat input must be disabled until the response arrives.
- the active conversation area should be centered in the main workspace and should visually align with the provided reference
- user messages should render as right-aligned chat bubbles using the Patch primary red treatment
- Patch assistant responses should render as left-aligned response cards with a white background, subtle border, rounded corners, and comfortable padding
- the Patch assistant avatar or mark should appear beside the assistant response card
- assistant troubleshooting steps should appear inside the response card as cleanly rendered Markdown with numbered lists, spacing, and readable line height
- when assistant content is derived directly from workflow text, Patch must preserve the required instruction content while still presenting it with strong visual hierarchy, deliberate spacing, and readable sectioning. "As-is" content fidelity must not result in a visually raw text dump.
- when workflow content includes a URL or external destination, the response card must render it as a deliberate clickable link treatment, not as plain pasted body text
- links inside assistant responses must remain visually distinct at a glance through clear color treatment and link styling while still fitting the Patch design system
- long URLs must wrap cleanly without breaking the reading flow of the response card; they must not appear as an awkward raw text block jammed into the paragraph copy
- when a cleaner human-readable link label is available from the workflow context, the UI should prefer that readable link presentation over exposing a noisy raw URL string
- when the assistant asks whether the issue is resolved, that follow-up should render as a dedicated decision panel attached to or directly beneath the assistant response
- the decision panel must be visually separated from the main response body
- all option buttons in the decision panel use one consistent visual style — Patch red visual treatment, same size and weight regardless of whether the action is positive or negative (see section 8.2 and section 14 Buttons)
- the chat input should remain anchored at the bottom while the conversation stack grows above it
- the active chat must read as a troubleshooting workspace rather than a plain transcript
- the incident header area at the top of chat must maintain clear hierarchy between incident number, category, and status
- assistant cards should have a distinctive visual signature: soft shadow, subtle border, and a clear left red accent edge
- message spacing must keep multi-step troubleshooting easy to scan
- the chat surface should never feel cramped or claustrophobic; maintain open margins around the conversation column
- summary cards for escalated or resolved states must read as embedded support records and remain part of the same design system
- if an assistant message includes dynamic controls such as probable options or a structured form, those controls must render as part of that exact message block and remain attached to that message in history until the user completes that step
- probable option controls must be visually prominent in the Patch red family so the user immediately recognizes them as the primary next action
- probable option controls must appear in their own clearly separated action area beneath the assistant response body, not as buttons visually jammed into the same paragraph block
- the probable-option area should read like a deliberate next-step surface, with clear spacing or a divider between the response text and the options so the user can immediately understand that these are the next available actions
- probable option controls must look clearly clickable by default, not only on hover. Their default state must already communicate actionability and visual importance.
- the conversation column should use a controlled max width so long replies remain easy to read
- user bubbles should be narrower than the full conversation width and should never span edge-to-edge
- assistant response cards should maintain a comfortable maximum width and clear internal spacing between paragraphs, numbered steps, images, and controls
- the bottom composer should feel like a dedicated workspace bar: rounded container, strong focus state, clear send affordance, and stable spacing from the viewport edge
- the typing indicator card should occupy the same visual footprint as a normal assistant response so the layout does not jump during loading
- Active chat layout reliability requirement:
  - the bottom composer must be pinned without covering conversation content
  - the conversation scroll container must reserve bottom space equal to the composer height plus clear interaction spacing
  - no assistant response content, inline image, dynamic control, summary card, feedback card, or final follow-up question may be hidden, clipped, or partially covered by the composer
  - the chat surface must scroll cleanly above the composer; the composer must not behave like a detached floating overlay sitting on top of live content
  - long assistant responses that contain inline images must maintain deliberate vertical spacing between image, explanatory text, and follow-up decision controls
  - the final resolution question, probable-option block, structured form, escalation summary, resolved summary, and feedback card must remain fully visible and reachable without being visually trapped behind the composer
  - the active chat layout must reserve enough breathing room below the last visible message so the final interactive element never appears jammed against the composer edge
- Active chat screen contract:
  - same top nav as landing state
  - a slim incident header row at the top of the chat column
  - message stack in the center
  - composer pinned to the bottom of the workspace
  - no leftover landing-only hero spacing once chat begins
- Incident header row contract:
  - incident ID first
  - category second
  - status badge third
  - all three must read on one line where space allows
  - the header row must feel lighter than the messages below it
- Message layout contract:
  - assistant messages align left
  - user messages align right
  - timestamps remain secondary and must not compete with message content
  - avatars or initials remain aligned consistently across the stack
- Markdown rendering contract:
  - numbered lists require comfortable vertical spacing
  - headings must visually separate sections
  - inline images must maintain predictable corner radius and spacing
  - paragraphs, steps, controls, and images must never collapse into a dense block

### New Chat
When the user clicks `New Chat`:
- reset the active chat session in the UI
- return the page to the pre-chat landing state
- show the single VDI category tile again
- create a new incident when the user sends the first message in that new chat
- keep the user on the main page
- if `New Chat` is clicked from any other page, Patch should navigate to `/` and open the pre-chat landing state
- the `New Chat` action must work from the persistent header on every page where the header appears
- clicking `New Chat` while already on the main page must still fully reset the active chat state even if the route path does not change
- the implementation must not rely solely on navigation to `/` to trigger the reset
- `New Chat` must clear the active incident ID, message history, read-only or final-state flags, feedback state, active probable options, and any structured-form or partial-form state before returning the UI to the pre-chat landing state

### Header Navigation
The main page must use a persistent top navigation bar.

The navigation bar must use a white background with a subtle bottom border.

The navigation bar must contain:
- **left side:** Patch logo (red circular icon with white mark inside) and app name in dark text beside it
- **right side:** `Incidents`, `New Chat`, and `Logout` as plain text nav tabs — each with a small leading icon (list icon for `Incidents`, compose icon for `New Chat`, logout icon for `Logout`)
- the active page tab must show a red underline; inactive tabs render in plain dark text
- `Incidents` must show a small numeric badge with the count of the user's incidents
- the header must remain thin, spacious, and free of bulky button styling
- hover states must stay subtle: slight darkening, slight lift, or underline refinement
- the logo area must keep enough breathing room between the mark and app name
- nav text must be slightly stronger than body text
- the incidents count badge must remain compact with clear contrast
- the active underline should be thin, deliberate, and centered beneath the label rather than oversized or heavy
- all three right-side nav items — `Incidents`, `New Chat`, and `Logout` — must use the same tab treatment, spacing rhythm, hover treatment, and underline behavior so `Logout` never appears visually disconnected or unfinished
- `Logout` must not be rendered as a separate highlighted button, pill button, or isolated CTA treatment; it remains part of the same right-side text-tab navigation system as `Incidents` and `New Chat`
- `Incidents`, `New Chat`, and `Logout` must remain grouped on the far right side of the header and must never appear beside the logo block on the left
- the header should remain visually stable across routes; switching between pages must not shift the nav alignment or action spacing
- Header contract:
  - left brand lockup aligned to the same vertical center as the right action cluster
  - right action cluster keeps even horizontal spacing
  - no action should look like a button while the others look like plain text tabs
  - underline position and width must be visually consistent across all three actions

Clicking the Patch logo or app name returns the user to the main page.

If the username is unavailable, the welcome message must display the email prefix as the fallback.

Clicking `New Chat` from the header should always produce a usable result:
- on the main page, it resets the current chat UI to the pre-chat landing state
- on any other page, it navigates to the main page and opens the pre-chat landing state

`Incidents` opens the incident list page.
`New Chat` resets the current chat UI to the pre-chat landing state without navigating away.
`Logout` signs the user out.

- The primary header actions are presented in the top navigation rather than repeated in the main page body.
- `Logout` should appear after `New Chat` in the header action order.

The standard workflow uses the unified main workspace experience rather than a separate dedicated `/chat` page.

## 6. Knowledge Base Management

This section must produce its own dedicated ticket.

Patch uses curated Knowledge Base text as the source for troubleshooting during normal application use.

Requirements:
- Troubleshooting knowledge is stored as Markdown `.md` files in `knowledge_base/workflows/`. Images are stored in `knowledge_base/images/`.
- The user provides the `knowledge_base/` folder and its contents manually. Patch must use that existing folder structure at runtime.
- Patch must not create the `knowledge_base/`, `knowledge_base/workflows/`, or `knowledge_base/images/` folders automatically.
- Patch must not generate, seed, modify, or write any `.md` files or image files inside the Knowledge Base. The user places those files manually.
- The Knowledge Base structure should support additional categories over time without changing the core chat experience.
- The application must retrieve troubleshooting content from the `.md` files present in `knowledge_base/workflows/` at runtime.
- Knowledge Base files stay available for future chats.
- Knowledge Base availability by category must drive the category tile status indicator — a tile shows `KB Available` if a matching `.md` file exists, `KB Missing` otherwise.

### 6.1 Knowledge Base Folder Structure

Patch expects the user to provide the following folder structure ahead of time. Patch must never create this folder structure automatically and must never write or generate files inside it.

```
knowledge_base/
  workflows/       ← user places .md files here (e.g. vdi.md)
  images/          ← user places image files here (e.g. img_001.png)
```

**How it works:**

- Workflow files are Markdown (`.md`) files. The user authors them with headings, bold, and embedded image references.
- Patch identifies which workflow file to use based on the filename — `vdi.md` maps to the VDI category.
- Images referenced inside a workflow file are stored flat in `knowledge_base/images/`.
- The workflow author should provide only the image description and filename in the Markdown image tag. The author should not have to write the full backend path manually. Example authoring format:
  ```
  ![Description of what the image shows](img_001.png)
  ```
- When Patch needs KB content for VDI, it reads `knowledge_base/workflows/vdi.md`.
- Patch sends that Markdown content to the LLM unchanged, including filename-only image tags such as:
  ```md
  ![VDI login screen](img_001.png)
  ```
- The system prompt must tell the LLM to keep that image tag exactly as-is in its response if it uses that part of the KB.
- The LLM may return a response containing normal Markdown text plus the same image tag, for example:
  ```md
  Click the menu icon first.

  ![VDI login screen](img_001.png)

  Then select Log Off.
  ```
- Before the chat UI shows that response, application code must parse the Markdown and find the image tag.
- The code must read the filename `img_001.png` from the tag.
- The code must look for that file in `knowledge_base/images/img_001.png`.
- If the file exists, the app prepares it for display and renders the image inline at that exact position in the assistant response.
- If the file does not exist, the app logs the missing image and continues rendering the rest of the response without failing the chat.
- This document requires filename-based authoring plus runtime parsing/rendering. The user does not write image paths beyond the filename.
- Because the workflow is already Markdown, Patch passes it directly to the LLM and renders it in the chat without any conversion.
- When the chat UI renders the assistant response, any inline images in the Markdown must be displayed as actual images at the exact position they appear in the response — not as links, not at the bottom, and not requiring any user action to view.

**Important implementation focus for the ticketing agent:**
- Ticket scope must emphasize **use the user-supplied Knowledge Base as-is**.
- Ticket scope must emphasize **do not create, seed, or mutate KB folders or files**.
- Ticket scope must emphasize **preserve filename-only image tags through the LLM response, then parse and render them inline in code**.
- Ticket scope must emphasize that this KB flow is foundational for future categories, so the implementation must stay category-agnostic.

**File naming pattern:**
- Workflows: `knowledge_base/workflows/{category}.md`
- Images: `knowledge_base/images/{filename}.png` (flat, no subfolders)

### 6.2 Inline Image Rendering in Chat

**This subsection must produce its own dedicated ticket. This is a critical requirement.**

When Patch retrieves a workflow file and generates a response, any images embedded in that Markdown must be rendered inline inside the assistant response card in the chat UI.

**Full requirement:**
- The workflow `.md` files contain images using standard Markdown image syntax with filename-only references: `![alt text]({filename})`.
- When the backend reads a workflow `.md` file, it must pass the full Markdown content to the LLM unchanged — do not strip or remove image tags before sending to the LLM.
- After the LLM returns its response, the application code must parse any Markdown image tags in that response, read each referenced filename from `knowledge_base/images/`, and prepare it so the chat UI can render the image inline.
- The requirement is based on code-level parsing and rendering of filename-only image references. The workflow author does not provide full paths.
- The LLM system prompt must instruct the model: "If the knowledge base content contains Markdown image tags (`![alt](path)`), copy them verbatim into your response exactly as they appear. Do not describe the image in text — include the tag as-is."
- When the assistant response is rendered in the chat, every image tag in the Markdown must display the actual image inline at that position in the response — not as a link, not at the bottom, and not requiring any user action.
- Images render with no caption or alt text label beneath them — the image only.
- If a response contains multiple images, each must appear at its correct position within the response flow.
- This applies to all workflow categories — any `.md` file with embedded images must produce inline image display in the chat.
- If an image file referenced in a `.md` file does not exist on disk, log the missing file but do not block or fail the response.

**This feature must be implemented as a standalone ticket and must not be merged into the general KB retrieval ticket. Incorrect handling here breaks grounded troubleshooting images in the main chat flow.**

### 6.3 VDI Knowledge Base — Expected File Format

**Do not generate this file.** The user places `knowledge_base/workflows/vdi.md` manually. This section describes the expected format so the implementation knows what to handle at runtime.

Workflow `.md` files contain:
- Markdown headings and bold for structure
- Inline image references using filename-only Markdown syntax:
  ```
  ![Description of the image](img_001.png)
  ```
- Branching text instructions written as natural language

The application must read whatever `.md` files are present in `knowledge_base/workflows/` and handle any combination of text, Markdown formatting, and image references it finds.

For every user message, Patch must retrieve extracted troubleshooting content before generating a response.

Scenario 1: Tile selected
- If the user selects a tile and sends a message:
  - use the selected tile as the active category
  - Patch may optionally send a starter user message tied to that category, for example: `I have a problem with my {category}`
  - if a tile-triggered starter message is used, it counts as the first user message for the incident flow
  - retrieve knowledge base text only for that category
  - search extracted text only within that category
  - send the most relevant extracted troubleshooting content to the LLM
  - the LLM must convert the grounded troubleshooting answer into clean Markdown before returning it
  - generate a conversational troubleshooting response grounded in that knowledge base text
  - the LLM response must be accurate, specific to the retrieved troubleshooting content, and should avoid unsupported or guessed instructions

Scenario 2: No tile selected
- If the user sends a message without selecting a tile:
  - search the available Knowledge Base text across all category files
  - retrieve the most relevant extracted troubleshooting content
  - when multiple KB files are searched, each one must be passed to the LLM as a clearly separated, labeled block — not concatenated into a single flat string
  - the structured context sent to the LLM must follow this format for each file:

    ```
    [CATEGORY: VDI | FILE: vdi.md]
    <full relevant text from that file>

    [CATEGORY: CATEGORY_B | FILE: category_b.md]
    <full relevant text from that file>
    ```
    Note: "CATEGORY_B" above is a placeholder example only. In Phase 1, VDI is the only category. The format applies when additional categories are added in future phases.

  - each block must include the category name, the source filename, and the extracted text — clearly delimited so the LLM can distinguish which content belongs to which category
  - send all relevant blocks together in a single structured context payload to the LLM
  - the LLM must convert the grounded troubleshooting answer into clean Markdown before returning it
  - answer conversationally using grounded troubleshooting instructions
  - if no strong knowledge base match is found, ask a short clarifying question before continuing
  - the system must not silently default the incident to `VDI` or any other category merely because no tile was selected
  - until a category is explicitly selected or confidently inferred from the user's troubleshooting content, the incident must remain category-flexible and retrieval must continue across the available Knowledge Base files
  - an off-topic or non-diagnostic first message must not permanently lock the incident to a category
  - if the user later provides a clear issue statement that strongly matches a different workflow, Patch must use that workflow and update the incident's active category accordingly
  - once a category has been explicitly selected or confidently established through grounded troubleshooting context, later turns may continue from that category unless the user clearly starts a different issue

Examples:
- VDI selected -> search only VDI knowledge base text
- No tile selected -> search available knowledge base text

## 7. MongoDB Persistence

This section must produce its own dedicated ticket.

Every Patch chat session must create and update a corresponding incident record in the **Patch Transactions** collection in MongoDB.

MongoDB persistence must include:
- incident status
- conversation history
- selected or inferred category
- retrieved knowledge base file references
- retrieved troubleshooting context references
- escalation details
- resolution details
- feedback data
- dynamic response control metadata
- incomplete structured-form session state
- timestamps for incident lifecycle events

Persistence requirements for dynamic chat state:
- If an assistant message returns probable options, select-list options, or a structured form, the incident record must persist the control metadata together with that assistant message.
- The persisted metadata must allow the frontend to reconstruct the exact same interaction state later in active chat, incident history, and resume-chat flows.
- For every dynamic-control step, persistence must include at minimum:
  - control type (`probable_options`, `single_select`, `structured_form`)
  - the full set of option labels or form field definitions returned for that step
  - the owning assistant message identifier
  - whether the step is still awaiting a user answer or has already been completed
  - for structured forms, the requested card count, field groups, entered values if partially completed, and whether frontend validation has passed
- Once the user completes a dynamic-control step, the system must persist both the user's submitted answer and the fact that the control has been completed so history remains accurate.


## 7.0 Incident Pages

This section must produce its own dedicated ticket.

**Screen contract:**
- Desktop: strong two-column composition
- Left column: primary narrative/workflow content
- Right column: compact metadata and identifiers
- Reading order: back link -> status badge -> title row -> left-column content stack -> right-column metadata stack
- The page must visually match the screenshot-style composition used throughout this document

Patch must include:

1. An Incidents List Page
- shows all incidents for the signed-in user
- supports filters for `All`, `Open`, `Escalated`, and `Resolved` rendered as a visible tab row above the incident list; the active filter tab must be highlighted in red (`#DC2626`) to match the app theme; inactive tabs should be visually subdued
- each incident row shows: incident ID, category, status badge, created date, human-readable age (e.g. "2 days ago"), and a `View` button
- when there are no incidents, show a simple empty state: `No incidents yet.`
- each incident includes a `View` action that opens its detail page
- active chat continuation is handled from the incident detail page
- incident rows should use a compact table/list treatment with strong vertical centering, quiet separators, and clear alignment between status, metadata, and action
- the `View` action should read as a secondary utility action, not as the strongest visual element in the row
- the empty state should remain clean and centered, with restrained spacing and no decorative clutter

2. A Single Incident Detail Page
- Incident Header
- Status Badge
- Incident Timeline
- Full Conversation History
- Incident Details
- Escalation Information
- Resolution Information
- Feedback Information
- Incident Actions

Incident detail page requirements:

**Layout and spacing:**
- a back navigation link at the top in small muted text
- status badge as a small pill below the back link, followed by the incident title as a large bold heading
- a prominent primary action button floated to the top-right of the heading row
- generous vertical spacing between the header area and the content below — the page must never feel cramped against the top
- two-column layout on desktop: left column (~70%) for the main content cards, right column (~30%) for metadata and identifiers; both columns aligned at the same top position
- the page must use strong rhythm between cards, crisp alignment, and clear visual hierarchy from top to bottom
- the title row should maintain one clear focal point: incident title on the left, single primary session action on the right
- the primary action label should match state correctly, such as `Resume Session` or `Resume Chat` for open incidents, and should align visually with the title block instead of floating without structure
- Title-row contract:
  - title must be the largest text on the page
  - status badge sits above or just before the title block, not buried in metadata
  - primary action must align to the title row top half, not to the bottom edge of the card stack below
  - if the title wraps, the action remains visually anchored and does not collapse awkwardly

**Left column — stacked content cards in this order:**
1. **Conversation History card** — scrollable container with fixed max height; renders all assistant and user messages as chat bubbles matching the active chat style
2. **Progress card** — horizontal step timeline showing `Opened`, `Escalated`, `Resolved` milestones with filled red circles for completed steps and outlined gray circles for pending steps, connected by solid red or dashed gray lines respectively; each milestone shows its label and timestamp
3. **Status-specific details card** (Escalation Details or Resolution Details depending on incident state) — showing all relevant fields in a labeled grid; the feedback section must appear inside this same card, beneath a divider, as a full-width linked section rather than as a detached mini-card

**Left-column card contract:**
- Card 1 is the tallest and most visually dominant card
- Card 2 is shallower and lighter than card 1
- Card 3 is wide and content-rich, with the feedback section integrated at the bottom

**Right column — stacked metadata cards:**
- a case details card showing incident fields (priority, type, urgency, impact, store, dates) in a clean label-value row layout; priority and type rendered as small colored pill badges
- an identifiers card showing the incident ID and session ID each with a copy action beside them

**Card styling:**
- all cards: white background, 1px light border, rounded corners (12–16px), 20–24px internal padding, 16px vertical gap between cards
- card section headings: bold with a small icon to the left
- field labels: small uppercase letter-spaced muted text; values in dark regular text
- no colored card backgrounds except status badge pills and field badge elements
- conversation history must visually match the main chat system
- conversation history should preserve the same bubble rhythm, timestamp treatment, and assistant signature as the live chat so the user feels continuity
- the conversation history card header must stay visible and separate from the scrollable transcript area
- the transcript area must have comfortable left and right padding so bubbles do not touch card edges
- scrollbar treatment must remain restrained and visually quiet
- metadata cards must use disciplined spacing and clear label hierarchy
- the heading row must align the title block and primary action cleanly
- the conversation card must carry the most visual weight
- the progress card must stay lighter than the conversation card
- escalation and resolution detail cards must read as formal case records within the same design system
- the incident detail page must follow the screenshot-style composition: large left content column, narrower right metadata column, strong title row, and a clear vertical reading order from conversation to progress to final-state details
- the status-specific details card must connect the incident reason/details area with the feedback area so the feedback section does not look detached
- the metadata column must use consistent row spacing and label/value separation
- copy actions for identifiers must read as utility controls, not primary actions
- the desktop composition must keep the two columns visually balanced
- the progress card and status-details card should use consistent icon blocks, heading rhythm, and top padding so the stack feels unified
- the case-details and identifiers cards should feel dense but not cramped, with clear breathing room around copy actions and pills
- right-column card contract:
  - case details card first
  - identifiers card second
  - both cards align to the top of the left-column stack
  - each row inside these cards uses a stable left label / right value rhythm

Incident Timeline requirements:
- the timeline shows status progression only
- the timeline highlights milestone changes rather than full message-by-message activity
- the timeline must contain only these status milestones:
  - `Open`
  - `Escalated`
  - `Resolved`
  
- each timeline item must show:
  - status
  - timestamp
  - actor
- the timeline must use a horizontal support-progress layout with clear spacing and hierarchy
- completed milestones must read as complete at a glance; pending milestones must remain visible but subdued
- timestamps and actor labels must remain readable and visually secondary to milestone names
- milestone labels should align predictably under each point so the progress card remains clean even when one milestone is incomplete
- the timeline must mark a milestone as completed only if that status actually occurred in the incident lifecycle
- a directly resolved incident must not visually imply that `Escalated` occurred
- if an incident is resolved without escalation, the completed path must read as `Open` to `Resolved`, not as a completed track that appears to pass through an uncompleted `Escalated` step
- progress card contract:
  - first completed milestone starts near the left edge of the content area
  - final unresolved milestone remains visible on the far right
  - the connector line must read as one deliberate progress track, not a series of disconnected pieces
  - incomplete state styling must remain visible enough that `Resolved` still reads as a real upcoming step

### 7.1 Transaction Creation

An incident record is created when the first user message is sent.

When the user sends the first message:

- Patch creates a new incident record with status `Open`
- initializes conversation history
- initializes incident timeline
- stores troubleshooting metadata
- initializes any dynamic-control state as empty until an assistant message returns controls

### 7.2 Category-specific values

| Option  | Category | Sub-category | Priority | Urgency | Impact |
| ------- | -------- | ------------ | -------- | ------- | ------ |
| VDI     | Software | VDI          | 5        | 3       | 3      |

### 7.3 Transaction Update (on flow completion)

At the end of the troubleshooting flow, Patch updates the status to one of the following values only:

- **Open** — `lastupdatedby` = **Patch**
- **Escalated** — `lastupdatedby` = **Patch**
- **Resolved** — `lastupdatedby` = either **Patch** or **Escalation Team**

These three values are the only valid incident status values for the incident timeline and incident state.

Dynamic-control update behavior during the incident lifecycle:
- After every assistant turn, Patch must persist any returned probable options, select-list options, or structured-form definitions before the response is considered complete.
- If the user leaves the chat while a dynamic-control step is still unanswered, that step must still be present when the incident is reopened.
- Resume behavior must never silently drop probable options or structured forms that were still active when the user last left the conversation.


## 8. Conversation Flow

This section must produce its own dedicated ticket.

1. User logs into Patch.
2. User sees the main page with the support tile and chat on the same page.
3. Knowledge Base text is already available for retrieval.
4. User may select a tile and send a message, or send a message without selecting a tile.
5. If the tile interaction triggers a starter message such as `I have a problem with my {category}`, that starter message is treated as the first user message.
6. Patch creates an incident only when the first message is sent.
7. Patch analyzes:
   - user intent
   - full stored conversation history for the active incident
   - selected troubleshooting category if available
   - the last troubleshooting step already reached in the conversation
8. Patch retrieves the most relevant troubleshooting content from the Knowledge Base `.md` files.
9. Patch must load the active incident conversation history from MongoDB before generating every new response.
10. Patch continues the existing troubleshooting flow and restarts only when:
   - the user explicitly starts a new issue
   - the user clicks `New Chat`
11. If the tile is selected, read that category's `.md` file and retrieve the most relevant troubleshooting content.

12. If no tile is selected, read all `.md` files in `knowledge_base/workflows/` and pass the retrieved context to the LLM in the structured labeled-block format defined in section 6.
13. Patch sends both the retrieved knowledge base text context and the active incident conversation history to the LLM.
14. The LLM generates a grounded troubleshooting response using both the retrieved knowledge base text and the existing conversation state.
15. The LLM should answer conversationally while maintaining high accuracy and staying tightly grounded in the available troubleshooting context.
16. The LLM must return the troubleshooting answer in clean Markdown so steps, headings, bullets, tables, code-style identifiers, and emphasis are preserved consistently.
17. The chat UI must render the assistant Markdown response cleanly as formatted content rather than showing raw Markdown syntax.
18. Patch updates the incident conversation history after every user/assistant exchange.
19. If the assistant turn includes probable options, a select list, or a structured form, Patch must persist that control state with the assistant message before the turn is considered complete.
20. If the user leaves an `Open` incident while a dynamic-control step is still unanswered, the same active step must be restored when the incident is reopened or resumed.
21. Resume behavior must restore not only the text transcript, but also any still-relevant probable options, single-select controls, and structured form cards that the user still needs to answer.
22. Patch updates the incident timeline only when the incident status changes.
23. If the issue cannot be resolved, Patch must mark the incident as `Escalated`, persist escalation details, and display escalation information on the incident page.
24. If the issue is resolved, Patch marks the incident as `Resolved`, updates the incident details, and makes the incident read-only.
25. If the incident is `Open`, the user can continue the conversation later from the incident detail page.
26. If the incident is `Escalated` or `Resolved`, the incident detail page shows the final status, supporting details, and feedback experience.
27. User must be able to start a `New Chat` from the main page without deleting or resetting existing Knowledge Base text files.

### 8.1 Conversation Continuity Rules

This subsection must produce its own dedicated ticket.

**Important:** Clicking a category tile must immediately trigger `sendMessage()` using the selected category — not just update UI state. The tile click must send the message in the same action.

Patch must maintain conversation continuity across all active incidents.

Rules:
- If the assistant asks a yes/no question, the next user answer must be interpreted relative to that question.
- If the assistant asks a follow-up selection question, the user's next short answer must be treated as the answer to that question, not as a brand-new conversation.
- Patch should continue from the identified category and current troubleshooting step when that context already exists in the active incident.
- If the incident began without an explicit tile selection and the category was not yet confidently established, later user messages that clearly identify a different workflow category must be allowed to establish or change the active category rather than being forced through an earlier default.
- For incidents in `Open`, resuming an incident must restore the prior context, category, and troubleshooting step exactly where it left off.
- Escalated incidents should preserve the full troubleshooting history, escalation context, and final-state details for review.
- Resolved incidents stay available in a read-only review state after completion.

### 8.2 Dynamic Response UI

This subsection must produce its own dedicated ticket.

Patch must support LLM-driven response controls inside the chat experience.

Requirements:
- Based on the user message, retrieved troubleshooting context, and current incident state, the LLM should determine when the next step is better presented as structured UI instead of free-text-only chat.
- The LLM should be able to identify and return probable response options when the user should choose from a short set of likely answers.
- The LLM should be able to identify when a binary confirmation is needed and return `Yes` / `No` response options.
- The LLM should be able to identify when structured data entry is needed and return the fields required to render an input form.
- The frontend must render the returned response controls directly in the chat UI for the active assistant message.
- Supported response controls must include:
  - yes/no buttons
  - probable option buttons for short suggested replies
  - structured input forms when the assistant needs specific field values
- Probable options must be generated from the current troubleshooting step and assistant prompt, not shown as static hardcoded choices unrelated to the conversation.
- Structured forms must be used when the assistant needs clearly labeled values such as identifiers, configuration details, or repeated field sets.
- When the user clicks an option button, that selection must be sent back as the next user message in the conversation.
- When the user submits a structured form, the entered values must be converted into the next user message in a consistent structured format.
- Dynamic response controls must be tied to the active assistant prompt so the current troubleshooting step always presents the relevant interaction options.
- All response control content — button labels, selectable list options, and form field names — must be generated and returned by the LLM based on the current question and context. The frontend must never hardcode any option text, label, or field name.
- The LLM must return contextually meaningful labels that clearly describe the choice, for example `Yes, it is resolved` or `No, it is still not working` for a resolution check, or `Yes, it is for me` or `No, it is for someone else` for an ownership question. Generic bare `Yes` / `No` labels must not be used.
- Response control rendering rules based on the number of options the LLM returns:
  - **2–4 options**: render as inline button chips using one single consistent visual style across every question type — same size, same Patch red treatment, same text treatment, same hover behavior, and same visual weight for all of them. Do not use different button styles for different question types. The styling must not change based on whether the question is a resolution check, an ownership question, or any other type.
  - **5 or more options**: render as a single-select list where the user picks one item and confirms, rather than showing many buttons.
  - **Structured field entry**: when the LLM identifies that specific named values are needed, render an input form with field labels and a submit action — all field names come from the LLM.
- When the user selects a button, picks a list item, or submits a form, the selection is sent as the next user message in the conversation.
- Option buttons, select lists, and forms must disappear immediately when the user clicks — do not wait for the response to arrive before hiding them. They must not be visible while the assistant is typing.
- `sendMessage` must guard against duplicate sends: if a response is already loading, clicking an option button or submitting a form must be a no-op. Return early if `isTyping` is true.
- Option buttons must render inside the conversation flow, directly beneath the assistant response card that generated them. They must use the same left margin and avatar spacer as the assistant message so they appear visually attached to that response — never as a floating or disconnected block below the chat.
- Probable option controls are a primary action surface. They must look intentional, visually premium, and clearly clickable, not like low-priority utility chips.
- For probable options specifically, the assistant response body should end first, then the options should render below as a dedicated action row or action section. Do not visually merge them into the prose body as though they are part of the same paragraph.
- When the design calls for a more expressive control treatment, probable options may use a stronger visual presentation than simple neutral pills, as long as the styling still stays within the Patch design system and remains consistent across the product.
- Patch must still support normal typed responses even when dynamic response controls are shown, unless the step explicitly requires structured input.
- The meaning of the selected option or submitted form must be preserved in incident history so later steps can interpret the response correctly.

### 8.2.1 Probable Option Persistence And Resume Behavior

This subsection must produce its own dedicated ticket.

Probable options and other assistant-generated choice controls are part of the incident history, not temporary decoration.

Requirements:
- If an assistant message returns probable options, those exact option labels must be persisted with that assistant message in MongoDB.
- The incident detail page conversation history must render those probable options in the history view for the message that generated them.
- If the user has not yet answered that step, reopening or resuming the incident must show those same probable options again in the active chat.
- If the user already answered that step, the history must still make it clear what options were presented, while the active unanswered control should no longer be interactive.
- Resume Chat must restore the last unanswered probable-option step exactly where the user left it. The user must never resume into a state where the assistant question remains visible but the available choices are missing.
- The frontend must treat probable-option restoration as required resume behavior, not as a best-effort enhancement.
- In both active chat and incident history, probable-option controls must use the same Patch red visual system as the live product so restored history does not look visually degraded or like plain metadata.
- If a probable-option step is still active, the controls must remain obviously actionable. If the step is already completed, the history must preserve what options were shown while clearly presenting the submitted answer as the chosen outcome.
- The ticket must explicitly cover:
  - persistence shape in MongoDB
  - API response shape needed to rebuild controls
  - active-chat restoration behavior
  - incident-history rendering behavior
  - completed vs unanswered control-state handling

### 8.2.2 Structured Form Sessions And Frontend Validation

This subsection must produce its own dedicated ticket.

Patch must support guided, multi-step structured form sessions that are easy to understand and easy to complete.

Requirements:
- The assistant must not jump directly from a diagnostic question into a large multi-card device-details form unless the user has already provided the count needed to determine how many cards to render.
- If the workflow needs repeated device information, the first structured step must ask for the count only, such as how many scanners or devices the user currently has.
- Only after the user provides that count may Patch render the detailed device cards for that count.
- The UI must render one card per device. If the user says they have `1`, show one card. If the user says they have `2`, show two cards. If the user says they have `3`, show three cards. Do not render extra unused cards.
- Each device card must be distinct and easy to scan, with a clear card title such as `Device 1` or `Scanner 2`.
- Once an individual card is completed and passes validation, its state should visually change to a satisfied/complete state so the user understands progress immediately.
- The frontend must validate required fields before allowing the user to continue. If the workflow requires two device cards, the user must complete both cards fully before submission is accepted.
- Validation errors must appear inline and clearly identify what is missing on the specific device card that needs attention.
- The structured-form experience must be simpler than freeform typing, not more complicated. The ticket must preserve this usability goal explicitly.
- Count-based repeated-entry forms should render as a polished "quick entry" surface rather than a raw stack of generic inputs. The UI should feel intentionally designed, with a clear section header, entry count visibility, distinct per-entry cards, and a strong submission area.
- If the workflow asks for multiple entries, the form should make that multiplicity obvious immediately through clear card structure and visible entry numbering.
- Entry cards should feel complete and premium even before submission: strong outer frame, clear headings, readable field grouping, and enough spacing that the user can scan both cards quickly.
- Repeated-entry cards must render as separate, self-contained cards rather than as one long combined form. The layout should stay compact and readable: a single entry may use one centered card, while two entries may render side by side or in another clearly separated compact layout. Avoid oversized generic panels that make the form feel bloated.
- If the user leaves mid-form and later resumes the incident, Patch must restore the same count-based card layout and any previously entered values that were already captured for that unfinished step.
- The LLM and frontend responsibilities must stay separated:
  - the LLM decides that a count question or structured form is needed
  - the frontend controls card rendering, count-based repetition, validation, completion styling, and restore behavior

### 8.3 LLM System Prompt

This subsection must produce its own dedicated ticket.

Patch requires a system prompt that is sent to the LLM with every request. The system prompt must:

- Identify Patch as a self-service support agent for Discount Tire store associates
- Restrict the LLM to answering only using the retrieved KB context and active conversation history — no external knowledge
- Instruct the LLM to follow the troubleshooting workflow from the KB text strictly, including all branching paths
- Require the LLM to return a structured JSON response on every turn with the following fields:
  - `response` — the Markdown-formatted troubleshooting reply
  - `user_probable_options` — list of up to 4 contextual button labels, or empty array if open-ended
  - `input_card_variables` — list of field names for a structured input form, or empty array
  - `needs_count_first` — boolean, true when the workflow requires a count-gating question before rendering repeated detail cards
  - `count_prompt` — the concise question the assistant should ask when `needs_count_first` is true
  - `total_cards` — number of input cards needed, or 0
  - `should_escalate` — boolean, true only when the issue is unresolvable or the user requests escalation
  - `escalation_data` — populated with incident category, subcategory, priority, urgency, impact, configuration item, escalation reason, and status when `should_escalate` is true; otherwise null
  - `should_resolve` — boolean, true only when the user has confirmed the issue is resolved; the backend uses this to mark the incident `Resolved` and trigger the resolved summary card
- Instruct the LLM that `user_probable_options` labels must be contextually meaningful full phrases, never bare `Yes` or `No`
- Instruct the LLM to ask one concise gating question when a workflow branch depends on missing user input, and continue only the selected branch after the answer
- Instruct the LLM not to emit repeated device-detail fields until the user has first answered the count-gating question for that workflow branch
- Instruct the LLM that when count-based repeated information is needed, it must first ask only for the count and wait for that answer before requesting the repeated detail fields

**LLM output reliability requirement (critical):**
- The system prompt must still instruct the LLM to return exactly one top-level JSON object with no prose before or after it.
- The backend must not assume prompt compliance is sufficient. Mixed-format or malformed model output must be treated as an expected runtime condition.
- The model may wrap its JSON response in Markdown code fences (` ```json ``` ` or ` ``` `). Before parsing, the backend must strip any leading or trailing code fences from the raw model output.
- If the fully cleaned string is not valid JSON, the backend must attempt to extract the first valid top-level JSON object from the response instead of failing immediately.
- The backend must never pass obviously mixed-format raw model output directly to `JSON.parse` without sanitization and extraction attempts.
- After parsing, the backend must validate and normalize the result into the application's required response schema.
- Missing optional fields must be defaulted safely.
- Unexpected extra fields must not crash the request.
- Type mismatches such as string booleans, string numbers, or other minor schema drift must be normalized when safely possible.
- Only if full-string parsing, JSON extraction, and schema normalization all fail may the system fall back to a generic assistant error response.
- Malformed or mixed-format model output must be treated as an LLM formatting failure, not as a user input failure.
- The raw malformed model output must be logged for debugging with reasonable truncation if needed.

**LLM output handling examples the implementation must survive:**
- a response wrapped in Markdown code fences
- a response containing plain text before a valid JSON object
- a response containing valid JSON plus unknown extra fields
- a response containing minor schema drift but still recoverable structured content

**LLM output reliability acceptance requirements:**
- a response wrapped in ````json ... ```` must still parse successfully
- a response containing plain text before a valid JSON object must be salvaged by JSON extraction and must not fail the request
- a response containing valid JSON plus unknown extra fields must not fail the request
- a response with minor schema drift must be normalized into the required response contract when safely possible
- the user must not see a generic failure message when a usable JSON object is present anywhere in the model output
- the system must log malformed raw output whenever full-string parsing fails

**When `should_escalate: true` is returned:**
- The backend must immediately update the incident status to `Escalated` in MongoDB
- Persist the full `escalation_data` object from the LLM response into the incident record
- The API response to the frontend must include the full escalation details so the chat UI can render the escalation summary card and feedback card without a second fetch
- The chat input must be disabled after escalation — no further user messages on this incident

**When `should_resolve: true` is returned:**
- The backend must update the incident status to `Resolved` in MongoDB
- The API response must include this signal so the chat UI renders the resolved summary card and feedback card
- The chat input must be disabled after resolution

### 8.3.1 LLM Behavioral Guardrails And Scope Control

This subsection must produce its own dedicated ticket.

Patch is an issue-resolution assistant first. The system prompt must keep the model tightly focused on helping the associate complete the troubleshooting flow from the Knowledge Base.

Requirements:
- The LLM's primary job is to guide the associate through the troubleshooting workflows contained in the Knowledge Base `.md` files and resolve the active support issue as efficiently as possible.
- If the user sends unrelated conversational content that does not advance the troubleshooting flow, the assistant must briefly acknowledge it and then redirect the user back to the active issue flow.
- Example intent: if a user says something like `It's raining in Charlotte`, the assistant should not start a weather conversation. It should respond briefly and redirect back to the current troubleshooting issue, for example by acknowledging the message and then continuing the support workflow.
- That redirection must feel polite, natural, and non-scolding. It must not sound dismissive, corrective, or like the assistant is reprimanding the user for going off topic.
- The assistant should remain polite, calm, and helpful, but it must not drift into off-topic social conversation, general trivia, or unrelated advisory content.
- The assistant must prefer straightforward, workflow-grounded language over creative paraphrasing. If the workflow already contains the needed instruction, the answer should stay close to that instruction.
- The system prompt must explicitly instruct the model to prioritize issue completion over open-ended conversation.
- The system prompt must explicitly instruct the model to avoid expanding into topics not supported by the current Knowledge Base context and incident state.
- The ticket must include examples of:
  - acceptable brief acknowledgment plus redirection behavior
  - unacceptable off-topic expansion
  - the expectation that the assistant continues the current workflow after redirecting the user

## 9. End-of-Flow Messages

### 9.1 Escalation (Patch could not resolve)

This subsection must produce its own dedicated ticket.

Display:

"I wasn't able to resolve the issue. I'm escalating this to our Trusted Experts for hands-on support."

Status:
- `Escalated`

When Patch cannot resolve an incident:
- Patch must change the incident status to `Escalated`
- Patch must persist escalation details in MongoDB
- Patch must record:
  - escalation state
  - escalation reason
  - assigned support group
  - escalation timestamp
  - updated priority, urgency, or impact if applicable
- the escalation information must be clearly visible on the Incident Page

Escalation-related information may also come from Knowledge Base troubleshooting text and retrieved extracted text.

When an incident becomes `Escalated`:
- the active chat should show an escalation response card in the conversation area, matching the provided reference pattern
- the escalation response card should include a short Patch message explaining that the issue could not be resolved and that an incident has been created for L2 or trusted expert follow-up
- the escalation response card should include an embedded incident summary card directly in the chat
- the escalation outcome in active chat must render as one unified final-state assistant block: Patch escalation message first, embedded incident summary card second, feedback card third
- the embedded incident summary card must remain visually attached to the assistant escalation response that created it; it must not be dropped lower as a detached standalone record card or isolated page section
- the embedded incident summary card should show updated incident details such as:
  - incident number
  - incident type or category label
  - description or short description
  - created for
  - created date and time
  - current incident status
  - escalation reason
  - priority
  - urgency
  - impact
  - assignment or support group
- the embedded incident summary card should include a clear action that opens or redirects the user to the incident detail page
- the embedded incident summary card should visually reflect the `Escalated` status badge
- the incident page should display the escalation outcome clearly
- Patch must preserve all prior troubleshooting context for incident history and review
- the incident remains accessible from the incidents page through `View`
- the feedback card must appear directly in the active chat beneath the escalation summary card — it must not be skipped or deferred to the incident detail page only
- the feedback card must remain inside the same visual outcome flow as the escalation response and summary card; it must not appear as an unrelated survey widget or detached lower-page block
- the final-state escalation outcome must preserve the approved screenshot-style hierarchy: assistant outcome message, embedded summary card, then feedback. Do not flatten this into a generic alert panel, loose beige record, or detached dashboard-style case block.
- the raw internal ticket-field message (e.g. "I am opening a ticket with the following details: Category: Software…") must never be shown to the user — the escalation summary card and feedback card are the only escalation-state output shown in chat
- the escalation summary card must include a `View Incident` action that opens the incident detail page

### 9.2 Resolution (Patch resolved the issue)

This subsection must produce its own dedicated ticket.

Display:

"Glad I was able to help you resolve the issue! Here are the ticket details for your records."

Status:
- `Resolved`

When an incident becomes resolved:
- the active chat should show a resolved response card in the conversation area, matching the provided reference pattern
- the resolved response card should include a short Patch message confirming that the issue was resolved and that the incident details are shown for the user's records
- the resolved response card should include an embedded incident summary card directly in the chat
- the embedded incident summary card should show updated incident details such as:
  - incident number
  - incident type or category label
  - description or short description
  - created for
  - created date and time
  - current incident status
- the embedded incident summary card must include a `View Incident` action that opens the incident detail page
- the embedded incident summary card should visually show a green resolved status treatment
- the resolved response card must place the feedback card directly beneath the incident summary card — feedback must appear in active chat at the point of resolution, not deferred
- the final-state resolved outcome must preserve the approved screenshot-style hierarchy: assistant outcome message, embedded summary card, then feedback. Do not flatten this into a generic success panel, loose record card, or detached dashboard-style block.
- the raw internal field dump (e.g. "Incident resolved with Category: Software…") must never be shown to the user — the resolved summary card and feedback card are the only resolution-state output shown in chat
- chat input must be disabled
- the incident becomes viewable in read-only mode

Resolved incident behavior:
- once an incident is marked `Resolved`, the incident is complete and available for review
- a different issue begins through `New Chat` after resolution

## 10. Feedback

This section must produce its own dedicated ticket.

**Component contract:**
- Active chat: feedback appears as its own card directly beneath the final summary card
- Incident detail page: feedback appears inside the status-details card as the final integrated section
- In both surfaces, the feedback UI must remain part of the incident outcome flow, not an unrelated survey widget

Patch must collect feedback only at the end of an incident flow.

Feedback must be requested only when the incident reaches one of these final states:
- `Resolved`
- `Escalated`

Requirements:
- Prompt: **"How was your experience with Patch?"**
- Rating: 1–5 stars, persisted in the Patch transactions collection
- Written feedback comments are optional and should follow the screenshot pattern.
- Submission rule: the user can submit feedback after selecting a rating; written comments may be included optionally
- Feedback stays associated with the incident lifecycle
- Feedback is requested at final outcome rather than after each assistant reply
- Feedback must be shown once per incident after the final outcome is reached
- once feedback is submitted, the rating and written feedback should remain visible on the incident detail page
- if the user skips feedback in active chat and navigates to the incident detail page, the feedback form must still be visible and submittable from there — feedback is never permanently dismissed until submitted
- In active chat for resolved and escalated outcomes, the feedback form should appear as a dedicated card beneath the incident summary card
- On the incident detail page, the feedback form must be integrated into the status-specific details card as a full-width section beneath the escalation or resolution details. It must not look like a floating or detached mini-card.
- The feedback section must stretch across the available content width of that card, align to the same internal grid as the details above it, and continue the incident outcome content.
- The feedback section must use a divider above it and then a full-width content block beneath it so the relationship between incident outcome and feedback is obvious.
- it must include: a bold heading `Rate Your Experience` with an `Optional` label aligned to the right on the same row, a subtitle line beneath it reading `How was your experience with Patch today?`, a star rating row (1–5), an optional comment textarea that spans the section width, and a right-aligned `Submit` button
- the submit button is a right-aligned primary button sized to the form, not an undersized detached control
- the feedback section must not look narrower than the details content above it, and it must not appear unlinked from the escalation or resolution details
- the star row should feel prominent and easy to interact with, with enough spacing between stars that it reads as a deliberate rating control rather than a cramped icon row
- the comment textarea should have generous internal padding, a clear focus state, and enough height to avoid looking like a single-line input stretched wide
- the `Optional` label should read as metadata, not as a competing heading
- the section should preserve strong horizontal alignment between heading, stars, textarea, and submit action so the form reads as one coherent block
- Feedback layout contract:
  - heading row first
  - helper text second
  - star row third
  - textarea fourth
  - submit action last
  - no element should appear visually detached from the section above or below
- Feedback width contract:
  - star row aligns to the textarea start edge
  - textarea aligns to the outer card grid
  - submit button aligns to the textarea right edge
  - the section width must visually match the details content width above it
- The full conversation history — including all assistant response cards, the escalation or resolved summary card, and the feedback card — must remain visible on the incident detail page after feedback is submitted; nothing in the conversation history should be hidden or removed when navigating to the incident page.
- The escalation or resolved summary card must be rendered as a full card in the conversation history on the incident detail page — not as plain text. It must match the card shown in active chat, including the embedded incident details and status badge.
- The conversation history section on the incident detail page must be rendered inside a scrollable container with a fixed maximum height so long histories can be scrolled independently without disrupting the rest of the page layout.
- The incident detail page feedback treatment should follow the screenshot-style pattern: outcome details first, then a divider, then a wide integrated feedback section inside the same outer card.

## 11. Resume Chat And New Chat

This section must produce its own dedicated ticket.

Patch must support viewing all incidents and resuming active incidents from their detail pages.

Incidents List:
- The incidents list shows a `View` action for every incident.
- Clicking `View` opens the incident detail page.
- The incidents list should also display incident age in a human-readable format.

Resume Chat:
- On the incident detail page, incidents with status `Open` show a `Resume Chat` action.
- Clicking `Resume Chat` must NOT navigate to a new chat. It must navigate to `/` and restore the existing incident conversation — not reset it.

**Resume Chat behavior (critical):**
- The incident detail page must write the incident ID into `sessionStorage` under the key `resume_incident_id`, then navigate to `/`.
- The main page (`/`) must check `sessionStorage` for `resume_incident_id` on every mount.
- If `resume_incident_id` is present, the main page must immediately read and remove it from `sessionStorage` (remove before the async fetch so a page refresh during the fetch does not re-trigger the resume), then fetch that incident from `/api/incidents/[id]`.
- On a successful fetch, the main page must:
  - populate the message list with `incident.history` in correct chronological order
  - set the incident header (incident ID, category, status)
  - enter `active-chat` state — the landing tiles and pre-chat hero content must be hidden
  - scroll the conversation to the bottom immediately after render
  - enable the chat input if `incident.status === 'Open'`; disable it with the label `This conversation has ended.` if `incident.status` is `Escalated` or `Resolved`
- If the fetch fails for any reason (incident not found, unauthorized, network error), the main page must fall back silently to the normal pre-chat landing state. It must not show an error screen.
- `resume_incident_id` must be cleared from `sessionStorage` immediately after reading it so that a subsequent page refresh does not re-trigger the resume.

**What is restored:**
- Full message history from `incident.history` in correct order
- Incident header: incident ID, category, status badge
- Active-chat UI state (tiles hidden, chat panel visible)
- Any still-unanswered probable options from the last assistant message
- Any still-active structured form with its card count and any previously captured partial values
- Chat input enabled/disabled state based on incident status
- Conversation scrolled to the most recent message

**What is not restored:**
- A new incident is not created on resume — the existing incident ID is reused
- The landing-state tiles must remain hidden for the duration of the resumed session
- The page must not briefly flash the pre-chat landing state before restoring — the resume check runs before first render paint where possible

- Category context must be restored if applicable.
- The header navigation stays visible.
- Patch must continue the active issue flow unless the user explicitly begins a different issue.
- Resume Chat must restore the actionable state of the conversation, not just the text transcript.

Escalated Incidents:
- Escalated incidents are available through the `View` action.
- The incident detail page shows escalation details, timeline, conversation history, and feedback.

Resolved Incidents:
- Resolved incidents are available through the `View` action.
- The incident detail page shows resolution details, timeline, conversation history, and feedback.

New Chat:
- Patch must provide a persistent `New Chat` action in the header navigation.
- Clicking `New Chat` must clear the current in-memory chat UI state only.
- Clicking `New Chat` preserves existing incidents and Knowledge Base text files.
- Clicking `New Chat` must return the page to the pre-chat landing state.
- The category tiles must be shown again.
- A new incident is created when the user sends the first message in the new chat.

## 12. Non-Functional Requirements

- **Authentication & security:** Passwords must never be stored in plaintext. Authentication failures must not leak whether an email exists beyond the standard invalid-credentials message. Session handling must log the user out cleanly and block access to authenticated pages after logout.
- **Error handling:** Patch must fail gracefully when the LLM, MongoDB, the internal user profile API, or Knowledge Base files are unavailable. User-facing errors should be clear, compact, and non-technical, while application logs should retain enough detail for debugging.
- **Loading and disabled states:** All async actions must present clear loading feedback and guard against duplicate submissions. This includes login, signup, initial chat send, dynamic option clicks, structured form submission, feedback submission, incident navigation actions, and final escalation/resolution states.
- **State restoration:** Any active unanswered probable-option step or structured-form step must be restorable after refresh, navigation away, or resume-chat. Restored state must match the user's last actionable point in the flow.
- **Performance and responsiveness:** The core experience must remain usable on standard desktop resolutions without layout breakage, and must adapt cleanly to smaller laptop widths and tablet/mobile widths where supported by the product UI.
- **Configuration and environment assumptions:** The application must read required runtime configuration from environment variables, including MongoDB connection settings, `OLLAMA_BASE_URL` (must be `https://ollama.com`), `OLLAMA_API_KEY` (required for all Ollama requests), `OLLAMA_MODEL` (must be `gemma4:31b-cloud`), session secrets, and any internal profile API configuration. All three Ollama variables are required — missing or empty values for any of them must cause the application to fail at startup with a clear configuration error rather than silently degrading or falling back to a local endpoint or different model.
- **Observability:** Application logging should capture failed LLM calls, failed MongoDB operations, missing Knowledge Base image files, and escalation/resolution state transitions so support and debugging are practical in production.

## 13. Acceptance Criteria

- After login, user lands on a main page with tiles and chat on the same page.
- The landing page shows Patch branding.
- The landing page shows the available support tile for the current scope.
- The landing page focuses on the active Patch support experience with one available support tile and matches the intended reference style cleanly.
- Clicking a tile keeps the user on the main page.
- Sending the first message creates the incident.
- In active chat, the user message appears as a right-aligned red bubble and the Patch response appears as a left-aligned white response card.
- Assistant troubleshooting steps render as formatted Markdown inside the response card.
- When Patch asks if the issue is resolved, the UI shows a dedicated decision panel with consistent-style option buttons (same style for all options, no green/red split — see section 8.2) directly under the relevant assistant response.
- When Patch resolves an issue, active chat shows a resolved incident summary card with a green resolved status and the feedback card directly beneath it.
- Both escalated and resolved incident summary cards in active chat include updated incident details and a direct action that opens the actual incident detail page.
- With a selected tile, only that category’s Knowledge Base text is used for retrieval.
- Without a selected tile, the available Knowledge Base text is used for retrieval.
- `Incidents` is visible in the persistent header navigation.
- `New Chat` is visible in the persistent header navigation.
- `Logout` is visible in the persistent header navigation.
- The header action order on the right is `Incidents`, `New Chat`, then `Logout`.
- `Logout` uses the same visual tab treatment, hover behavior, and underline system as the other header actions.
- Primary navigation actions are presented in the header.
- `New Chat` resets the main page state without navigation.
- Every incident can be opened from the incidents list through a `View` action.
- The incidents list shows incident age for each incident.
- `Resume Chat` appears on the incident detail page for incidents in `Open` status.
- Resume Chat restores prior conversation context and continues the troubleshooting flow.
- Resume Chat restores any still-active probable options and unfinished structured forms, not just plain text messages.
- After the first message is sent, the landing-state tiles and helper content are hidden and the page becomes chat-focused on the same main page.
- User can view all their incidents on the incidents page.
- Escalated incident detail pages show escalation information, conversation history, timeline, and feedback.
- Escalated incidents update and display reason, priority, urgency, impact, assignment, and current status consistently in storage, in active-chat summary cards, and on the incident detail page.
- When Patch escalates an issue in active chat, the conversation shows an incident-created summary card with updated incident details and a direct action to open the incident detail page.
- Resolved incident detail pages show resolution information, conversation history, timeline, and feedback.
- Feedback is requested only after an incident is `Resolved` or `Escalated`, not after every assistant reply.
- Users can sign up using their own username, email, and password.
- Users can log in using email and password.
- The main-page welcome message shows the signed-in user's username or email prefix if username is unavailable.
- When Patch cannot resolve an issue, the incident is marked `Escalated` and escalation details are shown on the incident page.
- Incident timeline shows only status milestones: `Open`, `Escalated`, and `Resolved`.
- Conversation messages stay in the conversation history while timeline events represent status milestones.
- Incident detail page uses clear visual sections for conversation, timeline, details, escalation, resolution, and feedback.
- When no tile is selected, retrieved Knowledge Base context is passed to the LLM in a structured format rather than as a single flat text blob.
- If no strong knowledge base match is found when no tile is selected, Patch asks a short clarifying question before continuing.
- When the LLM determines that the next troubleshooting step should use structured interaction, the chat UI renders dynamic controls such as yes/no buttons, probable options, or input forms for that assistant message.
- Probable options remain visible in conversation history and are restored on resume when that step is still unanswered.
- Count-based structured forms ask for the count first, then render only the exact number of required cards, with frontend validation blocking incomplete submission.
- If a user leaves an incident with an unanswered probable-option step, the resumed chat shows the same still-actionable options rather than only the text of the question.
- If a user leaves during a count-based form workflow, the resumed chat restores the same count-driven card layout and any captured partial state for that unfinished step.
- Probable-option controls use the same premium Patch red action styling in live chat, restored chat, and incident history.
- Assistant responses are returned as Markdown and rendered cleanly in the chat UI.
- When a workflow `.md` file contains inline image references, the assistant response renders those images inline at their correct position — not as links.
- The backend strips Markdown code fences from LLM output before JSON parsing — a fenced response does not crash the request.
- Patch uses the user-provided `knowledge_base/workflows/` and `knowledge_base/images/` folders as-is and does not auto-create or seed them.
- While the LLM is generating a response, a typing indicator is shown in the assistant message position and the chat input is disabled.
- If feedback was skipped in active chat, the feedback form is still visible and submittable on the incident detail page.
- The incident detail page uses the same screenshot-style composition as the reference: conversation history card, progress card, and a wide status-details card with an integrated full-width feedback section.
- On the incident detail page, the feedback section is visually linked to the escalation or resolution details and does not appear as a detached inset card.
- The active chat, final-state cards, feedback cards, and incidents pages should match the intended screenshot-driven UI pattern with polished spacing, alignment, hierarchy, and state styling.


## 14. Visual Design System

This section must produce a dedicated implementation ticket covering the full visual design system. Every rule below applies globally across all pages and components.

This section is high-importance. The ticketing agent must treat it as required implementation scope for the entire website, not as optional polish. The resulting UI ticket must be explicit, detailed, and forceful enough that the implementation cannot fall back to a generic dashboard look. The product must ship with a clean, amazing, highly intentional UI.

Patch must look and feel like a premium, production-grade enterprise support tool. Every screen should feel considered, calm, and professional.

**Design importance rules for the ticketing agent:**
- Design quality is mandatory. Do not summarize this section into a short styling note.
- All UI tickets must inherit and restate the relevant design rules from this section.
- The implementation must be judged on visual quality as well as functional correctness.
- Avoid bland, template-like UI.
- If a ticket affects a visible surface, include the visual expectations in that ticket's acceptance criteria.

**Palette**
- Primary: red (`#DC2626` range) and white. These two carry the entire UI.
- Yellow for `Open` states, green for `Resolved` states, only.
- White cards on a very light gray page background. No dark surfaces.
- Near-black (`#111`) for body text, mid-gray for metadata. Black must not appear as a header or sidebar color.
- Add warmth through off-white, pale stone, or blush-tinted neutrals in backgrounds and shadows only. Keep these subtle and premium.

**Typography**
- One typeface only — Inter, DM Sans, or equivalent clean sans-serif.
- Hierarchy through weight and size only. No color changes, underlines, or decorative treatments.
- Headings: bold 24–32px. Section labels: semibold 11–12px uppercase tracked. Body: regular 13–14px at 1.5–1.6 line height. Timestamps: 11px muted gray.
- Use tighter line-height on major headlines and slightly looser line-height inside troubleshooting content.

**Cards and Spacing**
- 4px base spacing scale throughout. Cards: 20–24px internal padding, 1px light gray border, subtle 2–4px box shadow, 12–16px corner radius.
- No colored card backgrounds except status banners. No stacked shadows, no gradients, no glass effects.
- Shadows must stay soft and light, never heavy.

**Buttons**
- Primary: solid red, white text, 8px radius, semibold 14px.
- Secondary: white background, 1px gray border, dark text.
- All chat option buttons (yes/no, probable options) use one single consistent style in the Patch red family — solid red or an equally strong red-primary treatment, white text, compact padding, and identical sizing regardless of question type. Never mix large filled buttons with small outlined pills in the same chat flow.
- Button labels for chat controls come from the LLM — never hardcoded in the frontend.
- Primary actions must be decisive but not oversized.
- Completed structured-form cards may use a restrained success treatment to indicate completion, but this must stay subtle and premium — for example a soft green border or check state, never a loud saturated fill.

**Chat UI**
- Professional support tool feel, not a consumer chat app. No emoji, no playful animations.
- User messages: right-aligned, red background, white text. Assistant messages: left-aligned, white card with 2px left red accent border.
- Assistant name label (`Patch`) above the bubble in small muted text. Timestamps below, outside the bubble.
- Chat input bar pinned to bottom, clean white with a top border only.
- Troubleshooting Markdown must use strong list spacing, clear heading rhythm, and correct inline image placement.
- Dynamic probable-option controls must read as a clear next-step action area within the chat, using the same red-forward product language as the rest of Patch rather than neutral low-emphasis chips.

**Status Badges**
- `Open`: yellow tint background, yellow-brown text. `Escalated`: red tint, red text. `Resolved`: green tint, green text.
- Consistent size everywhere: 10–11px semibold uppercase, 6–8px horizontal padding, 4px radius.

**What to Avoid**
- Gradient backgrounds, colored icon backgrounds on every row, large emoji in empty states
- Mixing button styles for the same control type within the same page or flow
- Redundant status signals (colored badge AND colored icon for the same status)
- Over-rounded elements, stacked shadows, shimmer on loaded content, bounce animations
- Any element that draws more attention than the primary action on that screen

**Layout**
- Header: 56–64px, **white background only** (`#FFFFFF`) — never red, never black, never dark. Subtle 1px bottom border. Logo: red circular icon with white mark inside. Nav items are plain text tabs — no bordered card buttons. Active nav tab uses a red underline. Inactive tabs render in plain dark text.
- Page max-width 1280px. Content max-width 960px single-column; two-column splits at 2:1 or 3:1.
- Incident detail: two-column on desktop, single-column on mobile.
- Conversation history on incident detail page in a scrollable container, `max-height: 520px`, `overflow-y: auto`.
- Incident list filter tabs: active tab highlighted in red (`#DC2626`), inactive tabs muted. Never black.
- Landing page: radial gradient on the page background, Patch mark centered, username in red (`text-red-600` / `#DC2626`).
- Auth pages may use a more expressive split-screen composition than the rest of the application, but the in-product workspace after login should remain light, spacious, and operationally focused.
- Incident detail page should use a wider desktop composition with generous side gutters so cards feel placed on a canvas rather than stretched to the viewport edges
- Incident list rows should be compact, vertically centered, and use quiet separators
- Incident detail left column should visually follow this order: conversation history, progress, status details, integrated feedback
- Active chat should maintain a controlled reading width so long troubleshooting replies remain elegant and readable
- Main chat column should use a narrower reading width than the full page container so bubbles and cards do not float across a broad empty canvas
- The main landing tile should use a consistent card footprint rather than auto-sizing to its text alone

**Screen-by-screen visual contract**

**Authentication screens**
- Split screen only
- Left brand panel and right form panel must remain visually balanced
- Form panel must not drift into a wide empty canvas
- Primary CTA is always the strongest visual action on the right panel

**Main landing screen**
- One centered hero stack only
- No multi-column dashboard treatment
- Patch mark, welcome copy, single tile, and composer must read as one vertical sequence
- The single tile must look intentional even when it is the only selectable item on the page

**Main active chat screen**
- Top nav remains fixed at the top of the product shell
- Chat column remains centered and width-controlled
- Incident header row sits above the transcript
- Transcript stack uses consistent left/right rhythm
- Bottom composer remains anchored and visually stable

**Incidents list screen**
- Filter tabs first
- List second
- Rows remain compact and scannable
- Empty state remains restrained

**Incident detail screen**
- Back link first
- Status badge second
- Title/action row third
- Left column stack: conversation history -> progress -> status details -> integrated feedback
- Right column stack: case details -> identifiers
- Feedback must visually belong to the outcome/details content above it

**Feedback component**
- In chat, it behaves like a final-step card
- On incident detail, it behaves like the bottom section of the outcome/details card
- Stars, textarea, and submit button must align to one grid

**Visual polish (applies to every screen):**
- Generous whitespace between every section — never cramped
- Every card has a very subtle box shadow (`0 1px 4px rgba(0,0,0,0.06)`) to lift it off the page background
- Smooth transitions on hover states: buttons and tiles scale or darken slightly (`transition: 0.15s ease`)
- The VDI tile is a clean white card, centered, with the category icon above the label and the KB status badge below — comfortable padding, rounded corners, feels clickable
- The Patch logo mark on the landing page sits centered above the welcome text with generous space below it
- Assistant response cards have a visible `2px solid #DC2626` left border accent — this is the primary visual signature of Patch responses
- All interactive elements (buttons, tiles, nav tabs) have a clear hover state so the UI never feels static
- The `Logout` nav item must visually participate in the same underline, hover, and active-state system as the other top-nav items. No right-side nav item may look unstyled or incomplete.
- Surfaces must have a clear visual hierarchy: page background, cards, badges, and controls.
- Incident and chat screens must share the same card language, typography, and interaction system.
- On the incident detail page, the feedback area must visually inherit the width, border language, and padding rhythm of the outer status-details card so it reads as one connected section.
- Scrollable conversation areas should use restrained scrollbar styling so the UI remains polished even on long histories.
- Empty spaces inside large cards should be avoided through controlled widths and internal alignment; the layout should not feel sparse just because the content count is low.
- If a screen looks generic, cramped, clunky, or unfinished, it does not satisfy this document.

**Do not invent:** For any color, spacing, or interactive behavior not specified in this document, implement the closest match to the above rules. Do not default to black backgrounds, bordered card-style nav buttons, or full-width elements.
