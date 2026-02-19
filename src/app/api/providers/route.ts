// PATH: src/app/api/providers/route.ts
// GET /api/providers — stato di configurazione di tutti i provider AI.

import { NextResponse } from 'next/server'
import { getProviderStatus } from '@/lib/services/ai-router'

export async function GET() {
  const status = getProviderStatus()
  const configuredCount = Object.values(status).filter((p) => p.configured).length

  return NextResponse.json({
    success: true,
    data: {
      providers: status,
      configuredCount,
      totalCount: Object.keys(status).length,
      recommendation:
        configuredCount === 0
          ? 'Nessun provider configurato. Aggiungi almeno GEMINI_API_KEY in .env.local.'
          : configuredCount === 1
            ? 'Stai usando un solo provider. Aggiungi Groq o Cerebras per aumentare i limiti.'
            : `Ottimo! Hai ${configuredCount} provider configurati con fallback automatico.`,
    },
    timestamp: Date.now(),
  })
}