import { buildResumeParsePrompt } from '@/lib/prompts';
import { callLLM } from '@/lib/llm';
import type { Resume } from '@/lib/types';

// Extract JSON from LLM response (handles markdown code blocks)
export function extractJSON(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }
  return text.trim();
}

// Parse resume text using LLM
export async function parseResume(resumeText: string): Promise<Resume> {
  try {
    const prompt = buildResumeParsePrompt(resumeText);
    const rawResponse = await callLLM(prompt, undefined, 0.3);
    const jsonStr = extractJSON(rawResponse);

    const parsed = JSON.parse(jsonStr) as Partial<Resume>;

    return {
      name: parsed.name || '未知',
      education: parsed.education || '',
      workExperience: parsed.workExperience || [],
      projects: parsed.projects || [],
      skills: parsed.skills || []
    };
  } catch (error) {
    console.error('Failed to parse resume:', error);
    return {
      name: '解析失败',
      education: '',
      workExperience: [],
      projects: [],
      skills: []
    };
  }
}

// Format resume for prompt display
export function formatResumeSummary(resume: Resume): string {
  const parts: string[] = [];

  parts.push(`姓名：${resume.name}`);
  if (resume.education) parts.push(`学历：${resume.education}`);

  if (resume.workExperience.length > 0) {
    parts.push('工作经历：');
    resume.workExperience.forEach(exp => {
      parts.push(`- ${exp.company} | ${exp.position} | ${exp.duration}`);
      parts.push(`  ${exp.description}`);
    });
  }

  if (resume.projects && resume.projects.length > 0) {
    parts.push('项目经验：');
    resume.projects.forEach(proj => {
      parts.push(`- ${proj.name} (${proj.role})`);
      parts.push(`  ${proj.description}`);
    });
  }

  if (resume.skills.length > 0) {
    parts.push(`技能：${resume.skills.join(', ')}`);
  }

  return parts.join('\n');
}

// Parse plain text JD (simple extraction)
export function parseJobDescription(text: string): {
  title: string;
  requirements: string;
  responsibilities: string;
} {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let title = lines[0] || '未知职位';
  const titleMatch = text.match(/(?:职位[：:]\s*|position[：:]\s*)(.+)/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  const requirementsSection = extractSection(text, ['任职要求', '职位要求', '要求', 'requirements'], ['岗位职责', '工作职责', 'responsibilities']);
  const responsibilitiesSection = extractSection(text, ['岗位职责', '工作职责', 'responsibilities', '主要工作'], ['任职要求', '职位要求']);

  return {
    title,
    requirements: requirementsSection || text,
    responsibilities: responsibilitiesSection || ''
  };
}

function extractSection(text: string, startKeywords: string[], endKeywords: string[]): string {
  const lines = text.split('\n');
  let collecting = false;
  const collected: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!collecting) {
      for (const keyword of startKeywords) {
        if (trimmed.toLowerCase().includes(keyword.toLowerCase())) {
          collecting = true;
          break;
        }
      }
    }

    if (collecting) {
      for (const keyword of endKeywords) {
        if (trimmed.toLowerCase().includes(keyword.toLowerCase())) {
          return collected.join('\n');
        }
      }
      collected.push(line);
    }
  }

  return collected.join('\n');
}
