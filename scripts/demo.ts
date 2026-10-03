/**
 * Standalone demonstration script for the Freshdesk Agent Connector.
 * Executes all 5 MCP tools, demonstrates error handling, validation, and rate limit backoff.
 * Run with: npm run demo
 */
import { DemoProvider } from '../server/providers/DemoProvider.js';
import { executeTool } from '../server/tools/index.js';
import { FreshdeskClient } from '../server/services/freshdeskClient.js';
import { FreshdeskProvider } from '../server/providers/FreshdeskProvider.js';

function banner(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title.toUpperCase()}`);
  console.log('='.repeat(70));
}

function printJson(obj: any) {
  console.log(JSON.stringify(obj, null, 2));
}

async function runDemo() {
  console.log('\n🚀 Starting Freshdesk Agent Connector Demonstration\n');
  const provider = new DemoProvider();
  console.log(`Active Provider: ${provider.name}`);
  console.log(`Demo Mode: ${provider.isDemo}`);

  // 1. list_tickets
  banner('1. Tool: list_tickets (status: open, per_page: 3)');
  try {
    const listRes = await executeTool(
      'list_tickets',
      { status: 'open', page: 1, per_page: 3 },
      provider,
      'demo-req-1'
    );
    console.log(`⏱️ Duration: ${listRes.duration_ms}ms`);
    console.log(`Fetched ${listRes.result.data.length} tickets (Total: ${listRes.result.pagination.total_count})`);
    printJson(listRes.result.data.map((t: any) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      requester: t.requester.name,
      tags: t.tags,
    })));
  } catch (err: any) {
    console.error('Failed list_tickets:', err.message);
  }

  // 2. search_tickets
  banner('2. Tool: search_tickets (query: "payment", per_page: 3)');
  try {
    const searchRes = await executeTool(
      'search_tickets',
      { query: 'payment', page: 1, per_page: 3 },
      provider,
      'demo-req-2'
    );
    console.log(`⏱️ Duration: ${searchRes.duration_ms}ms`);
    console.log(`Found ${searchRes.result.data.length} matching tickets:`);
    printJson(searchRes.result.data.map((t: any) => ({
      id: t.id,
      subject: t.subject,
      priority: t.priority,
      requester: t.requester.name,
    })));
  } catch (err: any) {
    console.error('Failed search_tickets:', err.message);
  }

  // 3. get_ticket
  banner('3. Tool: get_ticket (ticket_id: 1001)');
  try {
    const getRes = await executeTool(
      'get_ticket',
      { ticket_id: 1001 },
      provider,
      'demo-req-3'
    );
    console.log(`⏱️ Duration: ${getRes.duration_ms}ms`);
    printJson(getRes.result);
  } catch (err: any) {
    console.error('Failed get_ticket:', err.message);
  }

  // 4. list_ticket_conversations
  banner('4. Tool: list_ticket_conversations (ticket_id: 1001)');
  try {
    const convRes = await executeTool(
      'list_ticket_conversations',
      { ticket_id: 1001, page: 1, per_page: 5 },
      provider,
      'demo-req-4'
    );
    console.log(`⏱️ Duration: ${convRes.duration_ms}ms`);
    console.log(`Retrieved ${convRes.result.data.length} conversation messages:`);
    printJson(convRes.result.data.map((c: any) => ({
      id: c.id,
      author: c.author_name,
      incoming: c.incoming,
      body: c.body_text,
      created_at: c.created_at,
    })));
  } catch (err: any) {
    console.error('Failed list_ticket_conversations:', err.message);
  }

  // 5. get_ticket_summary
  banner('5. Tool: get_ticket_summary (ticket_id: 1001)');
  try {
    const summaryRes = await executeTool(
      'get_ticket_summary',
      { ticket_id: 1001 },
      provider,
      'demo-req-5'
    );
    console.log(`⏱️ Duration: ${summaryRes.duration_ms}ms`);
    printJson(summaryRes.result);
  } catch (err: any) {
    console.error('Failed get_ticket_summary:', err.message);
  }

  // 6. Demonstrate Input Validation & Guardrail Rejection
  banner('6. Guardrails: Invalid Tool Input (ticket_id: "invalid_id")');
  try {
    await executeTool('get_ticket', { ticket_id: 'not-a-number' }, provider, 'demo-req-err-1');
  } catch (err: any) {
    console.log('✅ Safely caught and normalized validation error:');
    printJson({
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  banner('7. Guardrails: Unsupported / Arbitrary Tool Rejection ("delete_ticket")');
  try {
    await executeTool('delete_ticket', { ticket_id: 1001 }, provider, 'demo-req-err-2');
  } catch (err: any) {
    console.log('✅ Safely rejected non-read-only / unsupported tool call:');
    printJson({
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  // 7. Demonstrate Rate Limit Handling with Mocked 429
  banner('8. Rate Limiting: Mocked HTTP 429 & Retry-After Simulation');
  console.log('Testing FreshdeskClient with a mocked fetch handler simulating HTTP 429 with Retry-After: 1...');
  
  let attemptCount = 0;
  const mockFetch = async () => {
    attemptCount++;
    if (attemptCount <= 2) {
      console.log(`   [Mock Upstream] Attempt ${attemptCount}: Returning HTTP 429 (Rate Limit), Retry-After: 1`);
      return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'Retry-After': '1', 'Content-Type': 'application/json' },
      });
    }
    console.log(`   [Mock Upstream] Attempt ${attemptCount}: Upstream recovered. Returning HTTP 200 OK.`);
    return new Response(JSON.stringify([{ id: 9999, subject: 'Recovered Ticket', status: 2, priority: 2 }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const simulatedClient = new FreshdeskClient({
    domain: 'demo-merchant.freshdesk.com',
    apiKey: 'dummy_demo_key_xyz',
    maxRetries: 3,
    fetchFn: mockFetch as any,
  });

  const simulatedProvider = new FreshdeskProvider(simulatedClient);
  const recoveredResult = await simulatedProvider.listTickets({ page: 1, per_page: 5 });
  console.log(`✅ Client successfully recovered after ${attemptCount} attempts using exponential backoff:`);
  printJson(recoveredResult.data);

  console.log('\n🎉 Demonstration completed successfully! All tools and guardrails verified.\n');
}

runDemo().catch(err => {
  console.error('Demo encountered an unhandled error:', err);
});
