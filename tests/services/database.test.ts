import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-12345'
}));

// Mock the db module
const mockDbInstance = {
  prepare: vi.fn(),
  exec: vi.fn(),
  pragma: vi.fn(),
  close: vi.fn(),
  transaction: vi.fn((fn: () => void) => () => fn())
};

vi.mock('@/lib/db', () => ({
  getDb: () => mockDbInstance,
  closeDb: vi.fn()
}));

// Import after mocking
import { createInterview, getInterview, updateInterviewStatus, addMessage, getMessages, saveEvaluation, getEvaluation } from '@/services/database';

describe('database service', () => {
  let mockPrepare: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPrepare = vi.fn();
    mockDbInstance.prepare.mockReturnValue({
      run: vi.fn().mockReturnThis(),
      get: vi.fn(),
      all: vi.fn()
    } as unknown as ReturnType<typeof mockDbInstance.prepare>);
    // Reset transaction mock implementation before each test
    mockDbInstance.transaction.mockImplementation((fn: () => void) => () => fn());
  });

  describe('createInterview', () => {
    it('should create an interview and return it', () => {
      const data = {
        jobTitle: 'Software Engineer',
        jobRequirements: '3+ years exp',
        candidateName: 'John Doe',
        resumeContent: 'Experienced developer',
        interviewerStyle: 'professional'
      };

      const result = createInterview(data);

      expect(result).toMatchObject({
        id: 'test-uuid-12345',
        jobTitle: data.jobTitle,
        jobRequirements: data.jobRequirements,
        candidateName: data.candidateName,
        resumeContent: data.resumeContent,
        interviewerStyle: 'professional',
        status: 'active'
      });
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBeTruthy();
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO interviews'));
    });
  });

  describe('getInterview', () => {
    it('should return interview when found', () => {
      const mockRow = {
        id: 'test-id',
        job_title: 'Engineer',
        job_requirements: 'req',
        candidate_name: 'Jane',
        resume_content: 'resume text',
        interviewer_style: 'friendly',
        status: 'active',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      };

      mockDbInstance.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(mockRow)
      } as unknown as ReturnType<typeof mockDbInstance.prepare>);

      const result = getInterview('test-id');

      expect(result).toMatchObject({
        id: 'test-id',
        jobTitle: 'Engineer',
        jobRequirements: 'req',
        candidateName: 'Jane',
        resumeContent: 'resume text',
        interviewerStyle: 'friendly',
        status: 'active'
      });
    });

    it('should return null when interview not found', () => {
      mockDbInstance.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      } as unknown as ReturnType<typeof mockDbInstance.prepare>);

      const result = getInterview('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateInterviewStatus', () => {
    it('should update interview status', () => {
      mockDbInstance.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 1 })
      } as unknown as ReturnType<typeof mockDbInstance.prepare>);

      updateInterviewStatus('test-id', 'completed');

      expect(mockDbInstance.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE interviews SET status'));
    });
  });

  describe('addMessage', () => {
    it('should add a message and update interview timestamp', () => {
      const data = {
        interviewId: 'interview-123',
        role: 'user' as const,
        content: 'Hello'
      };

      mockDbInstance.prepare.mockReturnValue({
        run: vi.fn(),
        all: vi.fn()
      } as unknown as ReturnType<typeof mockDbInstance.prepare>);

      const result = addMessage(data);

      expect(result).toMatchObject({
        id: 'test-uuid-12345',
        interviewId: data.interviewId,
        role: 'user',
        content: 'Hello'
      });
      expect(result.createdAt).toBeTruthy();
    });
  });

  describe('getMessages', () => {
    it('should return messages ordered by created_at', () => {
      const mockRows = [
        { id: 'msg1', interview_id: 'int1', role: 'user', content: 'Hi', created_at: '2026-01-01T00:00:00.000Z' },
        { id: 'msg2', interview_id: 'int1', role: 'assistant', content: 'Hello', created_at: '2026-01-01T00:00:01.000Z' }
      ];

      mockDbInstance.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockRows)
      } as unknown as ReturnType<typeof mockDbInstance.prepare>);

      const result = getMessages('int1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ role: 'user', content: 'Hi' });
      expect(result[1]).toMatchObject({ role: 'assistant', content: 'Hello' });
    });

    it('should return empty array when no messages', () => {
      mockDbInstance.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue([])
      } as unknown as ReturnType<typeof mockDbInstance.prepare>);

      const result = getMessages('int1');

      expect(result).toHaveLength(0);
    });
  });

  describe('saveEvaluation', () => {
    it('should save evaluation and return it', () => {
      const report = {
        interviewId: 'int1',
        overallScore: 8,
        technicalScore: 7,
        communicationScore: 9,
        experienceScore: 8,
        potentialScore: 7,
        strengths: 'Good communication',
        risks: 'Limited experience',
        suggestions: 'More projects',
        questionReview: 'Good questions'
      };

      const result = saveEvaluation(report);

      expect(result).toMatchObject({
        id: 'test-uuid-12345',
        ...report,
        createdAt: expect.any(String)
      });
      expect(mockDbInstance.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO evaluations'));
    });
  });

  describe('getEvaluation', () => {
    it('should return evaluation when found', () => {
      const mockRow = {
        id: 'eval1',
        interview_id: 'int1',
        overall_score: 8,
        technical_score: 7,
        communication_score: 9,
        experience_score: 8,
        potential_score: 7,
        strengths: 'Strong',
        risks: 'None',
        suggestions: 'Keep learning',
        question_review: 'Good',
        created_at: '2026-01-01T00:00:00.000Z'
      };

      mockDbInstance.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(mockRow)
      } as unknown as ReturnType<typeof mockDbInstance.prepare>);

      const result = getEvaluation('int1');

      expect(result).toMatchObject({
        id: 'eval1',
        interviewId: 'int1',
        overallScore: 8,
        technicalScore: 7
      });
    });

    it('should return null when evaluation not found', () => {
      mockDbInstance.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      } as unknown as ReturnType<typeof mockDbInstance.prepare>);

      const result = getEvaluation('non-existent');

      expect(result).toBeNull();
    });
  });
});