import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { Interview, Message, EvaluationReport } from '@/lib/types';

export function createInterview(data: {
  jobTitle: string;
  jobRequirements: string;
  candidateName: string;
  resumeContent: string;
  resumeSummary: string;
  interviewerStyle: string;
}): Interview {
  if (!data.jobTitle || !data.candidateName || !data.resumeContent) {
    throw new Error('Missing required fields: jobTitle, candidateName, resumeContent');
  }

  const validStyles = ['strict', 'friendly', 'professional'];
  if (!validStyles.includes(data.interviewerStyle)) {
    throw new Error(`Invalid interviewerStyle: ${data.interviewerStyle}. Must be one of: ${validStyles.join(', ')}`);
  }

  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO interviews (id, job_title, job_requirements, candidate_name, resume_content, resume_summary_formatted, interviewer_style, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(id, data.jobTitle, data.jobRequirements, data.candidateName, data.resumeContent, data.resumeSummary, data.interviewerStyle, now, now);

  return {
    id,
    jobTitle: data.jobTitle,
    jobRequirements: data.jobRequirements,
    candidateName: data.candidateName,
    resumeContent: data.resumeContent,
    resumeSummary: data.resumeSummary,
    interviewerStyle: data.interviewerStyle as Interview['interviewerStyle'],
    status: 'active',
    createdAt: now,
    updatedAt: now
  };
}

export function getInterview(id: string): Interview | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM interviews WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    id: row.id as string,
    jobTitle: row.job_title as string,
    jobRequirements: row.job_requirements as string,
    candidateName: row.candidate_name as string,
    resumeContent: row.resume_content as string,
    resumeSummary: row.resume_summary_formatted as string,
    interviewerStyle: row.interviewer_style as Interview['interviewerStyle'],
    status: row.status as Interview['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  };
}

export function updateInterviewStatus(id: string, status: 'active' | 'completed'): void {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare('UPDATE interviews SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
  if (result.changes === 0) {
    throw new Error(`Interview not found: ${id}`);
  }
}

export function addMessage(data: { interviewId: string; role: 'user' | 'assistant'; content: string }): Message {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  const insertMessage = db.prepare(`
    INSERT INTO messages (id, interview_id, role, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const updateInterview = db.prepare('UPDATE interviews SET updated_at = ? WHERE id = ?');

  db.transaction(() => {
    insertMessage.run(id, data.interviewId, data.role, data.content, now);
    updateInterview.run(now, data.interviewId);
  })();

  return {
    id,
    interviewId: data.interviewId,
    role: data.role,
    content: data.content,
    createdAt: now
  };
}

export function getMessages(interviewId: string): Message[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC').all(interviewId) as Record<string, unknown>[];

  return rows.map(row => ({
    id: row.id as string,
    interviewId: row.interview_id as string,
    role: row.role as 'user' | 'assistant',
    content: row.content as string,
    createdAt: row.created_at as string
  }));
}

export function saveEvaluation(report: Omit<EvaluationReport, 'id' | 'createdAt'>): EvaluationReport {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO evaluations (id, interview_id, overall_score, technical_score, communication_score, experience_score, potential_score, strengths, risks, suggestions, question_review, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, report.interviewId, report.overallScore, report.technicalScore, report.communicationScore, report.experienceScore, report.potentialScore, report.strengths, report.risks, report.suggestions, report.questionReview, now);

  return { id, ...report, createdAt: now };
}

export function getEvaluation(interviewId: string): EvaluationReport | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM evaluations WHERE interview_id = ?').get(interviewId) as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    id: row.id as string,
    interviewId: row.interview_id as string,
    overallScore: row.overall_score as number,
    technicalScore: row.technical_score as number,
    communicationScore: row.communication_score as number,
    experienceScore: row.experience_score as number,
    potentialScore: row.potential_score as number,
    strengths: row.strengths as string,
    risks: row.risks as string,
    suggestions: row.suggestions as string,
    questionReview: row.question_review as string,
    createdAt: row.created_at as string
  };
}