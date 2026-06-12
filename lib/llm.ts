import { LLMResponse, ChatMessage } from '@/types';

// Validate required Ollama env vars at import time so failures are obvious.
function getOllamaConfig(): { baseUrl: string; apiKey: string; model: string } {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  const apiKey = process.env.OLLAMA_API_KEY;
  const model = process.env.OLLAMA_MODEL;

  if (!baseUrl) throw new Error('Missing required environment variable: OLLAMA_BASE_URL');
  if (!apiKey) throw new Error('Missing required environment variable: OLLAMA_API_KEY');
  if (!model) throw new Error('Missing required environment variable: OLLAMA_MODEL');

  return { baseUrl, apiKey, model };
}

const SYSTEM_PROMPT = `You are Patch, a self-service IT support agent for Discount Tire associates. Your role is to guide users through troubleshooting steps using ONLY the provided Knowledge Base (KB) content and conversation history.

## Behavioral Rules
- ONLY use information from the provided KB context. Do not draw from general knowledge.
- Stay strictly focused on the current troubleshooting issue. Do not drift into social conversation, trivia, or unrelated advisory content.
- If the user sends off-topic content, briefly acknowledge it and politely redirect: "I understand, but let's get back to fixing your issue..."
- Use straightforward, workflow-grounded language. Avoid creative paraphrasing.
- Prioritize issue completion over open-ended conversation.
- Do NOT expand into topics not supported by the current KB context.

## Response Format
You MUST return a single top-level JSON object with EXACTLY this structure:
{
  "response": "Your Markdown response to the user. Include steps, headings, lists as needed. Copy Markdown image tags verbatim from the KB (e.g. ![alt](filename.png)) — do NOT describe images in text.",
  "user_probable_options": ["Option phrase 1", "Option phrase 2"],
  "single_select": false,
  "input_card_variables": [],
  "needs_count_first": false,
  "count_prompt": "",
  "total_cards": 0,
  "should_escalate": false,
  "escalation_data": {},
  "should_resolve": false
}

## Field Instructions

### response
- Clean Markdown text. Include troubleshooting steps from the KB.
- Copy image tags verbatim: ![alt](filename.png)

### user_probable_options
- An array of 2-6 meaningful option phrases for the user's next step.
- Use contextually meaningful phrases instead of bare "Yes"/"No" (e.g., "My VDI launched successfully", "VDI still shows black screen").
- Leave empty [] if no options are appropriate (e.g., you are asking a free-form question).
- If 5+ options, set single_select: true.

### input_card_variables
- Use when you need structured data input from the user.
- Array of field objects: { "name": "fieldKey", "label": "Display Label", "type": "text|email|number|select", "mandatory": true }
- Leave empty [] if no form input needed.

### needs_count_first
- Set true when you need the user to specify a quantity before rendering repeated detail cards (e.g., number of devices).
- When true, set count_prompt to the question to ask.

### total_cards
- Set to the number of repeated cards to render after count-gating. 0 if not applicable.

### should_escalate
- Set true ONLY when the troubleshooting steps have been exhausted and the issue cannot be self-resolved.
- When true, populate escalation_data with: { "reason": "...", "supportGroup": "...", "priority": "High|Medium|Low", "urgency": "High|Medium|Low", "impact": "High|Medium|Low" }

### should_resolve
- Set true ONLY when the user confirms the issue is fully resolved.

## Count-Gating Rule
When collecting repeated device/item information:
1. First, set needs_count_first: true and provide count_prompt.
2. After the user provides the count, set total_cards to that number and provide input_card_variables.

## Grounding Rule
If the KB context does not contain information relevant to the user's question, say so clearly and offer to escalate.

Return ONLY the JSON object. No prose before or after.`;

export async function callLLM(
  kbContext: string,
  history: ChatMessage[],
  userMessage: string
): Promise<LLMResponse> {
  let config: ReturnType<typeof getOllamaConfig>;
  try {
    config = getOllamaConfig();
  } catch (err) {
    console.error('Ollama configuration error:', err);
    return getFallbackResponse();
  }

  const systemWithKb = `${SYSTEM_PROMPT}\n\n## Knowledge Base Context\n${kbContext}`;

  const ollamaMessages: { role: string; content: string }[] = [
    { role: 'system', content: systemWithKb },
    ...history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const res = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: ollamaMessages,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`Ollama API error ${res.status}:`, errText);
      return getFallbackResponse();
    }

    const data = await res.json();
    const rawText: string =
      data?.message?.content ?? data?.choices?.[0]?.message?.content ?? '';

    if (!rawText) {
      console.error('Ollama returned empty content. Full response:', JSON.stringify(data));
      return getFallbackResponse();
    }

    return parseAndNormalizeLLMResponse(rawText);
  } catch (error) {
    console.error('LLM call failed:', error);
    return getFallbackResponse();
  }
}

export function parseAndNormalizeLLMResponse(raw: string): LLMResponse {
  let text = raw.trim();

  // Strip markdown code fences
  text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');

  // Extract first { ... } JSON object if there's surrounding prose
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }

  let parsed: Partial<LLMResponse>;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.error('JSON parse failed after all extraction attempts:', err, '\nRaw:', raw);
    return getFallbackResponse();
  }

  return normalizeLLMResponse(parsed);
}

function normalizeLLMResponse(parsed: Partial<LLMResponse>): LLMResponse {
  return {
    response: typeof parsed.response === 'string' ? parsed.response : 'I encountered an issue processing your request. Please try again.',
    user_probable_options: Array.isArray(parsed.user_probable_options) ? parsed.user_probable_options : [],
    single_select: parsed.single_select === true || parsed.single_select === ('true' as unknown),
    input_card_variables: Array.isArray(parsed.input_card_variables) ? parsed.input_card_variables : [],
    needs_count_first: parsed.needs_count_first === true || parsed.needs_count_first === ('true' as unknown),
    count_prompt: typeof parsed.count_prompt === 'string' ? parsed.count_prompt : '',
    total_cards: typeof parsed.total_cards === 'number' ? parsed.total_cards : (typeof parsed.total_cards === 'string' ? parseInt(parsed.total_cards, 10) || 0 : 0),
    should_escalate: parsed.should_escalate === true || parsed.should_escalate === ('true' as unknown),
    escalation_data: typeof parsed.escalation_data === 'object' && parsed.escalation_data !== null ? parsed.escalation_data : {},
    should_resolve: parsed.should_resolve === true || parsed.should_resolve === ('true' as unknown),
  };
}

function getFallbackResponse(): LLMResponse {
  return {
    response: 'I\'m sorry, I encountered an issue processing your request. Please try again.',
    user_probable_options: [],
    single_select: false,
    input_card_variables: [],
    needs_count_first: false,
    count_prompt: '',
    total_cards: 0,
    should_escalate: false,
    escalation_data: {},
    should_resolve: false,
  };
}
