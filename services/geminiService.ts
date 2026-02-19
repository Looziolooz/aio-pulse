
import { GoogleGenAI, Type } from "@google/genai";

// Always initialize the client using a named parameter and obtain the API key exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Provides technical context for different AI search engines.
 */
const getEngineSpecificInstructions = (engine: string) => {
  switch (engine.toLowerCase()) {
    case 'chatgpt':
      return `
        - SEARCHGPT / GPT-4o FOCUS: Prioritize content that provides direct, verifiable answers. 
        - Look for "Citation Readiness": clear headings, bulleted lists, and authoritative summaries.
        - Evaluate if the language is concise and avoids "fluff" that might dilute the attention mechanism.
      `;
    case 'gemini':
      return `
        - GOOGLE SGE / GEMINI FOCUS: Align with E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).
        - Evaluate "Entity Salience": identify specific industry entities (people, places, brands) and how well they are connected.
        - Check for structure that supports Google's Knowledge Graph ingestion.
      `;
    case 'perplexity':
      return `
        - PERPLEXITY FOCUS: This is a fact-first answer engine. 
        - Score content based on "Fact Density": the number of verifiable data points per paragraph.
        - Analyze potential for citation by looking for data-backed claims and neutral, objective language.
      `;
    case 'claude':
      return `
        - ANTHROPIC CLAUDE FOCUS: Prioritize reasoning, nuance, and logical flow.
        - Evaluate for "Neutral Point of View": Claude's safety and helpfulness layers prefer unbiased, deeply explained concepts over marketing speak.
        - Analyze the depth of logical arguments provided.
      `;
    default:
      return `
        - UNIVERSAL AIO FOCUS: Focus on clarity, directness, and factual integrity. 
        - Ensure high "Signal-to-Noise" ratio to maximize visibility across all generative engines.
      `;
  }
};

/**
 * Sets the "Persona" for the evaluator model.
 */
const getModelPersona = (modelId: string) => {
  switch (modelId) {
    case 'gpt-4o':
      return "You are simulating the GPT-4o evaluator. You value helpfulness, safety, and content that can be distilled into clear, cited summaries.";
    case 'gemini-3-pro-preview':
      return "You are simulating the Gemini 3 Pro evaluator. You prioritize the Knowledge Graph, authoritative entities, and factual depth.";
    case 'claude-3-5-sonnet':
      return "You are simulating the Claude 3.5 Sonnet evaluator. You value nuance, logic, and strictly neutral, objective information.";
    case 'perplexity-sonar':
      return "You are simulating the Perplexity Sonar evaluator. You function as an answer engine prioritizing real-time data, citations, and high fact-density.";
    default:
      return "You are a world-class AIO (AI Optimization) specialist, providing a balanced audit across all major generative engines.";
  }
};

/**
 * Fetch generic dashboard metrics based on current AI search trends.
 */
export const getDashboardData = async (): Promise<any> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Generate a comprehensive AIO dashboard dataset representing a high-performing digital property in the current AI Search landscape.",
    config: {
      systemInstruction: "Generate a JSON response for an AIO Dashboard. Include stats for Visibility, Citations, Authority, Rank, and a 7-month growth chart. Colors for engineStats should be hex codes.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visibility: { type: Type.STRING },
          visibilityChange: { type: Type.NUMBER },
          citations: { type: Type.STRING },
          citationsChange: { type: Type.NUMBER },
          authority: { type: Type.NUMBER },
          authorityChange: { type: Type.NUMBER },
          rank: { type: Type.STRING },
          rankChange: { type: Type.NUMBER },
          growthChart: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                visibility: { type: Type.NUMBER },
                citations: { type: Type.NUMBER }
              }
            }
          },
          engineStats: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                score: { type: Type.NUMBER },
                color: { type: Type.STRING }
              }
            }
          },
          latestInsights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                text: { type: Type.STRING }
              }
            }
          }
        },
        required: ["visibility", "visibilityChange", "citations", "citationsChange", "authority", "authorityChange", "rank", "rankChange", "growthChart", "engineStats", "latestInsights"]
      }
    }
  });
  return JSON.parse(response.text);
};

/**
 * Generate real-time health data for major AI search engines.
 */
