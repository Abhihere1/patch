import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getKbContextForCategory } from '@/lib/kb';
import { callLLM } from '@/lib/llm';
import { createIncident, getIncident, appendMessage, updateIncidentStatus } from '@/lib/incidents';
import { ChatMessage, MessageControl } from '@/types';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      message,
      category,
      incidentId: existingIncidentId,
      totalCards,
      partialFormState,
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    // Determine KB context
    const { context: kbContext, files: kbFiles } = await getKbContextForCategory(category || null);

    let incidentId = existingIncidentId;
    let incident;

    if (incidentId) {
      incident = await getIncident(incidentId);
      if (!incident || incident.userId !== session.userId) {
        return NextResponse.json({ error: 'Incident not found.' }, { status: 404 });
      }
      if (incident.status !== 'Open') {
        return NextResponse.json({ error: 'This conversation has ended.' }, { status: 400 });
      }
    } else {
      // First message: create incident
      incident = await createIncident(session.userId, category || 'General', kbFiles);
      incidentId = incident._id;
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    await appendMessage(incidentId, userMessage);

    // Call LLM
    const history = incident ? [...incident.history] : [];
    const llmResponse = await callLLM(kbContext, history, message);

    // Build control metadata
    let control: MessageControl | undefined;
    if (llmResponse.needs_count_first && llmResponse.count_prompt) {
      control = { type: null, answered: false };
    } else if (llmResponse.total_cards && llmResponse.total_cards > 0 && llmResponse.input_card_variables && llmResponse.input_card_variables.length > 0) {
      control = {
        type: 'form',
        formFields: llmResponse.input_card_variables,
        totalCards: totalCards || llmResponse.total_cards,
        answered: false,
        partialFormState: partialFormState || {},
      };
    } else if (llmResponse.user_probable_options && llmResponse.user_probable_options.length > 0) {
      const isSingleSelect = llmResponse.single_select || llmResponse.user_probable_options.length >= 5;
      control = {
        type: isSingleSelect ? 'select' : 'buttons',
        options: llmResponse.user_probable_options,
        answered: false,
      };
    }

    // Build assistant message
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: llmResponse.response,
      timestamp: new Date(),
      control,
    };

    await appendMessage(incidentId, assistantMessage);

    // Handle status transitions
    if (llmResponse.should_escalate) {
      await updateIncidentStatus(incidentId, 'Escalated', {
        escalationDetails: llmResponse.escalation_data,
      });
    } else if (llmResponse.should_resolve) {
      await updateIncidentStatus(incidentId, 'Resolved', {
        resolutionDetails: { summary: llmResponse.response },
      });
    }

    return NextResponse.json({
      incidentId,
      incidentDbId: incidentId,
      message: assistantMessage,
      llmResponse,
      status: llmResponse.should_escalate ? 'Escalated' : llmResponse.should_resolve ? 'Resolved' : 'Open',
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
