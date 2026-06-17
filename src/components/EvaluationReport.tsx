'use client';

import { useState, useEffect } from 'react';
import type { EvaluationReport as EvaluationReportType } from '@/lib/types';

interface EvaluationReportProps {
  interviewId: string;
}

export default function EvaluationReport({ interviewId }: EvaluationReportProps) {
  const [report, setReport] = useState<EvaluationReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/interview/${interviewId}/evaluation`)
      .then(res => {
        if (!res.ok) throw new Error('Evaluation not found');
        return res.json();
      })
      .then((data: EvaluationReportType) => {
        setReport(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load evaluation');
        setLoading(false);
      });
  }, [interviewId]);

  if (loading) return <div className="card">加载中...</div>;
  if (error) return <div className="card" style={{ color: 'red' }}>{error}</div>;
  if (!report) return <div className="card">暂无评估报告</div>;

  const scoreColor = (score: number, max: number = 100) => {
    const ratio = score / max;
    if (ratio >= 0.7) return '#4caf50';
    if (ratio >= 0.4) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>面试评估报告</h2>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            color: scoreColor(report.overallScore)
          }}
        >
          {report.overallScore}
        </div>
        <div style={{ color: '#666' }}>岗位匹配度评分</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '技术能力', score: report.technicalScore },
          { label: '沟通表达', score: report.communicationScore },
          { label: '项目经验', score: report.experienceScore },
          { label: '发展潜力', score: report.potentialScore }
        ].map(dim => (
          <div key={dim.label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: scoreColor(dim.score, 10) }}>
              {dim.score}/10
            </div>
            <div style={{ color: '#666' }}>{dim.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#4caf50', marginBottom: '8px' }}>优势分析</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{report.strengths}</p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#f44336', marginBottom: '8px' }}>潜在风险点</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{report.risks}</p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#2196f3', marginBottom: '8px' }}>下一轮建议</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{report.suggestions}</p>
      </div>

      <div>
        <h3 style={{ marginBottom: '8px' }}>面试问题回顾</h3>
        <pre style={{
          background: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'inherit'
        }}>
          {report.questionReview}
        </pre>
      </div>
    </div>
  );
}
