import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '1mb' }));

// Initialize Google GenAI SDK if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

// Portfolio Knowledge Base for grounded AI responses
const PORTFOLIO_CONTEXT = `
You are the AI Engineering Assistant for Garv Shaw's developer portfolio and engineering lab.
Garv Shaw is an AI & Cloud Developer and B.Tech Computer Science & Engineering student.
His focus areas:
1. Artificial Intelligence: LLM orchestration, RAG pipelines, autonomous agents, neural networks, PyTorch, LangChain, semantic search.
2. Cloud Computing & Infrastructure: AWS, Google Cloud Platform, Docker, Kubernetes, Serverless functions, Terraform, CI/CD, microservices.
3. Software Engineering: React 19, TypeScript, Next.js, Node.js, FastAPI, low-latency C systems, WebSockets.
4. Business & Quantitative Finance: Algorithmic trading mechanics, order book microstructure, financial literacy platforms.

Key Projects:
- StockMentor: High-frequency quantitative trading dashboard paired with an interactive AI Socratic market literacy learning path. Tech: Next.js, WebSockets, Tailwind, Gemini API. Live: https://stock-mentor-virid.vercel.app/
- MicroSkill: Science-backed micro-learning platform with spaced repetition algorithms and coding simulations. Tech: React, TypeScript, Cloud Functions. Live: https://microskillversion-10.vercel.app/
- Typing Speed Check: Futuristic keystroke velocity engine calculating live WPM, accuracy heatmaps, and error diagnostics. Tech: JavaScript, WPM Engine, Vite. Live: https://typing-speed-testing-kappa.vercel.app/
- SalaryOS: Personal finance and compensation intelligence suite with predictive modeling and budget analytics. Tech: Next.js, TypeScript, Tailwind. Live: https://salaryos-one.vercel.app/
- ArogyaSeva (Currently Building): Realtime healthcare platform featuring automated clinical triage AI agents, encrypted WebRTC tele-consultations, and edge cloud routing.

Socials & Contact:
- GitHub: https://github.com/garvshaw89-glitch
- LinkedIn: https://linkedin.com/in/garv-shaw-08a33237b
- Email: garvshawinfo@gmail.com

Instructions:
- Answer questions accurately, concisely, and technically based on Garv's actual portfolio.
- Highlight Garv's engineering methodology, architecture choices, and problem-solving mindset.
- If asked about contact or collaboration, invite them to use the Contact section or email garvshawinfo@gmail.com.
- Keep responses friendly, technical, and under 150 words.
`;

// In-memory rate-limiter: simple sliding window per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  entry.count += 1;
  return true;
};

// Fallback intelligent response generator if Gemini key is unset or rate limited
const generatePortfolioFallback = (query: string): string => {
  const q = query.toLowerCase();
  if (q.includes('ai') || q.includes('model') || q.includes('llm') || q.includes('agent')) {
    return "Garv specializes in AI engineering across LLM orchestration, RAG knowledge systems, and autonomous agent workflows. In StockMentor, he built an interactive Socratic AI tutor for market literacy. He is currently developing intelligent clinical triage agents for ArogyaSeva.";
  }
  if (q.includes('cloud') || q.includes('aws') || q.includes('gcp') || q.includes('docker') || q.includes('kubernetes')) {
    return "Garv architects resilient cloud-native systems leveraging AWS (Lambda, ECS, S3), Google Cloud Platform (Cloud Run, Vertex AI), containerization with Docker, and automated CI/CD deployment pipelines on Vercel and Cloudflare.";
  }
  if (q.includes('project') || q.includes('stockmentor') || q.includes('salaryos') || q.includes('microskill') || q.includes('arogyaseva')) {
    return "Garv's flagship projects include StockMentor (AI trading & Socratic learning), SalaryOS (enterprise compensation & personal finance intelligence), MicroSkill (spaced repetition EdTech arcade), Typing Speed Check (real-time WPM engine), and ArogyaSeva (realtime AI healthcare).";
  }
  if (q.includes('contact') || q.includes('hire') || q.includes('email') || q.includes('connect')) {
    return "You can reach Garv directly at garvshawinfo@gmail.com, connect via LinkedIn at linkedin.com/in/garv-shaw-08a33237b, or check out his active repositories at github.com/garvshaw89-glitch.";
  }
  return "Garv Shaw is an AI & Cloud Developer bridging machine learning, scalable cloud infrastructure, and modern web applications. Feel free to explore his projects below or test the RAG experiment in the AI Lab!";
};

// API: AI Assistant Route
app.post('/api/ai-chat', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait a moment before sending another query.',
        answer: 'Rate limit reached. Please try asking again in a minute.',
      });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Valid prompt string is required.' });
    }

    const sanitizedPrompt = prompt.slice(0, 500).trim();

    // If Gemini client is available, call Gemini 3.8 Flash
    if (aiClient) {
      try {
        const aiResponse = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: sanitizedPrompt,
          config: {
            systemInstruction: PORTFOLIO_CONTEXT,
            maxOutputTokens: 600,
            temperature: 0.35,
          },
        });

        const text = aiResponse.text?.trim() || generatePortfolioFallback(sanitizedPrompt);
        return res.json({ answer: text, model: 'gemini-3.8-flash', status: 'live' });
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to local reasoning:', geminiError?.message);
        const fallbackText = generatePortfolioFallback(sanitizedPrompt);
        return res.json({ answer: fallbackText, model: 'embedded-knowledge-base', status: 'fallback' });
      }
    }

    // Default fallback
    const fallbackText = generatePortfolioFallback(sanitizedPrompt);
    return res.json({ answer: fallbackText, model: 'embedded-knowledge-base', status: 'fallback' });
  } catch (error: any) {
    console.error('Server error handling /api/ai-chat:', error);
    return res.status(500).json({ error: 'Internal server error processing AI query.' });
  }
});

// API: System Telemetry Route
app.get('/api/telemetry', (_req: Request, res: Response) => {
  res.json({
    system: 'Garv Shaw Engineering Portfolio System',
    status: 'OPERATIONAL',
    nodeEnv: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      frontend: 'HEALTHY',
      apiProxy: 'HEALTHY',
      aiGateway: aiClient ? 'ACTIVE' : 'FALLBACK_READY',
      cdn: 'VERCEL_EDGE',
    },
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port} (mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
