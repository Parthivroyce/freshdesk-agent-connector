import { TicketProvider } from './TicketProvider.js';
import {
  NormalizedTicket,
  NormalizedConversation,
  NormalizedPaginatedResponse,
} from '../schemas/ticket.js';
import {
  ListTicketsInput,
  SearchTicketsInput,
} from '../schemas/tools.js';
import { NotFoundError } from '../utils/errors.js';

// 10+ Fictional Razorpay Merchant Support Tickets
const DEMO_TICKETS: NormalizedTicket[] = [
  {
    id: 1001,
    subject: '[DEMO] Failed autopay payment for recurring subscription (mandate debit failed)',
    description_text: 'Customer mandate sub_K38d9x88172 debit failed on 2nd of the month with error: "CARD_EXPIRED". The customer updated their card on file yesterday, but retry attempts are still failing with bank code B102.',
    status: 'open',
    status_code: 2,
    priority: 'high',
    priority_code: 3,
    requester: {
      id: 501,
      name: 'Aditi Sharma (QuickSaaS Billing)',
      email: 'aditi@quicksaas-demo.io',
      phone: '+91 98765 43210',
    },
    tags: ['subscriptions', 'autopay', 'mandate_debit_failed', 'billing', 'demo_data'],
    created_at: '2026-10-01T09:15:00.000Z',
    updated_at: '2026-10-03T07:20:00.000Z',
    due_by: '2026-10-03T18:00:00.000Z',
    type: 'Merchant Support',
    custom_fields: {
      merchant_id: 'mid_quicksaas_98',
      payment_id: 'pay_K992x83910',
      gateway: 'Razorpay Subscriptions v2',
      environment: 'production',
    },
    source: 'DemoProvider (Fictional Data)',
  },
  {
    id: 1002,
    subject: '[DEMO] Refund pending after 7 business days for customer order #98214',
    description_text: 'A customer refund for payment pay_L1892839 was initiated on Sept 23 via the Razorpay merchant dashboard. The customer states their issuing bank (ICICI) has no record of the credit. RRN shows as pending.',
    status: 'pending',
    status_code: 3,
    priority: 'urgent',
    priority_code: 4,
    requester: {
      id: 502,
      name: 'Rajesh Kumar (UrbanCraft Store)',
      email: 'rajesh@urbancraft-demo.in',
      phone: '+91 91234 56789',
    },
    tags: ['refunds', 'arn_rrn', 'icici_bank', 'customer_escalation', 'demo_data'],
    created_at: '2026-09-30T11:45:00.000Z',
    updated_at: '2026-10-02T16:30:00.000Z',
    due_by: '2026-10-02T12:00:00.000Z',
    type: 'Escalation',
    custom_fields: {
      merchant_id: 'mid_urbancraft_01',
      refund_id: 'rfnd_M2891823',
      amount_inr: 4500,
    },
    source: 'DemoProvider (Fictional Data)',
  },
  {
    id: 1003,
    subject: '[DEMO] Payment marked successful in Razorpay but Shopify LMS order not created',
    description_text: 'Multiple students paid for the Data Science Bootcamp (e.g., pay_N3849182). Funds were captured in Razorpay dashboard, but webhook events "payment.captured" were returned with 504 Gateway Timeout on merchant server.',
    status: 'open',
    status_code: 2,
    priority: 'high',
    priority_code: 3,
    requester: {
      id: 503,
      name: 'Priya Iyer (EduSprint Academy)',
      email: 'tech@edusprint-demo.edu',
    },
    tags: ['webhooks', 'webhook_timeout', 'order_status_sync', 'shopify', 'demo_data'],
    created_at: '2026-10-02T14:10:00.000Z',
    updated_at: '2026-10-03T06:45:00.000Z',
    type: 'Technical Support',
    custom_fields: {
      merchant_id: 'mid_edusprint_44',
      affected_orders: 'ORD-8921, ORD-8924, ORD-8930',
    },
    source: 'DemoProvider (Fictional Data)',
  },
  {
    id: 1004,
    subject: '[DEMO] Duplicate charge during Diwali flash sale UPI spike',
    description_text: 'Customer was debited twice for INR 1,299 on Google Pay UPI for checkout order order_diwali_8829. Both UPI transactions show as captured on Razorpay. One needs immediate reverse credit.',
    status: 'resolved',
    status_code: 4,
    priority: 'medium',
    priority_code: 2,
    requester: {
      id: 504,
      name: 'Vikas Malhotra (FestiveMart India)',
      email: 'vikas@festivemart-demo.com',
    },
    tags: ['upi', 'duplicate_charge', 'instant_refund', 'flash_sale', 'demo_data'],
    created_at: '2026-09-28T18:05:00.000Z',
    updated_at: '2026-09-29T10:15:00.000Z',
    type: 'Dispute / Billing',
    custom_fields: {
      merchant_id: 'mid_festivemart_99',
      reversal_refund_id: 'rfnd_rev_918281',
    },
    source: 'DemoProvider (Fictional Data)',
  },
  {
    id: 1005,
    subject: '[DEMO] Checkout modal failure on iOS Safari (CSP iframe sandbox issue)',
    description_text: 'Merchants testing Standard Checkout JS v1 on iOS Safari 18 reporting that clicking "Pay Now" triggers a blank popup or freezes the parent frame. Console shows Content-Security-Policy frame-ancestors block.',
    status: 'open',
    status_code: 2,
    priority: 'high',
    priority_code: 3,
    requester: {
      id: 505,
      name: 'Karan Mehra (MobileFirst Apparel)',
      email: 'dev@mobilefirst-demo.com',
    },
    tags: ['checkout_js', 'ios_safari', 'csp_error', 'frontend_sdk', 'demo_data'],
    created_at: '2026-10-02T19:30:00.000Z',
    updated_at: '2026-10-03T05:10:00.000Z',
    type: 'SDK Integration',
    custom_fields: {
      sdk_version: 'checkout.js 1.0.8',
      platform: 'iOS Safari 18.0',
    },
    source: 'DemoProvider (Fictional Data)',
  },
  {
    id: 1006,
    subject: '[DEMO] Subscription renewal failure exceeding RBI e-mandate limit of ₹15,000',
    description_text: 'Enterprise annual tier is ₹24,000 INR. Automated recurring renewal was declined by HDFC Bank with error "MANDATE_AMOUNT_LIMIT_EXCEEDED". Need guidance on Additional Factor of Authentication (AFA) notification flow.',
    status: 'closed',
    status_code: 5,
    priority: 'medium',
    priority_code: 2,
    requester: {
      id: 506,
      name: 'Sneha Patel (CloudStack Technologies)',
      email: 'billing@cloudstack-demo.in',
    },
    tags: ['rbi_guidelines', 'e_mandate', 'afa_otp', 'subscriptions', 'demo_data'],
    created_at: '2026-09-25T08:20:00.000Z',
    updated_at: '2026-09-27T14:40:00.000Z',
    type: 'Compliance / Product',
    custom_fields: {
      regulatory_flag: 'RBI_EMANDATE_OVER_15K',
      plan_id: 'plan_annual_ent_24k',
    },
    source: 'DemoProvider (Fictional Data)',
  },
  {
    id: 1007,
    subject: '[DEMO] Webhook delivery latency of 18 minutes for payment.captured events',
    description_text: 'Between 19:00 IST and 20:30 IST yesterday, webhook events were queued and delivered with an average latency of 18 minutes. This caused delivery dispatch delays for our on-demand grocery app.',
    status: 'pending',
    status_code: 3,
    priority: 'high',
    priority_code: 3,
    requester: {
      id: 507,
      name: 'Nikhil Saxena (SpeedBasket Logistics)',
      email: 'ops@speedbasket-demo.com',
    },
    tags: ['webhooks', 'webhook_latency', 'queue_backlog', 'ops_critical', 'demo_data'],
    created_at: '2026-10-01T21:15:00.000Z',
    updated_at: '2026-10-02T11:00:00.000Z',
    type: 'Infrastructure',
    custom_fields: {
      event_type: 'payment.captured',
      peak_volume_rps: 450,
    },
    source: 'DemoProvider (Fictional Data)',
  },
  {
    id: 1008,
    subject: '[DEMO] Merchant settlement discrepancy on Oct 1 batch (missing 4 captured transactions)',
    description_text: 'The automated T+1 settlement batch for 2026-10-01 was credited as ₹1,82,400. However, the reconciled captured transactions total ₹1,98,950. 4 high-value credit card transactions seem omitted from payout setl_98129.',
    status: 'open',
    status_code: 2,
    priority: 'urgent',
    priority_code: 4,
    requester: {
      id: 508,
      name: 'Deepak Verma (Apex Electronics Wholesale)',
      email: 'accounts@apexelectronics-demo.in',
    },
    tags: ['settlements', 'reconciliation', 'payout_delay', 'finance', 'demo_data'],
    created_at: '2026-10-02T08:00:00.000Z',
    updated_at: '2026-10-03T04:25:00.000Z',
    type: 'Finance & Settlements',
    custom_fields: {
      settlement_id: 'setl_98129',
      discrepancy_amount: 16550,
    },
    source: 'DemoProvider (Fictional Data)',
  },
  {
    id: 1009,
    subject: '[DEMO] International card payment failing with 3DS OTP verification loop',
    description_text: 'Cross-border customers from Singapore and UAE using HSBC and Emirates NBD cards are getting stuck in an infinite 3DS redirect loop when attempting payments over $100 USD. Gateway code INT_3DS_LOOP.',
    status: 'open',
    status_code: 2,
    priority: 'high',
    priority_code: 3,
    requester: {
      id: 509,
      name: 'Farhan Zaidi (GlobalTour Experiences)',
      email: 'payments@globaltour-demo.com',
    },
    tags: ['international_cards', '3ds_loop', 'currency_conversion', 'cross_border', 'demo_data'],
    created_at: '2026-10-02T13:40:00.000Z',
    updated_at: '2026-10-03T08:00:00.000Z',
    type: 'International Payments',
    custom_fields: {
      currency: 'USD',
      issuing_countries: ['SG', 'AE'],
    },
    source: 'DemoProvider (Fictional Data)',
  },
  {
    id: 1010,
    subject: '[DEMO] Customer unable to complete payment: "Bank server down" error on HDFC Netbanking',
    description_text: 'Checkout conversion dropped by 35% on Netbanking payments for HDFC. The bank gateway redirect returns: "ERR_BANK_COMMUNICATION_FAILURE". Is there a known bank downtime or gateway maintenance?',
    status: 'resolved',
    status_code: 4,
    priority: 'medium',
    priority_code: 2,
    requester: {
      id: 510,
      name: 'Rohan Deshmukh (BookMyPass Events)',
      email: 'support@bookmypass-demo.com',
    },
    tags: ['netbanking', 'hdfc_bank', 'downtime', 'conversion_drop', 'demo_data'],
    created_at: '2026-09-29T15:20:00.000Z',
    updated_at: '2026-09-30T12:00:00.000Z',
    type: 'Banking Downtime',
    custom_fields: {
      bank_code: 'HDFC',
      downtime_window: '2026-09-29 15:00 - 18:30 IST',
    },
    source: 'DemoProvider (Fictional Data)',
  },
];

