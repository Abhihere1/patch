export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface MessageControl {
  type: 'buttons' | 'select' | 'form' | null;
  options?: string[];
  formFields?: FormField[];
  totalCards?: number;
  answered?: boolean;
  partialFormState?: Record<string, Record<string, string>>;
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  mandatory: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  control?: MessageControl;
  imageRefs?: string[];
}

export interface EscalationDetails {
  reason?: string;
  supportGroup?: string;
  priority?: string;
  urgency?: string;
  impact?: string;
}

export interface ResolutionDetails {
  summary?: string;
}

export interface Feedback {
  rating?: number;
  comment?: string;
  submittedAt?: Date;
}

export interface Incident {
  _id?: string;
  incidentId: string;
  userId: string;
  status: 'Open' | 'Escalated' | 'Resolved';
  category: string;
  kbFiles: string[];
  history: ChatMessage[];
  escalationDetails?: EscalationDetails;
  resolutionDetails?: ResolutionDetails;
  feedback?: Feedback;
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMResponse {
  response: string;
  user_probable_options?: string[];
  input_card_variables?: FormField[];
  needs_count_first?: boolean;
  count_prompt?: string;
  total_cards?: number;
  should_escalate?: boolean;
  escalation_data?: EscalationDetails;
  should_resolve?: boolean;
  single_select?: boolean;
}

export interface SessionUser {
  userId: string;
  email: string;
  username: string;
}
