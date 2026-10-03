import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const rawEnvSchema = z.object({
  PORT: z.string().optional().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEMO_MODE: z.string().optional(),
  FRESHDESK_DOMAIN: z.string().optional(),
  FRESHDESK_API_KEY: z.string().optional(),
  FRESHDESK_API_BASE_URL: z.string().optional(),
  REQUEST_TIMEOUT_MS: z.string().optional().default('10000'),
  MAX_RETRIES: z.string().optional().default('3'),
  ENABLE_LLM_SUMMARY: z.string().optional().default('false'),
  GEMINI_API_KEY: z.string().optional(),
});

const parsed = rawEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('[Config] Warning: Environment parsing issues:', parsed.error.format());
}

const raw = parsed.success ? parsed.data : {
  PORT: '3000',
  NODE_ENV: 'development' as const,
  DEMO_MODE: undefined,
  FRESHDESK_DOMAIN: undefined,
  FRESHDESK_API_KEY: undefined,
  FRESHDESK_API_BASE_URL: undefined,
  REQUEST_TIMEOUT_MS: '10000',
  MAX_RETRIES: '3',
  ENABLE_LLM_SUMMARY: 'false',
  GEMINI_API_KEY: undefined,
};

// Evaluate if Freshdesk credentials are provided and valid
const hasFreshdeskCredentials = Boolean(
  raw.FRESHDESK_DOMAIN && 
  raw.FRESHDESK_DOMAIN.trim() !== '' && 
  raw.FRESHDESK_API_KEY && 
  raw.FRESHDESK_API_KEY.trim() !== '' &&
  !raw.FRESHDESK_API_KEY.includes('your_freshdesk_api_key')
);

// If explicitly forced into demo mode or if credentials are absent, boot in demo mode
const isDemoMode = raw.DEMO_MODE === 'true' || !hasFreshdeskCredentials;

// Clean domain if provided (strip protocol and trailing slash)
let cleanDomain = raw.FRESHDESK_DOMAIN ? raw.FRESHDESK_DOMAIN.trim() : '';
cleanDomain = cleanDomain.replace(/^https?:\/\//i, '').replace(/\/$/, '');

let baseUrl = raw.FRESHDESK_API_BASE_URL?.trim();
if (!baseUrl && cleanDomain) {
  baseUrl = `https://${cleanDomain}`;
}

export const env = {
  PORT: parseInt(raw.PORT, 10) || 3000,
  NODE_ENV: raw.NODE_ENV,
  DEMO_MODE: isDemoMode,
  FRESHDESK_DOMAIN: cleanDomain,
  FRESHDESK_API_KEY: raw.FRESHDESK_API_KEY?.trim() || '',
  FRESHDESK_API_BASE_URL: baseUrl || '',
  REQUEST_TIMEOUT_MS: parseInt(raw.REQUEST_TIMEOUT_MS, 10) || 10000,
  MAX_RETRIES: Math.max(1, Math.min(5, parseInt(raw.MAX_RETRIES, 10) || 3)),
  ENABLE_LLM_SUMMARY: raw.ENABLE_LLM_SUMMARY === 'true',
  GEMINI_API_KEY: raw.GEMINI_API_KEY || '',
};

// Public configuration safe to expose to client (NO SECRETS)
export function getSafePublicConfig() {
  return {
    demo_mode: env.DEMO_MODE,
    provider: env.DEMO_MODE ? 'DemoProvider (Fictional Razorpay Data)' : 'FreshdeskLiveProvider',
    has_credentials: hasFreshdeskCredentials,
    domain_configured: Boolean(env.FRESHDESK_DOMAIN),
    environment: env.NODE_ENV,
    read_only: true,
    max_retries: env.MAX_RETRIES,
    timeout_ms: env.REQUEST_TIMEOUT_MS,
  };
}
