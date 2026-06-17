import { generateEvaluation } from './agent';
import { saveEvaluation, getEvaluation, updateInterviewStatus } from './database';
import { extractJSON } from './parser';
import type { EvaluationReport } from '@/lib/types';

interface EvaluationContext {
  interviewId: string;
  jobTitle: string;
  candidateName: string;
  resumeSummary: string;
}

// Generate and save evaluation report
export async function createEvaluationReport(context: EvaluationContext): Promise<EvaluationReport> {
  const rawEvaluation = await generateEvaluation(context);
  const jsonStr = extractJSON(rawEvaluation);

  try {
    const parsed = JSON.parse(jsonStr) as Partial<EvaluationReport>;

    const report: Omit<EvaluationReport, 'id' | 'createdAt'> = {
      interviewId: context.interviewId,
      overallScore: clampScore(parsed.overallScore || 0, 0, 100),
      technicalScore: clampScore(parsed.technicalScore || 0, 0, 10),
      communicationScore: clampScore(parsed.communicationScore || 0, 0, 10),
      experienceScore: clampScore(parsed.experienceScore || 0, 0, 10),
      potentialScore: clampScore(parsed.potentialScore || 0, 0, 10),
      strengths: parsed.strengths || '无',
      risks: parsed.risks || '无',
      suggestions: parsed.suggestions || '待定',
      questionReview: parsed.questionReview || '无'
    };

    const saved = saveEvaluation(report);
    updateInterviewStatus(context.interviewId, 'completed');

    return saved;
  } catch (error) {
    console.error('Failed to parse evaluation JSON:', jsonStr);
    const placeholder: Omit<EvaluationReport, 'id' | 'createdAt'> = {
      interviewId: context.interviewId,
      overallScore: 0,
      technicalScore: 0,
      communicationScore: 0,
      experienceScore: 0,
      potentialScore: 0,
      strengths: '评估生成失败',
      risks: '评估生成失败',
      suggestions: '评估生成失败',
      questionReview: '评估生成失败'
    };

    return saveEvaluation(placeholder);
  }
}

export function clampScore(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function getInterviewEvaluation(interviewId: string): EvaluationReport | null {
  return getEvaluation(interviewId);
}

export function validateEvaluationReport(
  report: EvaluationReport,
  conversationHistory: string[]
): { valid: boolean; hallucinations: string[] } {
  const hallucinations: string[] = [];

  if (report.overallScore < 0 || report.overallScore > 100) {
    hallucinations.push('总分超出范围 (0-100)');
  }

  if (report.technicalScore < 0 || report.technicalScore > 10) {
    hallucinations.push('技术评分超出范围 (0-10)');
  }

  if (report.communicationScore < 0 || report.communicationScore > 10) {
    hallucinations.push('沟通评分超出范围 (0-10)');
  }

  if (report.experienceScore < 0 || report.experienceScore > 10) {
    hallucinations.push('经验评分超出范围 (0-10)');
  }

  if (report.potentialScore < 0 || report.potentialScore > 10) {
    hallucinations.push('潜力评分超出范围 (0-10)');
  }

  if (!report.strengths || report.strengths === '无') {
    hallucinations.push('优势分析为空');
  }

  return {
    valid: hallucinations.length === 0,
    hallucinations
  };
}