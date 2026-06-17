import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseJobDescription, formatResumeSummary, extractJSON, parseResume } from '@/services/parser';
import type { Resume } from '@/lib/types';

describe('parseJobDescription', () => {
  it('should extract title from first line if no explicit title found', () => {
    const text = '高级前端工程师\n任职要求：\n- 5年以上经验\n- React专家';
    const result = parseJobDescription(text);
    expect(result.title).toBe('高级前端工程师');
  });

  it('should extract title from explicit position label', () => {
    const text = '职位：全栈工程师\n任职要求：\n- 3年以上经验';
    const result = parseJobDescription(text);
    expect(result.title).toBe('全栈工程师');
  });

  it('should extract requirements section', () => {
    const text = `前端工程师
任职要求：
- 熟悉React
- 3年以上经验
岗位职责：
- 开发页面`;
    const result = parseJobDescription(text);
    expect(result.requirements).toContain('熟悉React');
    expect(result.requirements).toContain('3年以上经验');
  });

  it('should extract responsibilities section', () => {
    const text = `前端工程师
任职要求：
- 熟悉React
岗位职责：
- 开发页面
- 优化性能`;
    const result = parseJobDescription(text);
    expect(result.responsibilities).toContain('开发页面');
    expect(result.responsibilities).toContain('优化性能');
  });

  it('should return full text as requirements when no sections found', () => {
    const text = 'Just some plain job description text without clear sections';
    const result = parseJobDescription(text);
    expect(result.requirements).toBe(text);
    expect(result.responsibilities).toBe('');
  });
});

describe('formatResumeSummary', () => {
  it('should format basic resume info', () => {
    const resume: Resume = {
      name: '张三',
      education: '本科',
      workExperience: [],
      projects: [],
      skills: []
    };
    const result = formatResumeSummary(resume);
    expect(result).toContain('姓名：张三');
    expect(result).toContain('学历：本科');
  });

  it('should format work experience', () => {
    const resume: Resume = {
      name: '李四',
      education: '硕士',
      workExperience: [{
        company: '字节跳动',
        position: '高级工程师',
        duration: '2020-2023',
        description: '负责前端架构设计'
      }],
      projects: [],
      skills: []
    };
    const result = formatResumeSummary(resume);
    expect(result).toContain('工作经历：');
    expect(result).toContain('字节跳动 | 高级工程师 | 2020-2023');
    expect(result).toContain('负责前端架构设计');
  });

  it('should format projects', () => {
    const resume: Resume = {
      name: '王五',
      education: '',
      workExperience: [],
      projects: [{
        name: '电商平台',
        role: '技术负责人',
        description: '搭建微服务架构'
      }],
      skills: []
    };
    const result = formatResumeSummary(resume);
    expect(result).toContain('项目经验：');
    expect(result).toContain('电商平台 (技术负责人)');
    expect(result).toContain('搭建微服务架构');
  });

  it('should format skills', () => {
    const resume: Resume = {
      name: '赵六',
      education: '',
      workExperience: [],
      projects: [],
      skills: ['React', 'TypeScript', 'Node.js']
    };
    const result = formatResumeSummary(resume);
    expect(result).toContain('技能：React, TypeScript, Node.js');
  });

  it('should handle empty resume', () => {
    const resume: Resume = {
      name: '',
      education: '',
      workExperience: [],
      projects: [],
      skills: []
    };
    const result = formatResumeSummary(resume);
    expect(result).toBe('姓名：');
  });
});

describe('extractJSON', () => {
  it('extractJSON extracts JSON from markdown', () => {
    const markdown = '```json\n{"name": "张三"}\n```';
    expect(extractJSON(markdown)).toBe('{"name": "张三"}');
  });

  it('extractJSON handles raw JSON', () => {
    const raw = '{"name": "李四", "skills": ["Java"]}';
    expect(extractJSON(raw)).toBe(raw);
  });

  it('extractJSON handles JSON with code block without language', () => {
    const markdown = '```\n{"name": "王五"}\n```';
    expect(extractJSON(markdown)).toBe('{"name": "王五"}');
  });
});

describe('parseResume', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('parseResume handles API errors gracefully', async () => {
    // Mock fetch to throw an error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await parseResume('Test resume text');

    expect(result.name).toBe('解析失败');
    expect(result.skills).toEqual([]);
  });

  it('parseResume handles invalid JSON response gracefully', async () => {
    // Mock fetch to return invalid JSON response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not valid json' } }] })
    } as Response);

    const result = await parseResume('Test resume text');

    expect(result.name).toBe('解析失败');
  });

  it('parseResume handles successful parsing', async () => {
    // Mock fetch to return valid JSON
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: '```json\n{"name": "张三", "education": "本科", "workExperience": [], "projects": [], "skills": ["JavaScript"]}\n```'
          }
        }]
      })
    } as Response);

    const result = await parseResume('Test resume text');

    expect(result.name).toBe('张三');
    expect(result.skills).toEqual(['JavaScript']);
  });
});
