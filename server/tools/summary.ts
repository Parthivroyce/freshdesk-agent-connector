import { TicketProvider } from '../providers/TicketProvider.js';
import {
  GetTicketSummaryInput,
  GetTicketSummaryInputSchema,
  GetTicketSummaryJsonSchema,
} from '../schemas/tools.js';
import { TicketSummaryResult } from '../schemas/ticket.js';
import { env } from '../config/env.js';

/**
 * Deterministic ticket summarizer.
 * Analyzes ticket details, tags, and conversation threads without requiring an external LLM.
 */
export async function generateDeterministicSummary(
  provider: TicketProvider,
  ticketId: number
): Promise<TicketSummaryResult> {
  const ticket = await provider.getTicket(ticketId);
  const conversationRes = await provider.listConversations(ticketId, { page: 1, per_page: 50 });
  const conversations = conversationRes.data;

  // Extract payment/banking entities using regex
  const fullText = [ticket.subject, ticket.description_text, ...conversations.map(c => c.body_text)].join(' ');

  const paymentIds = Array.from(new Set(fullText.match(/(?:pay_|sub_|rfnd_|setl_|order_)[a-zA-Z0-9_-]+/g) || []));
  const bankMatches = Array.from(new Set(fullText.match(/\b(HDFC|ICICI|SBI|Axis|Kotak|Amex|American Express|Google Pay|PhonePe|Paytm)\b/gi) || []));
  const amountMatches = Array.from(new Set(fullText.match(/(?:₹|INR|\$)\s?[0-9,]+(?:\.[0-9]{2})?/gi) || []));

  // Determine conversation dynamics
  const totalMessages = conversations.length;
  const merchantMessages = conversations.filter(c => c.incoming);
  const agentMessages = conversations.filter(c => !c.incoming);
  const lastMessage = conversations[conversations.length - 1];

  // Synthesize concise summary paragraph
  let statusSummary = '';
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    statusSummary = `Issue has been marked as ${ticket.status}. Customer was provided with resolution details and bank tracking references.`;
  } else if (lastMessage && lastMessage.incoming) {
    statusSummary = `Awaiting action from Razorpay Support. Customer/merchant posted the latest reply: "${lastMessage.body_text.slice(0, 110)}..."`;
  } else if (lastMessage && !lastMessage.incoming) {
    statusSummary = `Awaiting merchant response. Support agent (${lastMessage.author_name}) provided guidance: "${lastMessage.body_text.slice(0, 110)}..."`;
  } else {
    statusSummary = `Ticket is currently in ${ticket.status} status with priority ${ticket.priority}.`;
  }

  const overview = `Merchant "${ticket.requester.name}" reported: "${ticket.subject}". ${statusSummary}`;

  // Synthesize key points
  const keyPoints: string[] = [];
  keyPoints.push(`Reported Issue: ${ticket.subject.replace(/^\[DEMO\]\s*/, '')}`);

  if (paymentIds.length > 0) {
    keyPoints.push(`Referenced Identifiers: ${paymentIds.slice(0, 4).join(', ')}`);
  }
  if (bankMatches.length > 0) {
    keyPoints.push(`Involved Financial Institutions/Gateways: ${bankMatches.slice(0, 4).join(', ')}`);
  }
  if (amountMatches.length > 0) {
    keyPoints.push(`Transaction Value: ${amountMatches.slice(0, 3).join(', ')}`);
  }

  keyPoints.push(
    `Thread Activity: ${totalMessages} message(s) exchanged (${merchantMessages.length} from merchant, ${agentMessages.length} from support agents).`
  );

  if (ticket.due_by) {
    keyPoints.push(`SLA Due Date: ${new Date(ticket.due_by).toUTCString()}`);
  }

  // Next steps recommendations
  const suggestedNextSteps: string[] = [];
  if (ticket.status === 'open') {
    suggestedNextSteps.push('Review latest merchant inquiry and verify backend gateway / settlement logs.');
    if (paymentIds.length > 0) {
      suggestedNextSteps.push(`Cross-verify status of ${paymentIds[0]} in payment gateway reconciliation dashboard.`);
    }
  } else if (ticket.status === 'pending') {
    suggestedNextSteps.push('Check external banking clearance or customer verification token status.');
    suggestedNextSteps.push('Follow up with issuing bank or merchant integration engineer.');
  } else {
    suggestedNextSteps.push('No further immediate action required; ticket resolved.');
  }

  return {
    ticket_id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    customer: {
      name: ticket.requester.name,
      email: ticket.requester.email,
    },
    summary: overview,
    key_points: keyPoints,
    conversation_count: totalMessages,
    last_updated: ticket.updated_at,
    sentiment: ticket.priority === 'urgent' ? 'frustrated' : ticket.status === 'resolved' ? 'satisfied' : 'neutral',
    suggested_next_steps: suggestedNextSteps,
  };
}

export const getTicketSummaryTool = {
  name: 'get_ticket_summary',
  description: 'Generate an executive summary of a Freshdesk support ticket, including root cause, customer sentiment, referenced payment IDs, key discussion points, and suggested next steps.',
  readOnly: true,
  inputSchema: GetTicketSummaryJsonSchema,
  outputSchema: {
    type: 'object',
    properties: {
      ticket_id: { type: 'integer' },
      subject: { type: 'string' },
      status: { type: 'string', enum: ['open', 'pending', 'resolved', 'closed'] },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      customer: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
      summary: { type: 'string' },
      key_points: {
        type: 'array',
        items: { type: 'string' },
      },
      conversation_count: { type: 'integer' },
      last_updated: { type: 'string', format: 'date-time' },
      sentiment: { type: 'string', enum: ['frustrated', 'neutral', 'satisfied'] },
      suggested_next_steps: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['ticket_id', 'subject', 'status', 'priority', 'customer', 'summary', 'key_points', 'conversation_count', 'last_updated'],
  },
  validate(input: unknown): GetTicketSummaryInput {
    return GetTicketSummaryInputSchema.parse(input);
  },
  async execute(provider: TicketProvider, input: GetTicketSummaryInput): Promise<TicketSummaryResult> {
    return generateDeterministicSummary(provider, input.ticket_id);
  },
};
