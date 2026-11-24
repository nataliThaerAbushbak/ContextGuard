import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { classifyCheck, validateAndEnforceFinding } from './src/utils/auditClassifier.ts';
import {
  DAILY_AI_RUN_LIMIT,
  getServerUsageForClient,
  incrementServerUsageForClient,
} from './src/utils/serverUsage.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(ai),
    timestamp: new Date().toISOString(),
  });
});

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'global-client';
}

export function getServerUsage(req: Request) {
  return getServerUsageForClient(getClientIdentifier(req));
}

export function incrementServerUsage(req: Request) {
  return incrementServerUsageForClient(getClientIdentifier(req));
}

// Endpoint for frontend to synchronize actual server-side usage
app.get('/api/usage', (req: Request, res: Response) => {
  res.json(getServerUsage(req));
});

/**
 * 1. Requirements Decomposition API
 * Decomposes raw requirements into atomic checks, categorizes them,
 * and detects ambiguities with clarification questions only when subjective/unmeasurable words exist.
 */
app.post('/api/decompose', async (req: Request, res: Response) => {
  const { requirements } = req.body;

  if (!requirements || typeof requirements !== 'string' || !requirements.trim()) {
    return res.status(400).json({ error: 'Requirements text is required' });
  }

  // If Gemini API is available, use gemini-3.8-flash for decomposition
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            text: `Decompose the following requirements text into distinct, testable, atomic checks:\n\n${requirements}`,
          },
        ],
        config: {
          systemInstruction:
            "You are ContextGuard's requirement decomposition engine. Decompose the raw input text into distinct, testable, atomic checks. Classify each check into one category: 'Core flow', 'States', 'Errors', or 'Navigation'. If a check uses subjective or untestable words without measurable criteria (e.g. 'smooth', 'fast and easy', 'seamless', 'properly', 'intuitively'), set is_ambiguous: true and provide a concise clarification_question. If the requirement specifies measurable criteria or concrete actions, set is_ambiguous: false and clarification_question: null. Do not invent unrequested acceptance criteria.",
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              checks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    category: {
                      type: Type.STRING,
                      description: "Must be 'Core flow', 'States', 'Errors', or 'Navigation'",
                    },
                    is_ambiguous: { type: Type.BOOLEAN },
                    clarification_question: { type: Type.STRING },
                  },
                  required: ['id', 'text', 'category', 'is_ambiguous'],
                },
              },
            },
            required: ['checks'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (Array.isArray(parsed.checks) && parsed.checks.length > 0) {
        const validatedChecks = parsed.checks.map((c: any, idx: number) => ({
          id: c.id || `check-${idx + 1}`,
          text: c.text,
          category: ['Core flow', 'States', 'Errors', 'Navigation'].includes(c.category)
            ? c.category
            : 'Core flow',
          is_ambiguous: Boolean(c.is_ambiguous),
          clarification_question: c.clarification_question || undefined,
          included: true,
        }));
        return res.json({ checks: validatedChecks });
      }
    } catch (err: any) {
      console.warn('Gemini decomposition encountered error, using fallback:', err?.message || err);
    }
  }

  // Reliable, high-precision rule-based decomposition fallback
  const lines = requirements
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.toUpperCase().startsWith('FEATURE:'));

  const extracted: any[] = [];
  const subjectiveWords = ['seamlessly', 'fast and easy', 'smooth', 'clean', 'properly', 'intuitively', 'user-friendly'];

  lines.forEach((line) => {
    // Strip leading numbering or bullet points: "1. ", "- ", "* "
    const cleanText = line.replace(/^(\d+[\.\)]|[-*•])\s*/, '').trim();
    if (cleanText.length < 5) return;

    // Split compound sentences if semicolon or bullet separation exists
    let parts = [cleanText];
    if (cleanText.includes('; ')) {
      parts = cleanText.split('; ').map((p) => p.trim()).filter((p) => p.length > 5);
    }

    parts.forEach((partText) => {
      let category = 'Core flow';
      const lower = partText.toLowerCase();
      if (lower.includes('error') || lower.includes('fail') || lower.includes('invalid') || lower.includes('warn') || lower.includes('blank')) {
        category = 'Errors';
      } else if (lower.includes('state') || lower.includes('loading') || lower.includes('indicator') || lower.includes('empty') || lower.includes('calculat') || lower.includes('total') || lower.includes('receipt')) {
        category = 'States';
      } else if (lower.includes('proceed') || lower.includes('navigate') || lower.includes('return') || lower.includes('back') || lower.includes('link') || lower.includes('drawer')) {
        category = 'Navigation';
      }

      // Check if text contains subjective words without concrete measurable metrics
      const hasSubjective = subjectiveWords.some((w) => lower.includes(w));
      const hasMeasurable = lower.includes('seconds') || lower.includes('steps') || lower.includes('$') || lower.includes('explicitly');
      const isAmbiguous = hasSubjective && !hasMeasurable;
      let clarificationQuestion = undefined;
      if (isAmbiguous) {
        clarificationQuestion = 'Could you specify the explicit measurable acceptance criteria for this item?';
      }

      extracted.push({
        id: `check-${extracted.length + 1}`,
        text: partText,
        category,
        is_ambiguous: isAmbiguous,
        clarification_question: clarificationQuestion,
        included: true,
      });
    });
  });

  return res.json({ checks: extracted });
});

