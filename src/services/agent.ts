import { buildInterviewerPrompt, buildEvaluationPrompt } from '@/lib/prompts';
import { callLLM } from '@/lib/llm';
import { addMessage, getMessages } from './database';
import type { AgentResponse, Message } from '@/lib/types';

const MAX_TURNS = 15;

interface InterviewContext {
  interviewId: string;
  jobTitle: string;
  jobRequirements: string;
  resumeSummary: string;
  interviewerStyle: 'strict' | 'friendly' | 'professional';
}

// Parse agent response - only returns the first question
export function parseAgentResponse(raw: string): AgentResponse {
  // Check for ending first
  const endingMatch = raw.match(/^结束语[：:]\s*(.+?)(?=\n进入评估|$)/sm);
  const evalMatch = raw.match(/^进入评估[：:]\s*(.+)/m);

  if (endingMatch) {
    return {
      type: 'ending',
      content: endingMatch[1].trim(),
      reasoning: evalMatch ? `Should evaluate: ${evalMatch[1].trim()}` : ''
    };
  }

  // Extract only the FIRST question
  const lines = raw.split('\n');
  let questionLine = '';
  let reasonLine = '';
  let inQuestionBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Start of question block
    if (trimmed.startsWith('问题：') || trimmed.startsWith('问题:')) {
      questionLine = trimmed.replace(/^问题[：:]\s*/, '');
      inQuestionBlock = true;
      continue;
    }

    // If we're in question block
    if (inQuestionBlock) {
      // Check for follow-up reason
      if (trimmed.startsWith('追问原因：') || trimmed.startsWith('追问原因:')) {
        reasonLine = trimmed.replace(/^追问原因[：:]\s*/, '');
        break; // Stop after first question + reason
      }
      // If we hit another question, stop (only return first question)
      if (trimmed.startsWith('问题：') || trimmed.startsWith('问题:') || trimmed.startsWith('结束语')) {
        break;
      }
      // Continue collecting question content if no reason yet
      if (!reasonLine && questionLine) {
        questionLine += ' ' + trimmed;
      }
    }
  }

  if (questionLine) {
    return {
      type: 'question',
      content: questionLine.trim(),
      reasoning: reasonLine.trim()
    };
  }

  // Fallback: if no structured format, try to extract just the first line that looks like a question
  const firstQuestion = lines.find(l =>
    l.includes('？') || l.includes('?') ||
    (l.includes('请') && l.includes('介绍'))
  );

  return {
    type: 'question',
    content: firstQuestion?.trim() || raw.trim(),
    reasoning: 'Fell back to question extraction'
  };
}

// Check if should end interview
export function shouldEndInterview(messages: Message[]): { shouldEnd: boolean; reason: string } {
  const turns = messages.filter(m => m.role === 'user').length;

  if (turns >= MAX_TURNS) {
    return { shouldEnd: true, reason: '已达到最大对话轮次' };
  }

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  if (lastAssistant?.content.includes('结束语')) {
    return { shouldEnd: true, reason: '面试官决定结束面试' };
  }

  return { shouldEnd: false, reason: '' };
}

// Generate opening message
export async function generateOpening(context: InterviewContext): Promise<string> {
  const prompt = buildInterviewerPrompt({
    style: context.interviewerStyle,
    jobTitle: context.jobTitle,
    jobRequirements: context.jobRequirements,
    resumeSummary: context.resumeSummary
  });

  const systemPrompt = prompt + '\n\n请先做一个简短的开场介绍，介绍自己和职位，然后开始第一个面试问题。';

  const response = await callLLM(systemPrompt);

  // Persist opening message
  addMessage({ interviewId: context.interviewId, role: 'assistant', content: response });

  return response;
}

// Process user answer and get next question
export async function processAnswer(
  context: InterviewContext,
  userAnswer: string
): Promise<{ response: string; isEnd: boolean }> {
  addMessage({ interviewId: context.interviewId, role: 'user', content: userAnswer });

  const messages = getMessages(context.interviewId);
  const historyForLLM = messages.slice(0, -1).map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }));

  const prompt = buildInterviewerPrompt({
    style: context.interviewerStyle,
    jobTitle: context.jobTitle,
    jobRequirements: context.jobRequirements,
    resumeSummary: context.resumeSummary
  });

  const response = await callLLM(prompt, historyForLLM);
  const parsed = parseAgentResponse(response);

  // Store only the parsed response (single question) to maintain consistency
  addMessage({ interviewId: context.interviewId, role: 'assistant', content: parsed.content });

  return {
    response: parsed.content,
    isEnd: parsed.type === 'ending'
  };
}

// Generate evaluation report
export async function generateEvaluation(context: InterviewContext): Promise<string> {
  const messages = getMessages(context.interviewId);

  const conversationHistory = messages
    .map(m => `${m.role === 'user' ? '候选人' : '面试官'}：${m.content}`)
    .join('\n');

  const prompt = buildEvaluationPrompt({
    jobTitle: context.jobTitle,
    candidateName: context.resumeSummary.split('\n')[0]?.replace('姓名：', '') || '候选人',
    resumeSummary: context.resumeSummary,
    conversationHistory
  });

  const response = await callLLM(prompt);
  return response;
}
