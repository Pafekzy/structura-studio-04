import { GoogleGenAI } from '@google/genai';
import { AIInspectionAnalysis, ProjectEvidence } from '../../src/types';

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface RunAIInspectionParams {
  projectId: string;
  milestoneId: string;
  milestoneTitle: string;
  inspectionType: string;
  evidenceItems: ProjectEvidence[];
  contextNotes?: string;
}

export async function generateAIInspectionAnalysis(
  params: RunAIInspectionParams
): Promise<{
  status: 'COMPLETED' | 'UNAVAILABLE' | 'ANALYSIS_FAILED';
  summary: string;
  observations: string[];
  potentialIssues: string[];
  riskIndicators: string[];
  recommendations: string[];
  rawText?: string;
  errorMessage?: string;
}> {
  const ai = getAIClient();

  if (!ai) {
    return {
      status: 'UNAVAILABLE',
      summary: 'AI Inspection Service is unavailable: GEMINI_API_KEY is not configured in this environment.',
      observations: [
        'Automated visual analysis bypassed due to unconfigured AI inference service.',
        'Manual on-site physical inspection by licensed QA/QC Auditor remains mandatory.',
      ],
      potentialIssues: [
        'Automated anomaly pre-screening could not be executed.',
      ],
      riskIndicators: [
        'Unverified visual evidence requires complete human auditor verification.',
      ],
      recommendations: [
        'Perform physical rebar spacing, tie-wire tension, and concrete cylinder compressive strength tests manually.',
      ],
      errorMessage: 'GEMINI_API_KEY environment variable is not set.',
    };
  }

  try {
    const systemInstruction = `You are Structura AI, an elite Construction Structural QA/QC Specialist assisting licensed Professional and Structural Engineers (PE, SE) in reviewing on-site construction evidence.
CRITICAL GOVERNANCE MANDATES:
1. Your analysis is PRELIMINARY and ADVISORY only.
2. AI cannot certify structural safety, pass QA/QC inspections, or close Non-Conformance Reports (NCRs).
3. Licensed human professional engineering sign-off is ALWAYS required.
4. Output strict JSON with the following structure:
{
  "summary": "Concise technical summary of visual evidence against engineering specifications",
  "observations": ["Detailed observation 1", "Detailed observation 2"],
  "potentialIssues": ["Potential non-conformance or defect 1", "Potential defect 2"],
  "riskIndicators": ["High/medium risk indicator 1", "Risk indicator 2"],
  "recommendations": ["Auditor inspection check recommendation 1", "Recommendation 2"]
}`;

    const prompt = `Analyze construction evidence for project milestone:
Milestone: "${params.milestoneTitle}" (Discipline: ${params.inspectionType})
Context notes: "${params.contextNotes || 'Standard milestone evidence verification'}"
Evidence registered:
${params.evidenceItems.map((e, idx) => `[${idx + 1}] Title: ${e.title}, Type: ${e.evidenceType}, Storage Ref: ${e.storageReference}, Description: ${e.description}`).join('\n')}

Evaluate adherence to standard structural engineering specifications (ACI 318, Eurocode 2, AISC 360). Identify any potential non-conformances, rebar cover discrepancies, curing defects, or honeycombing risks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    if (!text) {
      throw new Error('Empty response received from Gemini API');
    }

    try {
      const parsed = JSON.parse(text);
      return {
        status: 'COMPLETED',
        summary: parsed.summary || 'Preliminary visual analysis completed.',
        observations: Array.isArray(parsed.observations) ? parsed.observations : ['Visual evidence processed.'],
        potentialIssues: Array.isArray(parsed.potentialIssues) ? parsed.potentialIssues : [],
        riskIndicators: Array.isArray(parsed.riskIndicators) ? parsed.riskIndicators : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Conduct physical verification.'],
        rawText: text,
      };
    } catch {
      return {
        status: 'COMPLETED',
        summary: 'Preliminary visual analysis completed with non-structured output.',
        observations: [text.slice(0, 300)],
        potentialIssues: [],
        riskIndicators: [],
        recommendations: ['Licensed Auditor physical inspection required.'],
        rawText: text,
      };
    }
  } catch (err: any) {
    console.warn('[AIInspectionService] Gemini analysis failed:', err);
    return {
      status: 'ANALYSIS_FAILED',
      summary: 'Automated AI visual inspection analysis failed during model execution.',
      observations: [
        'AI inference service returned an error or timed out.',
        'Human professional review is required to inspect evidence.',
      ],
      potentialIssues: [
        'Automated screening unavailable.',
      ],
      riskIndicators: [
        'Requires direct auditor review.',
      ],
      recommendations: [
        'Audit evidence manually and record physical site measurements.',
      ],
      errorMessage: err?.message || 'Model execution error',
    };
  }
}