// Fictional multi-turn conversations for key tickets
const DEMO_CONVERSATIONS: Record<number, NormalizedConversation[]> = {
  1001: [
    {
      id: 8001,
      ticket_id: 1001,
      body_text: 'Hi Razorpay Support, our subscriber mandate sub_K38d9x88172 failed today with CARD_EXPIRED. Customer updated their card details yesterday, but manual retry via dashboard gives bank error B102. Can you check why the new card is not being charged?',
      author_name: 'Aditi Sharma (QuickSaaS Billing)',
      author_email: 'aditi@quicksaas-demo.io',
      incoming: true,
      private: false,
      created_at: '2026-10-01T09:15:00.000Z',
      updated_at: '2026-10-01T09:15:00.000Z',
    },
    {
      id: 8002,
      ticket_id: 1001,
      body_text: 'Hello Aditi, thanks for reaching out. We inspected mandate sub_K38d9x88172. The merchant update API successfully registered the new token, but the customer\'s issuing bank (SBI) requires an initial authentication debit (₹2 auth) before honoring subsequent scheduled debits. Did the customer complete the ₹2 validation challenge?',
      author_name: 'Ananya Roy (Razorpay Merchant Support)',
      author_email: 'merchant-support@razorpay-demo.com',
      incoming: false,
      private: false,
      created_at: '2026-10-01T11:30:00.000Z',
      updated_at: '2026-10-01T11:30:00.000Z',
    },
    {
      id: 8003,
      ticket_id: 1001,
      body_text: 'Thanks Ananya. We checked our webhook logs and it looks like the ₹2 auth link sent to the customer was abandoned. We triggered a fresh verification link to the customer just now.',
      author_name: 'Aditi Sharma (QuickSaaS Billing)',
      author_email: 'aditi@quicksaas-demo.io',
      incoming: true,
      private: false,
      created_at: '2026-10-02T10:05:00.000Z',
      updated_at: '2026-10-02T10:05:00.000Z',
    },
    {
      id: 8004,
      ticket_id: 1001,
      body_text: 'Customer has completed the ₹2 auth! However, our automated retry batch runs at midnight. Can your team force an immediate debit from the backend or should we wait for the scheduled retry?',
      author_name: 'Aditi Sharma (QuickSaaS Billing)',
      author_email: 'aditi@quicksaas-demo.io',
      incoming: true,
      private: false,
      created_at: '2026-10-03T07:20:00.000Z',
      updated_at: '2026-10-03T07:20:00.000Z',
    },
  ],
  1002: [
    {
      id: 8011,
      ticket_id: 1002,
      body_text: 'Urgent: Customer initiated refund for payment pay_L1892839 on Sept 23 for ₹4,500. It has been 7 business days. Customer has filed a complaint on national consumer forum claiming we did not refund. ARN number is missing in the refund record.',
      author_name: 'Rajesh Kumar (UrbanCraft Store)',
      author_email: 'rajesh@urbancraft-demo.in',
      incoming: true,
      private: false,
      created_at: '2026-09-30T11:45:00.000Z',
      updated_at: '2026-09-30T11:45:00.000Z',
    },
    {
      id: 8012,
      ticket_id: 1002,
      body_text: 'Hello Rajesh, we have escalated this to our banking operations desk. The refund was processed via NEFT batch on Sept 24, but the beneficiary bank (ICICI) reported a reconciliation delay on that clearing cycle. We are requesting the bank reference RRN directly from ICICI nodal team.',
      author_name: 'Karthik N (Razorpay Banking Escalations)',
      author_email: 'escalations@razorpay-demo.com',
      incoming: false,
      private: false,
      created_at: '2026-10-01T14:20:00.000Z',
      updated_at: '2026-10-01T14:20:00.000Z',
    },
    {
      id: 8013,
      ticket_id: 1002,
      body_text: 'Update: Bank confirmed RRN is 426819284019. The amount was credited to customer account ending in 4018 on Oct 2 at 14:15 IST. Please share this RRN with your customer so they can track with their branch manager.',
      author_name: 'Karthik N (Razorpay Banking Escalations)',
      author_email: 'escalations@razorpay-demo.com',
      incoming: false,
      private: false,
      created_at: '2026-10-02T16:30:00.000Z',
      updated_at: '2026-10-02T16:30:00.000Z',
    },
  ],
  1003: [
    {
      id: 8021,
      ticket_id: 1003,
      body_text: 'Students paying for Data Science batch are seeing "payment successful" on the checkout page, but their account in our LMS remains inactive. Check payments pay_N3849182 and pay_N3849200.',
      author_name: 'Priya Iyer (EduSprint Academy)',
      author_email: 'tech@edusprint-demo.edu',
      incoming: true,
      private: false,
      created_at: '2026-10-02T14:10:00.000Z',
      updated_at: '2026-10-02T14:10:00.000Z',
    },
    {
      id: 8022,
      ticket_id: 1003,
      body_text: 'Hi Priya, we investigated both payment IDs. Both payments are in status "captured". We checked our outbound webhook dispatcher: your endpoint https://api.edusprint-demo.edu/webhooks/razorpay responded with HTTP 504 Gateway Timeout after 30 seconds. Razorpay will retry webhooks with exponential backoff (attempt 1 of 5). Please verify your webhook server scaling.',
      author_name: 'Siddharth M (Razorpay Technical Solutions)',
      author_email: 'tech-solutions@razorpay-demo.com',
      incoming: false,
      private: false,
      created_at: '2026-10-02T15:00:00.000Z',
      updated_at: '2026-10-02T15:00:00.000Z',
    },
    {
      id: 8023,
      ticket_id: 1003,
      body_text: 'Understood. We had a database deadlock on our LMS enrollment table. We resolved the bottleneck. Can you trigger a manual retry for all failed webhook events from the last 24 hours?',
      author_name: 'Priya Iyer (EduSprint Academy)',
      author_email: 'tech@edusprint-demo.edu',
      incoming: true,
      private: false,
      created_at: '2026-10-03T06:45:00.000Z',
      updated_at: '2026-10-03T06:45:00.000Z',
    },
  ],
  1008: [
    {
      id: 8031,
      ticket_id: 1008,
      body_text: 'Our daily settlement setl_98129 received this morning is ₹1,82,400. However, our internal ledger reconciled captured transactions as ₹1,98,950. Exactly ₹16,550 is missing across 4 transactions (pay_T9812, pay_T9814, pay_T9818, pay_T9821).',
      author_name: 'Deepak Verma (Apex Electronics Wholesale)',
      author_email: 'accounts@apexelectronics-demo.in',
      incoming: true,
      private: false,
      created_at: '2026-10-02T08:00:00.000Z',
      updated_at: '2026-10-02T08:00:00.000Z',
    },
    {
      id: 8032,
      ticket_id: 1008,
      body_text: 'Hello Deepak, reviewing your settlement statement. Those 4 transactions were processed via American Express credit card at 23:45 IST on Sept 30. Amex transactions settled under T+2 clearing window instead of Domestic UPI/Debit T+1. They are queued for tomorrow morning settlement batch setl_98135.',
      author_name: 'Arjun V (Razorpay Settlement Support)',
      author_email: 'settlements@razorpay-demo.com',
      incoming: false,
      private: false,
      created_at: '2026-10-03T04:25:00.000Z',
      updated_at: '2026-10-03T04:25:00.000Z',
    },
  ],
};

