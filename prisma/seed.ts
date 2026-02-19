import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Demo user
  const userId = 'dev-user-local-001'

  // Create demo brands
  const brand1 = await prisma.brand.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      userId,
      name: 'Acme Corp',
      slug: 'acme-corp',
      description: 'Leading provider of innovative solutions for enterprise customers',
      domain: 'acmecorp.com',
      aliases: ['Acme', 'Acme Corporation', 'Acme Inc'],
      domains: ['acmecorp.com', 'www.acmecorp.com', 'blog.acmecorp.com'],
      competitors: ['Globex', 'Initech', 'Umbrella Corp'],
      industry: 'Technology',
      color: '#6366f1',
    },
  })

  const brand2 = await prisma.brand.upsert({
    where: { slug: 'techstart' },
    update: {},
    create: {
      userId,
      name: 'TechStart',
      slug: 'techstart',
      description: 'Fast-growing startup disrupting the SaaS market',
      domain: 'techstart.io',
      aliases: ['TechStart', 'TechStart Inc'],
      domains: ['techstart.io', 'www.techstart.io'],
      competitors: ['BigTech', 'LegacyCorp', 'StartupX'],
      industry: 'SaaS',
      color: '#10b981',
    },
  })

  console.log('✅ Created brands')

  // Create prompts for brand 1
  const prompts = await Promise.all([
    prisma.prompt.upsert({
      where: { id: 'prompt-1' },
      update: {},
      create: {
        id: 'prompt-1',
        brandId: brand1.id,
        userId,
        text: 'What are the best enterprise software solutions for project management?',
        language: 'en',
        market: 'global',
        category: 'comparison',
        engines: ['chatgpt', 'gemini', 'perplexity'],
        runFrequency: 'daily',
      },
    }),
    prisma.prompt.upsert({
      where: { id: 'prompt-2' },
      update: {},
      create: {
        id: 'prompt-2',
        brandId: brand1.id,
        userId,
        text: 'Compare Acme Corp vs Globex for enterprise needs',
        language: 'en',
        market: 'US',
        category: 'comparison',
        engines: ['chatgpt', 'gemini', 'perplexity'],
        runFrequency: 'daily',
      },
    }),
    prisma.prompt.upsert({
      where: { id: 'prompt-3' },
      update: {},
      create: {
        id: 'prompt-3',
        brandId: brand2.id,
        userId,
        text: 'What are the best startups in the SaaS space?',
        language: 'en',
        market: 'global',
        category: 'awareness',
        engines: ['chatgpt', 'gemini'],
        runFrequency: 'weekly',
      },
    }),
  ])

  console.log('✅ Created prompts')

  // Create monitoring results with demo data
  const engines = ['chatgpt', 'gemini', 'perplexity'] as const
  const sentiments = ['positive', 'negative', 'neutral'] as const

  for (const prompt of prompts) {
    for (const engine of engines) {
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)]
      const brandMentioned = Math.random() > 0.3
      const mentionPosition = brandMentioned ? Math.floor(Math.random() * 10) + 1 : null

      await prisma.monitoringResult.create({
        data: {
          promptId: prompt.id,
          brandId: prompt.brandId,
          userId,
          engine,
          promptText: prompt.text,
          responseText: `This is a sample AI response for the prompt: "${prompt.text}". ${brandMentioned ? `${prompt.brandId === brand1.id ? 'Acme Corp' : 'TechStart'} is mentioned as one of the leading solutions.` : 'This brand was not mentioned in this response.'}`,
          brandMentioned,
          mentionPosition,
          mentionCount: brandMentioned ? Math.floor(Math.random() * 5) + 1 : 0,
          mentionType: brandMentioned ? 'direct' : 'none',
          visibilityScore: brandMentioned
            ? Math.floor(Math.random() * 40) + 60
            : Math.floor(Math.random() * 20),
          sentiment,
          sentimentScore: sentiment === 'positive' ? 0.7 : sentiment === 'negative' ? -0.3 : 0.1,
          citedUrls: ['https://example.com', 'https://docs.example.com'],
          competitorMentions: [
            { name: 'Competitor A', position: Math.floor(Math.random() * 10) + 1, count: 1 },
            { name: 'Competitor B', position: Math.floor(Math.random() * 10) + 1, count: 2 },
          ],
          hasHallucination: Math.random() > 0.8,
          hallucinationFlags:
            Math.random() > 0.8
              ? [{ text: 'Sample hallucination', severity: 'medium', type: 'factual' }]
              : [],
        },
      })
    }
  }

  console.log('✅ Created monitoring results')

  // Create alert rules
  await prisma.alertRule.create({
    data: {
      brandId: brand1.id,
      userId,
      name: 'Negative Sentiment Alert',
      type: 'sentiment_drop',
      condition: { threshold: -0.5, operator: 'lt' },
      channels: ['email'],
      email: 'demo@example.com',
    },
  })

  await prisma.alertRule.create({
    data: {
      brandId: brand1.id,
      userId,
      name: 'New Brand Mention',
      type: 'mention_new',
      condition: { action: 'new_mention' },
      channels: ['email', 'webhook'],
      email: 'demo@example.com',
      webhookUrl: 'https://example.com/webhook',
    },
  })

  console.log('✅ Created alert rules')

  // Create health scores for last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    for (const brand of [brand1, brand2]) {
      await prisma.brandHealthScore.upsert({
        where: {
          brandId_date: {
            brandId: brand.id,
            date,
          },
        },
        update: {},
        create: {
          brandId: brand.id,
          userId,
          date,
          visibilityScore: Math.random() * 30 + 50,
          sentimentScore: Math.random() * 0.6 + 0.2,
          hallucinationRate: Math.random() * 0.2,
          mentionCount: Math.floor(Math.random() * 20) + 5,
          citationCount: Math.floor(Math.random() * 10) + 1,
          healthScore: Math.random() * 30 + 60,
          engineBreakdown: {
            chatgpt: Math.random() * 30 + 50,
            gemini: Math.random() * 30 + 50,
            perplexity: Math.random() * 30 + 50,
          },
        },
      })
    }
  }

  console.log('✅ Created health scores')
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
