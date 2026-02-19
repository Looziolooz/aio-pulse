import { z } from 'zod'

// ─── Analysis ─────────────────────────────────────────────────────────────────

export const analyzeTextSchema = z.object({
  input: z.string().min(1, 'Content is required').max(15_000, 'Content too long'),
  mode: z.enum(['text', 'url']),
  engine: z.enum(['all', 'chatgpt', 'gemini', 'perplexity', 'claude']).default('all'),
  model: z
    .enum(['default', 'gpt-4o', 'gemini-pro', 'claude-3-5-sonnet', 'perplexity-sonar'])
    .default('default'),
})

export type AnalyzeTextInput = z.infer<typeof analyzeTextSchema>

// ─── Competitor ───────────────────────────────────────────────────────────────

export const competitorSchema = z.object({
  primaryUrl: z.string().url('Invalid primary URL'),
  competitorUrls: z
    .array(z.string().url('Invalid URL'))
    .min(1, 'Add at least one competitor')
    .max(3, 'Maximum 3 competitors'),
})

export type CompetitorInput = z.infer<typeof competitorSchema>

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = loginSchema
  .extend({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

// ─── Search / Filter ─────────────────────────────────────────────────────────

export const searchSchema = z.object({
  query: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(5).max(100).default(20),
})

export type SearchInput = z.infer<typeof searchSchema>