export const getMonitorData = async (): Promise<any> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Simulate a real-time monitor report for ChatGPT, Gemini, Perplexity, and Claude search engines.",
    config: {
      systemInstruction: "Generate a JSON monitor report. Include latency, freshness, and operational status. Provide 20 data points for performance sparklines (values 0-100).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          engines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                status: { type: Type.STRING },
                latency: { type: Type.STRING },
                freshness: { type: Type.STRING },
                color: { type: Type.STRING },
                performanceData: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { value: { type: Type.NUMBER } }
                  }
                }
              }
            }
          },
          logs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                time: { type: Type.STRING },
                event: { type: Type.STRING },
                engine: { type: Type.STRING },
                detail: { type: Type.STRING }
              }
            }
          },
          cpuUsage: { type: Type.NUMBER },
          successRate: { type: Type.NUMBER },
          maintenanceAlert: { type: Type.STRING }
        },
        required: ["engines", "logs", "cpuUsage", "successRate", "maintenanceAlert"]
      }
    }
  });
  return JSON.parse(response.text);
};

/**
 * Deep analytics data generation.
 */
export const getAnalyticsData = async (): Promise<any> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: "Generate deep-dive analytics for a website optimized for AIO/GEO. Compare traditional search vs AI search visibility.",
    config: {
      systemInstruction: "Generate a JSON analytics dataset. Include visibilityTrend (past 6 months), intent distribution, and top keyword clusters with volume and rank.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visibilityTrend: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                desktop: { type: Type.NUMBER },
                mobile: { type: Type.NUMBER },
                ai: { type: Type.NUMBER }
              }
            }
          },
          distribution: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
                color: { type: Type.STRING }
              }
            }
          },
          keywords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rank: { type: Type.NUMBER },
                volume: { type: Type.STRING },
                impact: { type: Type.NUMBER }
              }
            }
          }
        },
        required: ["visibilityTrend", "distribution", "keywords"]
      }
    }
  });
  return JSON.parse(response.text);
};

/**
 * Scrapes and cleans web content.
 */
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const noiseSelectors = ['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe', 'noscript'];
    noiseSelectors.forEach(selector => doc.querySelectorAll(selector).forEach(el => el.remove()));
    return (doc.body.innerText || doc.body.textContent || "").replace(/\s+/g, ' ').trim();
  } catch (error) {
    throw new Error("CORS limit reached or invalid URL. Please use text mode or a proxy.");
  }
}

/**
 * Tailors the AIO audit based on the target engine and model.
 */
export const analyzeContentForAIO = async (input: string, type: 'url' | 'text', engine: string = 'all', targetModel: string = 'default') => {
  let contentToAnalyze = input;
  if (type === 'url') contentToAnalyze = await fetchUrlContent(input);

  const engineContext = getEngineSpecificInstructions(engine);
  const persona = getModelPersona(targetModel);

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview", 
    contents: `
      PERSONA: ${persona}
      TARGET SEARCH CONTEXT: ${engine.toUpperCase()}
      ENGINE CONTEXT: ${engineContext}

      CONTENT TO ANALYZE: 
      ${contentToAnalyze.substring(0, 15000)}
    `,
    config: {
      systemInstruction: "Perform a deep AIO (AI Optimization) audit. Identify the search intent, content type, tone (e.g., Formal, Informal, Humorous, Serious, Authoritative), tone confidence score (0-100), reading level, and specific target audience. Provide keyword impact and difficulty scores. Return valid JSON only.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          visibilityScore: { type: Type.NUMBER },
          intent: { type: Type.STRING },
          intentConfidence: { type: Type.NUMBER },
          intentSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
          contentType: { type: Type.STRING },
          contentTypeConfidence: { type: Type.NUMBER },
          tone: { type: Type.STRING },
          toneConfidence: { type: Type.NUMBER },
          readingLevel: { type: Type.STRING },
          audience: { type: Type.STRING },
          engineBreakdown: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { 
                engine: { type: Type.STRING }, 
                score: { type: Type.NUMBER }, 
                status: { type: Type.STRING }, 
                details: { type: Type.STRING } 
              } 
            } 
          },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywords: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { 
                word: { type: Type.STRING }, 
                impact: { type: Type.NUMBER }, 
                difficulty: { type: Type.NUMBER } 
              } 
            } 
          }
        },
        required: ["summary", "visibilityScore", "intent", "intentConfidence", "intentSignals", "contentType", "contentTypeConfidence", "tone", "toneConfidence", "readingLevel", "audience", "engineBreakdown", "suggestions", "keywords"]
      }
    }
  });

  return { ...JSON.parse(response.text), source: input, type, analyzedText: contentToAnalyze };
};
