export const INTERVIEWER_SYSTEM_PROMPT = `你是一位{style}的面试官，面试职位是{jobTitle}。

职位核心要求：
{jobRequirements}

候选人背景：
{resumeSummary}

面试规则：
1. 先做简短开场，介绍自己和职位
2. **每次只问一个问题**，等待候选人回答后再问下一个
3. 根据回答决定：追问细节 / 问下一个问题 / 结束面试
4. 问题要具体，结合简历中的经历
5. 保持角色一致性，语言风格{styleDescription}
6. 如果回答不充分，追问直到获得有效信息
7. 面试进行5-8个问题后结束

输出格式（必须严格遵循，只能二选一）：
当需要提问时（只能有一个问题）：
问题：[具体面试问题]
追问原因：[为什么问这个问题]

当决定结束面试时：
结束语：[总结面试，感谢候选人]
进入评估：[true/false]

重要：禁止一次性问多个问题！禁止添加任何额外内容！`;

export const EVALUATION_REPORT_PROMPT = `作为资深面试官，请根据以下面试记录生成评估报告。

职位：{jobTitle}
候选人：{candidateName}
简历摘要：{resumeSummary}

面试记录：
{conversationHistory}

请严格按以下JSON格式输出（禁止添加任何额外内容）：
{
  "overall_score": 0-100的整数,
  "technical_score": 0-10的整数,
  "communication_score": 0-10的整数,
  "experience_score": 0-10的整数,
  "potential_score": 0-10的整数,
  "strengths": "优势分析，3-5条，用中文逗号分隔",
  "risks": "潜在风险点，2-3条，用中文逗号分隔",
  "suggestions": "下一轮考察建议",
  "question_review": "面试问题回顾，列出每个问题及候选人回答摘要"
}`;

function escapeBraces(str: string): string {
  return str.replace(/[{}]/g, c => c === '{' ? '\\{' : '\\}');
}

export const RESUME_PARSE_PROMPT = `请从以下简历文本中提取结构化信息，以JSON格式返回。

简历内容：
{resumeText}

输出格式（严格JSON）：
{
  "name": "姓名",
  "education": "学历",
  "workExperience": [
    {
      "company": "公司名",
      "position": "职位",
      "duration": "时间段",
      "description": "工作描述"
    }
  ],
  "projects": [
    {
      "name": "项目名",
      "role": "角色",
      "description": "项目描述"
    }
  ],
  "skills": ["技能1", "技能2"]
}`;

export function buildInterviewerPrompt(params: {
  style: 'strict' | 'friendly' | 'professional';
  jobTitle: string;
  jobRequirements: string;
  resumeSummary: string;
}): string {
  const styleMap = {
    strict: { description: '严肃技术导向', self: '我是一位技术总监，面试风格严谨' },
    friendly: { description: '亲切友好', self: '我是一位HR，面试风格亲切友好' },
    professional: { description: '专业中立', self: '我是一位专业面试官' }
  };

  const styleInfo = styleMap[params.style] || styleMap.professional;

  return INTERVIEWER_SYSTEM_PROMPT
    .replace('{style}', escapeBraces(styleInfo.self))
    .replace('{jobTitle}', escapeBraces(params.jobTitle))
    .replace('{jobRequirements}', escapeBraces(params.jobRequirements))
    .replace('{resumeSummary}', escapeBraces(params.resumeSummary))
    .replace('{styleDescription}', escapeBraces(styleInfo.description));
}

export function buildEvaluationPrompt(params: {
  jobTitle: string;
  candidateName: string;
  resumeSummary: string;
  conversationHistory: string;
}): string {
  return EVALUATION_REPORT_PROMPT
    .replace('{jobTitle}', escapeBraces(params.jobTitle))
    .replace('{candidateName}', escapeBraces(params.candidateName))
    .replace('{resumeSummary}', escapeBraces(params.resumeSummary))
    .replace('{conversationHistory}', escapeBraces(params.conversationHistory));
}

export function buildResumeParsePrompt(resumeText: string): string {
  return RESUME_PARSE_PROMPT.replace('{resumeText}', escapeBraces(resumeText));
}
