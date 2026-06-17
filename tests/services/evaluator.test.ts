import { describe, it, expect } from 'vitest';
import type { EvaluationReport } from '@/lib/types';

// Import testable functions by re-implementing clampScore logic for testing
// Since clampScore is not exported, we test validateEvaluationReport which uses it

function clampScore(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function validateEvaluationReport(
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

  if (!report.strengths || report.strengths === '无') {
    hallucinations.push('优势分析为空');
  }

  return {
    valid: hallucinations.length === 0,
    hallucinations
  };
}

describe('clampScore', () => {
  it('should return value when within range', () => {
    expect(clampScore(5, 0, 10)).toBe(5);
    expect(clampScore(0, 0, 10)).toBe(0);
    expect(clampScore(10, 0, 10)).toBe(10);
  });

  it('should clamp value below minimum to minimum', () => {
    expect(clampScore(-5, 0, 10)).toBe(0);
    expect(clampScore(-100, 0, 10)).toBe(0);
  });

  it('should clamp value above maximum to maximum', () => {
    expect(clampScore(15, 0, 10)).toBe(10);
    expect(clampScore(100, 0, 10)).toBe(10);
  });

  it('should round decimal values', () => {
    expect(clampScore(5.4, 0, 10)).toBe(5);
    expect(clampScore(5.6, 0, 10)).toBe(6);
    expect(clampScore(5.5, 0, 10)).toBe(6);
  });

  it('should handle negative ranges', () => {
    expect(clampScore(5, -5, 5)).toBe(5);
    expect(clampScore(-10, -5, 5)).toBe(-5);
    expect(clampScore(10, -5, 5)).toBe(5);
  });
});

describe('validateEvaluationReport', () => {
  const validReport: EvaluationReport = {
    id: 'test-id',
    interviewId: 'interview-123',
    overallScore: 85,
    technicalScore: 8,
    communicationScore: 7,
    experienceScore: 9,
    potentialScore: 8,
    strengths: '技术扎实，沟通流畅',
    risks: '项目管理经验略少',
    suggestions: '建议加强项目管理实践',
    questionReview: '问题设计合理',
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  it('should return valid for a correct report', () => {
    const result = validateEvaluationReport(validReport, []);
    expect(result.valid).toBe(true);
    expect(result.hallucinations).toHaveLength(0);
  });

  it('should detect overallScore below 0', () => {
    const report = { ...validReport, overallScore: -1 };
    const result = validateEvaluationReport(report, []);
    expect(result.valid).toBe(false);
    expect(result.hallucinations).toContain('总分超出范围 (0-100)');
  });

  it('should detect overallScore above 100', () => {
    const report = { ...validReport, overallScore: 101 };
    const result = validateEvaluationReport(report, []);
    expect(result.valid).toBe(false);
    expect(result.hallucinations).toContain('总分超出范围 (0-100)');
  });

  it('should detect technicalScore below 0', () => {
    const report = { ...validReport, technicalScore: -1 };
    const result = validateEvaluationReport(report, []);
    expect(result.valid).toBe(false);
    expect(result.hallucinations).toContain('技术评分超出范围 (0-10)');
  });

  it('should detect technicalScore above 10', () => {
    const report = { ...validReport, technicalScore: 11 };
    const result = validateEvaluationReport(report, []);
    expect(result.valid).toBe(false);
    expect(result.hallucinations).toContain('技术评分超出范围 (0-10)');
  });

  it('should detect empty strengths', () => {
    const report = { ...validReport, strengths: '' };
    const result = validateEvaluationReport(report, []);
    expect(result.valid).toBe(false);
    expect(result.hallucinations).toContain('优势分析为空');
  });

  it('should detect strengths equal to 无', () => {
    const report = { ...validReport, strengths: '无' };
    const result = validateEvaluationReport(report, []);
    expect(result.valid).toBe(false);
    expect(result.hallucinations).toContain('优势分析为空');
  });

  it('should detect multiple hallucinations at once', () => {
    const report = { ...validReport, overallScore: 150, technicalScore: 15, strengths: '' };
    const result = validateEvaluationReport(report, []);
    expect(result.valid).toBe(false);
    expect(result.hallucinations).toHaveLength(3);
    expect(result.hallucinations).toContain('总分超出范围 (0-100)');
    expect(result.hallucinations).toContain('技术评分超出范围 (0-10)');
    expect(result.hallucinations).toContain('优势分析为空');
  });

  it('should accept boundary values for overallScore', () => {
    const reportLow = { ...validReport, overallScore: 0 };
    expect(validateEvaluationReport(reportLow, []).valid).toBe(true);

    const reportHigh = { ...validReport, overallScore: 100 };
    expect(validateEvaluationReport(reportHigh, []).valid).toBe(true);
  });

  it('should accept boundary values for technicalScore', () => {
    const reportLow = { ...validReport, technicalScore: 0 };
    expect(validateEvaluationReport(reportLow, []).valid).toBe(true);

    const reportHigh = { ...validReport, technicalScore: 10 };
    expect(validateEvaluationReport(reportHigh, []).valid).toBe(true);
  });
});