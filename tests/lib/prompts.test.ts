import {
  buildInterviewerPrompt,
  buildEvaluationPrompt,
  buildResumeParsePrompt,
  INTERVIEWER_SYSTEM_PROMPT,
  EVALUATION_REPORT_PROMPT,
  RESUME_PARSE_PROMPT
} from '../../src/lib/prompts';

describe('prompts', () => {
  describe('buildInterviewerPrompt', () => {
    it('should build prompt with strict style', () => {
      const result = buildInterviewerPrompt({
        style: 'strict',
        jobTitle: 'Senior Engineer',
        jobRequirements: '5+ years experience',
        resumeSummary: 'Background in tech'
      });

      expect(result).toContain('我是一位技术总监，面试风格严谨');
      expect(result).toContain('Senior Engineer');
      expect(result).toContain('5+ years experience');
      expect(result).toContain('Background in tech');
      expect(result).toContain('严肃技术导向');
    });

    it('should build prompt with friendly style', () => {
      const result = buildInterviewerPrompt({
        style: 'friendly',
        jobTitle: 'Product Manager',
        jobRequirements: 'MBA preferred',
        resumeSummary: 'PM experience'
      });

      expect(result).toContain('我是一位HR，面试风格亲切友好');
      expect(result).toContain('亲切友好');
    });

    it('should build prompt with professional style', () => {
      const result = buildInterviewerPrompt({
        style: 'professional',
        jobTitle: 'Designer',
        jobRequirements: 'Figma expert',
        resumeSummary: 'UI/UX background'
      });

      expect(result).toContain('我是一位专业面试官');
      expect(result).toContain('专业中立');
    });

    it('should handle user input containing curly braces without corrupting template', () => {
      const result = buildInterviewerPrompt({
        style: 'strict',
        jobTitle: 'Engineer {style}',  // User input contains curly braces
        jobRequirements: '5+ years {experience}',
        resumeSummary: 'Background in {tech}'
      });

      // Template placeholders should still be replaced
      expect(result).toContain('我是一位技术总监，面试风格严谨');
      // User input curly braces should be escaped and preserved literally
      expect(result).toContain('Engineer \\{style\\}');
      expect(result).toContain('5+ years \\{experience\\}');
      expect(result).toContain('Background in \\{tech\\}');
    });

    it('should handle unknown style defaults to professional', () => {
      const result = buildInterviewerPrompt({
        style: 'unknown' as any,
        jobTitle: 'Engineer',
        jobRequirements: 'React',
        resumeSummary: 'Frontend dev'
      });

      expect(result).toContain('我是一位专业面试官');
    });
  });

  describe('buildEvaluationPrompt', () => {
    it('should build evaluation prompt with all params', () => {
      const result = buildEvaluationPrompt({
        jobTitle: 'Backend Engineer',
        candidateName: '张三',
        resumeSummary: '5年Python经验',
        conversationHistory: '问：项目经验 答：做了电商系统'
      });

      expect(result).toContain('Backend Engineer');
      expect(result).toContain('张三');
      expect(result).toContain('5年Python经验');
      expect(result).toContain('问：项目经验 答：做了电商系统');
    });
  });

  describe('buildResumeParsePrompt', () => {
    it('should build resume parse prompt', () => {
      const resumeText = '张三\n清华大学\n软件工程';
      const result = buildResumeParsePrompt(resumeText);

      expect(result).toContain(resumeText);
    });
  });

  describe('template strings', () => {
    it('INTERVIEWER_SYSTEM_PROMPT should contain required placeholders', () => {
      expect(INTERVIEWER_SYSTEM_PROMPT).toContain('{style}');
      expect(INTERVIEWER_SYSTEM_PROMPT).toContain('{jobTitle}');
      expect(INTERVIEWER_SYSTEM_PROMPT).toContain('{jobRequirements}');
      expect(INTERVIEWER_SYSTEM_PROMPT).toContain('{resumeSummary}');
      expect(INTERVIEWER_SYSTEM_PROMPT).toContain('{styleDescription}');
    });

    it('EVALUATION_REPORT_PROMPT should contain required placeholders', () => {
      expect(EVALUATION_REPORT_PROMPT).toContain('{jobTitle}');
      expect(EVALUATION_REPORT_PROMPT).toContain('{candidateName}');
      expect(EVALUATION_REPORT_PROMPT).toContain('{resumeSummary}');
      expect(EVALUATION_REPORT_PROMPT).toContain('{conversationHistory}');
    });

    it('RESUME_PARSE_PROMPT should contain resumeText placeholder', () => {
      expect(RESUME_PARSE_PROMPT).toContain('{resumeText}');
    });
  });
});