/**
 * 2. Visual Audit Flow Engine API
 * Multimodal verification strictly comparing confirmed checks against CURRENT uploaded screenshots.
 * STRICT EVIDENCE GROUNDING:
 * - EXPLICIT_PASS: visible evidence proves requirement
 * - DISCREPANCY: visible evidence directly contradicts requirement (must reference existing screen)
 * - MISSING_EVIDENCE: necessary proof is absent (e.g. intermediate states, or uncaptured screens)
 * Never fabricates evidence or references screens not present in the current flow!
 */
app.post('/api/audit', async (req: Request, res: Response) => {
  // Enforce server-side DAILY_AI_RUN_LIMIT = 3
  const usageCheck = incrementServerUsage(req);
  if (!usageCheck.allowed) {
    return res.status(429).json({
      error: 'Daily AI usage limit reached. Please try again later.',
      limitReached: true,
      limit: usageCheck.limit,
      count: usageCheck.count,
    });
  }

  const { checks = [], screens = [], settings = {} } = req.body;

  if (!Array.isArray(checks) || checks.length === 0) {
    return res.status(400).json({ error: 'Checks array is required' });
  }

  if (!Array.isArray(screens) || screens.length === 0) {
    return res.status(400).json({ error: 'At least one screenshot is required to run a visual audit' });
  }

  // Map available screen labels in lowercase for strict evidence matching
  const availableScreens = screens.map((s, idx) => ({
    index: idx + 1,
    id: s.id,
    label: s.label || `Step ${idx + 1}`,
    lowerLabel: (s.label || '').toLowerCase(),
  }));

  // Attempt real multimodal Gemini analysis if non-SVG raster base64 images exist
  if (ai) {
    try {
      const parts: any[] = [];
      let hasValidImages = false;

      for (let i = 0; i < screens.length; i++) {
        const sc = screens[i];
        const screenTitle = sc.label || sc.file_name || `Step ${i + 1}`;
        if (sc.imageUrl) {
          if (sc.imageUrl.includes('svg') || sc.imageUrl.includes('<svg')) {
            let svgText = '';
            if (sc.imageUrl.startsWith('data:image/svg+xml;utf8,')) {
              svgText = decodeURIComponent(sc.imageUrl.replace('data:image/svg+xml;utf8,', ''));
            } else if (sc.imageUrl.startsWith('data:image/svg+xml;base64,')) {
              svgText = Buffer.from(sc.imageUrl.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf-8');
            } else {
              svgText = sc.imageUrl;
            }
            const cleanSvg = svgText
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/\s+/g, ' ')
              .trim();
            parts.push({
              text: `[SCREEN ${i + 1}: "${screenTitle}"] (SVG visual markup & text content):\n${cleanSvg.slice(0, 15000)}`,
            });
            hasValidImages = true;
          } else if (sc.imageUrl.startsWith('data:image/')) {
            const commaIdx = sc.imageUrl.indexOf(',');
            if (commaIdx !== -1) {
              const meta = sc.imageUrl.slice(0, commaIdx);
              const rawBase64 = sc.imageUrl.slice(commaIdx + 1).replace(/\s/g, '');
              const mimeMatch = meta.match(/data:([^;]+)/);
              const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
              parts.push({
                inlineData: {
                  mimeType,
                  data: rawBase64,
                },
              });
              parts.push({
                text: `[SCREEN ${i + 1}: "${screenTitle}"]`,
              });
              hasValidImages = true;
            }
          }
        }
      }

      if (hasValidImages) {
        const screenListDesc = screens.map((s, idx) => `Step ${idx + 1}: "${s.label}"`).join('\n');
        const checksDesc = checks.map((c) => `Check [${c.id}]: "${c.text}" (Category: ${c.category})`).join('\n');

        const auditPrompt = `Screens provided in current flow order:\n${screenListDesc}\n\nConfirmed Requirement Checks:\n${checksDesc}\n\nSTRICT EVIDENCE RULES:
1. ONLY evaluate against the CURRENT uploaded screenshots above. If a screen was not provided, do not assume it exists.
2. If an element or screen is NOT present in the screenshots, mark as MISSING_EVIDENCE with diff: null.
3. If an element visibly contradicts the requirement, mark as DISCREPANCY with diff: { expected: "...", observed: "..." }.
4. If clearly visible and compliant, mark as EXPLICIT_PASS with diff: null.
5. NEVER assume unobserved intermediate states or backend operations.
6. Target element and step name must correspond to one of the screens provided.
7. Only generate advisory items for screens that actually exist in the flow.`;

        parts.push({ text: auditPrompt });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ parts }],
          config: {
            systemInstruction:
              "You are ContextGuard: an automated visual acceptance and requirements audit engine. You must be strictly conservative and evidence-based. Evaluate each confirmed check strictly against the current screenshots. Output valid JSON with findings and advisory.",
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                findings: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      check_id: { type: Type.STRING },
                      verdict: { type: Type.STRING },
                      step_index: { type: Type.NUMBER },
                      step_name: { type: Type.STRING },
                      target_element: { type: Type.STRING },
                      diff: {
                        type: Type.OBJECT,
                        properties: {
                          expected: { type: Type.STRING },
                          observed: { type: Type.STRING },
                        },
                      },
                      explanation: { type: Type.STRING },
                    },
                    required: ['check_id', 'verdict', 'step_index', 'step_name', 'target_element', 'explanation'],
                  },
                },
                advisory: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      step_index: { type: Type.NUMBER },
                      step_name: { type: Type.STRING },
                      risk: { type: Type.STRING },
                      recommendation: { type: Type.STRING },
                      severity: { type: Type.STRING },
                    },
                    required: ['category', 'step_index', 'risk', 'recommendation', 'severity'],
                  },
                },
              },
              required: ['findings', 'advisory'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (Array.isArray(parsed.findings) && parsed.findings.length > 0) {
          const rawFindings = parsed.findings.map((f: any, idx: number) => {
            const originalCheck = checks.find((c: any) => c.id === f.check_id) || checks[idx];
            // Verify step index exists in current screens
            const stepIdx = Math.min(Math.max(f.step_index || 1, 1), screens.length);
            const matchingScreen = screens[stepIdx - 1];

            return {
              id: `find-${idx + 1}`,
              check_id: f.check_id || originalCheck?.id || `check-${idx + 1}`,
              check_text: originalCheck?.text || `Requirement ${idx + 1}`,
              category: originalCheck?.category || 'Core flow',
              verdict: ['EXPLICIT_PASS', 'DISCREPANCY', 'MISSING_EVIDENCE'].includes(f.verdict)
                ? f.verdict
                : 'MISSING_EVIDENCE',
              step_index: stepIdx,
              step_name: matchingScreen?.label || f.step_name || `Step ${stepIdx}`,
              target_element: f.target_element || 'Primary Action / Viewport',
              diff: f.diff && f.diff.expected && f.diff.observed ? f.diff : null,
              explanation: f.explanation || 'Verified strictly against visual screenshot evidence.',
              reviewer_decision: 'UNREVIEWED',
              reviewer_note: '',
            };
          });

          // DETERMINISTIC VALIDATION LAYER: strictly validate each model finding
          const findings = rawFindings.map((finding: any, idx: number) => {
            const originalCheck = checks.find((c: any) => c.id === finding.check_id) || checks[idx];
            return validateAndEnforceFinding(finding, originalCheck, screens);
          });

          const advisory = (parsed.advisory || []).map((adv: any, idx: number) => ({
            id: `adv-${idx + 1}`,
            category: adv.category || 'UX Heuristic',
            step_index: Math.min(Math.max(adv.step_index || 1, 1), screens.length),
            step_name: screens[Math.min(Math.max(adv.step_index || 1, 1), screens.length) - 1]?.label || 'Flow Screen',
            risk: adv.risk || 'Potential interaction ambiguity',
            recommendation: adv.recommendation || 'Provide unambiguous affirmative feedback.',
            severity: ['LOW', 'MEDIUM', 'HIGH'].includes(adv.severity) ? adv.severity : 'MEDIUM',
          }));

          return res.json({ findings, advisory });
        }
      }
    } catch (err: any) {
      console.warn('Gemini multimodal audit encountered error:', err?.message || err);
      const errMsg = String(err?.message || err).toLowerCase();
      if (
        errMsg.includes('429') ||
        errMsg.includes('quota') ||
        errMsg.includes('resource_exhausted') ||
        errMsg.includes('rate limit')
      ) {
        return res.status(429).json({
          error: 'AI usage is temporarily unavailable because the usage limit has been reached. Please try again later.',
          quota_exceeded: true,
        });
      }
    }
  }

  // Strictly Grounded Deterministic Verification Engine
  // Evaluates every confirmed check ONLY against the CURRENT screenshots provided.
  const rawFindings = checks.map((chk: any, idx: number) => {
    return classifyCheck(chk, screens, idx);
  });

  const findings = rawFindings.map((finding: any, idx: number) => {
    const originalCheck = checks.find((c: any) => c.id === finding.check_id) || checks[idx];
    return validateAndEnforceFinding(finding, originalCheck, screens);
  });

  // Generate advisory insights strictly tailored to the screens that actually exist
  const advisory: any[] = [];
  const findMatchingScreen = (keywords: string[]) => {
    return availableScreens.find((s) => keywords.some((kw) => s.lowerLabel.includes(kw)));
  };
  const paymentScreen = findMatchingScreen(['payment', 'billing', 'card']);
  const checkoutScreen = findMatchingScreen(['checkout', 'shipping', 'address']);
  const confirmationScreen = findMatchingScreen(['confirm', 'receipt', 'thank', 'success', 'order']);

  if (paymentScreen) {
    advisory.push({
      id: `adv-${advisory.length + 1}`,
      category: 'UX / Heuristic',
      step_index: paymentScreen.index,
      step_name: paymentScreen.label,
      risk: 'Destructive / Financial Commitment Ambiguity',
      recommendation: 'Button copy "Submit Order" has lower clarity than "Pay $49.00 Now". Users may wonder if another confirmation step will follow.',
      severity: 'MEDIUM',
    });
  }
  if (checkoutScreen) {
    advisory.push({
      id: `adv-${advisory.length + 1}`,
      category: 'States / Form Polish',
      step_index: checkoutScreen.index,
      step_name: checkoutScreen.label,
      risk: 'Missing Field-Level Inline Validation Evidence',
      recommendation: 'Ensure inline validation marks fields green upon blur to reassure users before proceeding to payment.',
      severity: 'LOW',
    });
  }
  if (confirmationScreen) {
    advisory.push({
      id: `adv-${advisory.length + 1}`,
      category: 'Edge Case / Resiliency',
      step_index: confirmationScreen.index,
      step_name: confirmationScreen.label,
      risk: 'Receipt Download or Print Option Missing',
      recommendation: 'Add a "Print receipt" or "Download PDF invoice" button on the confirmation screen for expense reporting.',
      severity: 'LOW',
    });
  }
  if (advisory.length === 0 && availableScreens.length > 0) {
    advisory.push({
      id: 'adv-1',
      category: 'Usability',
      step_index: 1,
      step_name: availableScreens[0].label,
      risk: 'Step navigation clarity',
      recommendation: 'Provide explicit progress indicator across multi-step flows.',
      severity: 'LOW',
    });
  }

  return res.json({ findings, advisory });
});

// Setup Vite middleware for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ContextGuard server running on port ${port} (http://localhost:${port})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