export class DemoProvider implements TicketProvider {
  public readonly name = 'DemoProvider (Fictional Razorpay Merchant Data)';
  public readonly isDemo = true;

  async listTickets(params: ListTicketsInput): Promise<NormalizedPaginatedResponse<NormalizedTicket>> {
    const page = params.page || 1;
    const perPage = params.per_page || 20;

    let filtered = [...DEMO_TICKETS];

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(t => t.status === params.status);
    }

    if (params.priority) {
      filtered = filtered.filter(t => t.priority === params.priority);
    }

    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    return {
      data: paginatedItems,
      pagination: {
        page,
        per_page: perPage,
        has_more: endIndex < filtered.length,
        total_count: filtered.length,
      },
    };
  }

  async getTicket(ticketId: number): Promise<NormalizedTicket> {
    const ticket = DEMO_TICKETS.find(t => t.id === ticketId);
    if (!ticket) {
      throw new NotFoundError(`Freshdesk ticket #${ticketId}`);
    }
    return ticket;
  }

  async searchTickets(params: SearchTicketsInput): Promise<NormalizedPaginatedResponse<NormalizedTicket>> {
    const page = params.page || 1;
    const perPage = params.per_page || 20;
    const lowerQuery = params.query.toLowerCase().trim();

    const matched = DEMO_TICKETS.filter(t => {
      const inSubject = t.subject.toLowerCase().includes(lowerQuery);
      const inDesc = t.description_text.toLowerCase().includes(lowerQuery);
      const inTags = t.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      const inRequester = t.requester.name.toLowerCase().includes(lowerQuery) || t.requester.email.toLowerCase().includes(lowerQuery);
      const inId = String(t.id).includes(lowerQuery);
      return inSubject || inDesc || inTags || inRequester || inId;
    });

    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedItems = matched.slice(startIndex, endIndex);

    return {
      data: paginatedItems,
      pagination: {
        page,
        per_page: perPage,
        has_more: endIndex < matched.length,
        total_count: matched.length,
      },
    };
  }

  async listConversations(
    ticketId: number,
    params: { page?: number; per_page?: number } = {}
  ): Promise<NormalizedPaginatedResponse<NormalizedConversation>> {
    // Check if ticket exists first
    const ticket = DEMO_TICKETS.find(t => t.id === ticketId);
    if (!ticket) {
      throw new NotFoundError(`Freshdesk ticket #${ticketId}`);
    }

    const page = params.page || 1;
    const perPage = params.per_page || 50;

    let conversations = DEMO_CONVERSATIONS[ticketId];

    // If no explicit conversation history defined, construct an initial thread turn from the ticket description
    if (!conversations || conversations.length === 0) {
      conversations = [
        {
          id: ticketId * 10,
          ticket_id: ticketId,
          body_text: ticket.description_text,
          author_name: ticket.requester.name,
          author_email: ticket.requester.email,
          incoming: true,
          private: false,
          created_at: ticket.created_at,
          updated_at: ticket.created_at,
        },
      ];
    }

    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginated = conversations.slice(startIndex, endIndex);

    return {
      data: paginated,
      pagination: {
        page,
        per_page: perPage,
        has_more: endIndex < conversations.length,
        total_count: conversations.length,
      },
    };
  }
}
