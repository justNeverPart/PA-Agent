import { describe, it, expect } from 'vitest';
import { parseAgentResponse, shouldEndInterview } from '@/services/agent';
import type { Message } from '@/lib/types';

describe('parseAgentResponse', () => {
  it('should parse question format with colon', () => {
    const raw = `问题：请介绍一下你自己
追问原因：想了解候选人的基本背景`;
    const result = parseAgentResponse(raw);
    expect(result.type).toBe('question');
    expect(result.content).toBe('请介绍一下你自己');
    expect(result.reasoning).toBe('想了解候选人的基本背景');
  });

  it('should parse question format with Chinese colon', () => {
    const raw = `问题：你在之前的公司负责什么项目？
追问原因：想了解项目经验`;
    const result = parseAgentResponse(raw);
    expect(result.type).toBe('question');
    expect(result.content).toBe('你在之前的公司负责什么项目？');
    expect(result.reasoning).toBe('想了解项目经验');
  });

  it('should parse ending format', () => {
    const raw = `结束语：非常感谢您的时间，面试到此结束。
进入评估：true`;
    const result = parseAgentResponse(raw);
    expect(result.type).toBe('ending');
    expect(result.content).toBe('非常感谢您的时间，面试到此结束。');
    expect(result.reasoning).toBe('Should evaluate: true');
  });

  it('should parse ending format without evaluation', () => {
    const raw = `结束语：今天的面试就到这里，感谢您的参与。`;
    const result = parseAgentResponse(raw);
    expect(result.type).toBe('ending');
    expect(result.content).toBe('今天的面试就到这里，感谢您的参与。');
    expect(result.reasoning).toBe('');
  });

  it('should fall back to raw content when no pattern matches', () => {
    const raw = `这是一段没有特定格式的回复内容。`;
    const result = parseAgentResponse(raw);
    expect(result.type).toBe('question');
    expect(result.content).toBe('这是一段没有特定格式的回复内容。');
    expect(result.reasoning).toBe('Fell back to question extraction');
  });

  it('should handle multiline question content', () => {
    const raw = `问题：请描述一下你在
XXX项目的具体工作
追问原因：想了解技术深度`;
    const result = parseAgentResponse(raw);
    expect(result.type).toBe('question');
    expect(result.content).toBe('请描述一下你在 XXX项目的具体工作');
    expect(result.reasoning).toBe('想了解技术深度');
  });

  it('should handle empty reasoning when not provided', () => {
    const raw = `问题：你的离职原因是什么？`;
    const result = parseAgentResponse(raw);
    expect(result.type).toBe('question');
    expect(result.content).toBe('你的离职原因是什么？');
    expect(result.reasoning).toBe('');
  });
});

describe('shouldEndInterview', () => {
  const createMessage = (role: 'user' | 'assistant', content: string): Message => ({
    id: `msg-${Math.random().toString(36).slice(2)}`,
    interviewId: 'test-interview',
    role,
    content,
    createdAt: new Date().toISOString()
  });

  it('should not end interview when under max turns', () => {
    const messages: Message[] = [
      createMessage('user', '回答1'),
      createMessage('assistant', '问题2'),
      createMessage('user', '回答2'),
      createMessage('assistant', '问题3')
    ];
    const result = shouldEndInterview(messages);
    expect(result.shouldEnd).toBe(false);
    expect(result.reason).toBe('');
  });

  it('should end interview at max turns (15)', () => {
    const messages: Message[] = [];
    for (let i = 0; i < 15; i++) {
      messages.push(createMessage('user', `回答${i + 1}`));
      if (i < 14) {
        messages.push(createMessage('assistant', `问题${i + 1}`));
      }
    }
    const result = shouldEndInterview(messages);
    expect(result.shouldEnd).toBe(true);
    expect(result.reason).toBe('已达到最大对话轮次');
  });

  it('should end interview when assistant says ending', () => {
    const messages: Message[] = [
      createMessage('user', '回答1'),
      createMessage('assistant', '问题：介绍一下项目经验'),
      createMessage('user', '回答2'),
      createMessage('assistant', '结束语：感谢您的时间，面试到此结束。')
    ];
    const result = shouldEndInterview(messages);
    expect(result.shouldEnd).toBe(true);
    expect(result.reason).toBe('面试官决定结束面试');
  });

  it('should not end interview without ending keyword', () => {
    const messages: Message[] = [
      createMessage('user', '回答1'),
      createMessage('assistant', '问题：下一个问题')
    ];
    const result = shouldEndInterview(messages);
    expect(result.shouldEnd).toBe(false);
    expect(result.reason).toBe('');
  });

  it('should count only user messages as turns', () => {
    // 10 user messages should not end
    const messages: Message[] = [];
    for (let i = 0; i < 10; i++) {
      messages.push(createMessage('user', `回答${i + 1}`));
      messages.push(createMessage('assistant', `问题${i + 1}`));
    }
    const result = shouldEndInterview(messages);
    expect(result.shouldEnd).toBe(false);
  });

  it('should end if assistant content contains 结束语 even without explicit pattern', () => {
    const messages: Message[] = [
      createMessage('user', '回答1'),
      createMessage('assistant', '好的，我已经有足够的信息了。结束语：感谢参与面试。')
    ];
    const result = shouldEndInterview(messages);
    expect(result.shouldEnd).toBe(true);
    expect(result.reason).toBe('面试官决定结束面试');
  });
});
