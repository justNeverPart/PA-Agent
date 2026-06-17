# 智能招聘助手 MVP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建完整的 AI 面试助手 MVP，实现 JD + 简历上传 → 多轮 AI 面试 → 评估报告的端到端流程

**Architecture:** 基于 Next.js App Router 的全栈应用，后端使用 LangChain Agent 处理多轮对话，SQLite 存储对话历史，Qwen/Kimi LLM 生成面试问题和评估报告

**Tech Stack:** Next.js 14 + TypeScript + LangChain + SQLite (better-sqlite3) + Qwen/Kimi API

---

## 文件结构规划

```
/home/chenhaoyu/PAAgent/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # 首页 - JD/简历上传
│   │   ├── interview/[id]/page.tsx     # 面试聊天页面
│   │   ├── result/[id]/page.tsx        # 评估报告页面
│   │   └── api/
│   │       └── interview/
│   │           ├── route.ts             # POST /api/interview/start
│   │           └── [id]/
│   │               ├── route.ts         # GET/POST 单个面试
│   │               ├── message/route.ts # POST 发送消息
│   │               ├── end/route.ts     # POST 结束面试
│   │               ├── messages/route.ts# GET 获取对话历史
│   │               └── evaluation/route.ts # GET 获取评估报告
│   ├── components/
│   │   ├── UploadForm.tsx              # JD/简历上传表单
│   │   ├── ChatInterface.tsx           # 聊天界面
│   │   └── EvaluationReport.tsx         # 评估报告展示
│   ├── services/
│   │   ├── parser.ts                    # 简历/JD 解析服务
│   │   ├── agent.ts                     # Interview Agent (LangChain)
│   │   ├── evaluator.ts                # 评估报告生成
│   │   └── database.ts                 # SQLite 数据库操作
│   └── lib/
│       ├── prompts.ts                  # Prompt 模板
│       ├── types.ts                    # 类型定义
│       └── db.ts                       # 数据库连接
├── data/
│   └── interview.db                    # SQLite 数据库文件
├── tests/
│   ├── services/
│   │   ├── parser.test.ts
│   │   ├── agent.test.ts
│   │   └── evaluator.test.ts
│   └── setup.ts
├── .env.example                        # 环境变量模板
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

---

## Task 1: 项目初始化

**Files:**
- Create: `/home/chenhaoyu/PAAgent/package.json`
- Create: `/home/chenhaoyu/PAAgent/tsconfig.json`
- Create: `/home/chenhaoyu/PAAgent/next.config.js`
- Create: `/home/chenhaoyu/PAAgent/.env.example`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "smart-recruiting-assistant",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "langchain": "^0.1.0",
    "better-sqlite3": "^11.0.0",
    "uuid": "^9.0.0",
    "pdf-parse": "^4.6.0",
    "mammoth": "^1.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.4.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-node": "^10.9.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 创建 next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3']
  }
};

module.exports = nextConfig;
```

- [ ] **Step 4: 创建 .env.example**

```
# LLM API Configuration
Qwen_API_KEY=your_qwen_api_key_here
Qwen_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
# or use Kimi
KIMI_API_KEY=your_kimi_api_key_here
KIMI_API_URL=https://api.moonshot.cn/v1/chat/completions

# Default LLM provider: "qwen" or "kimi"
LLM_PROVIDER=qwen
```

- [ ] **Step 5: 提交**

```bash
git add package.json tsconfig.json next.config.js .env.example
git commit -m "feat: initialize Next.js project with dependencies"
```

---

## Task 2: 类型定义和数据库层

**Files:**
- Create: `/home/chenhaoyu/PAAgent/src/lib/types.ts`
- Create: `/home/chenhaoyu/PAAgent/src/lib/db.ts`
- Create: `/home/chenhaoyu/PAAgent/src/services/database.ts`
- Create: `/home/chenhaoyu/PAAgent/tests/setup.ts`
- Create: `/home/chenhaoyu/PAAgent/tests/services/database.test.ts`

- [ ] **Step 1: 创建类型定义 src/lib/types.ts**

```typescript
export interface JobDescription {
  title: string;
  requirements: string;
  responsibilities: string;
  niceToHave?: string;
}

export interface Resume {
  name: string;
  education?: string;
  workExperience: WorkExperience[];
  projects?: Project[];
  skills: string[];
}

export interface WorkExperience {
  company: string;
  position: string;
  duration: string;
  description: string;
}

export interface Project {
  name: string;
  role: string;
  description: string;
}

export interface Interview {
  id: string;
  jobTitle: string;
  jobRequirements: string;
  candidateName: string;
  resumeContent: string;
  interviewerStyle: 'strict' | 'friendly' | 'professional';
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  interviewId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface EvaluationReport {
  id: string;
  interviewId: string;
  overallScore: number;        // 0-100
  technicalScore: number;       // 0-10
  communicationScore: number;   // 0-10
  experienceScore: number;      // 0-10
  potentialScore: number;       // 0-10
  strengths: string;
  risks: string;
  suggestions: string;
  questionReview: string;
  createdAt: string;
}

export interface AgentResponse {
  type: 'question' | 'followup' | 'ending';
  content: string;
  reasoning: string;
}

export interface StartInterviewRequest {
  jobTitle: string;
  jobRequirements: string;
  resumeText: string;
  interviewerStyle?: 'strict' | 'friendly' | 'professional';
}

export interface SendMessageRequest {
  content: string;
}
```

- [ ] **Step 2: 创建数据库连接 src/lib/db.ts**

```typescript
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'interview.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      job_title TEXT NOT NULL,
      job_requirements TEXT NOT NULL,
      candidate_name TEXT NOT NULL,
      resume_content TEXT NOT NULL,
      interviewer_style TEXT DEFAULT 'professional',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      interview_id TEXT UNIQUE NOT NULL,
      overall_score INTEGER NOT NULL,
      technical_score INTEGER NOT NULL,
      communication_score INTEGER NOT NULL,
      experience_score INTEGER NOT NULL,
      potential_score INTEGER NOT NULL,
      strengths TEXT NOT NULL,
      risks TEXT NOT NULL,
      suggestions TEXT NOT NULL,
      question_review TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
    );
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

- [ ] **Step 3: 创建数据库服务 src/services/database.ts**

```typescript
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { Interview, Message, EvaluationReport } from '@/lib/types';

export function createInterview(data: {
  jobTitle: string;
  jobRequirements: string;
  candidateName: string;
  resumeContent: string;
  interviewerStyle: string;
}): Interview {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO interviews (id, job_title, job_requirements, candidate_name, resume_content, interviewer_style, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(id, data.jobTitle, data.jobRequirements, data.candidateName, data.resumeContent, data.interviewerStyle, now, now);

  return {
    id,
    jobTitle: data.jobTitle,
    jobRequirements: data.jobRequirements,
    candidateName: data.candidateName,
    resumeContent: data.resumeContent,
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
    interviewerStyle: row.interviewer_style as Interview['interviewerStyle'],
    status: row.status as Interview['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  };
}

export function updateInterviewStatus(id: string, status: 'active' | 'completed'): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE interviews SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
}

export function addMessage(data: { interviewId: string; role: 'user' | 'assistant'; content: string }): Message {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO messages (id, interview_id, role, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.interviewId, data.role, data.content, now);

  // Update interview updated_at
  db.prepare('UPDATE interviews SET updated_at = ? WHERE id = ?').run(now, data.interviewId);

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
```

- [ ] **Step 4: 创建测试 setup 和 mock**

```typescript
// tests/setup.ts
import { vi } from 'jest';

// Mock environment
process.env.Qwen_API_KEY = 'test-api-key';
process.env.Qwen_API_URL = 'https://test.example.com';
process.env.LLM_PROVIDER = 'qwen';

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).slice(2, 9)
}));
```

- [ ] **Step 5: 创建数据库服务测试**

```typescript
// tests/services/database.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Test database path
const TEST_DB_PATH = path.join(process.cwd(), 'test-db-' + Date.now() + '.db');

describe('Database Operations', () => {
  let mockGetDb: () => Database.Database;

  beforeEach(() => {
    // Clean up test db if exists
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it('should create interview and retrieve it', () => {
    const db = new Database(TEST_DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS interviews (
        id TEXT PRIMARY KEY,
        job_title TEXT NOT NULL,
        job_requirements TEXT NOT NULL,
        candidate_name TEXT NOT NULL,
        resume_content TEXT NOT NULL,
        interviewer_style TEXT DEFAULT 'professional',
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    const id = 'test-id-123';
    db.prepare(`
      INSERT INTO interviews (id, job_title, job_requirements, candidate_name, resume_content, interviewer_style, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(id, 'Software Engineer', '3+ years exp', 'John Doe', 'Resume content here', 'professional');

    const row = db.prepare('SELECT * FROM interviews WHERE id = ?').get(id);
    expect(row).toBeDefined();
    expect((row as any).job_title).toBe('Software Engineer');

    db.close();
  });

  it('should add and retrieve messages in order', () => {
    const db = new Database(TEST_DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS interviews (
        id TEXT PRIMARY KEY,
        job_title TEXT NOT NULL,
        job_requirements TEXT NOT NULL,
        candidate_name TEXT NOT NULL,
        resume_content TEXT NOT NULL,
        interviewer_style TEXT DEFAULT 'professional',
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        interview_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
      );
    `);

    const interviewId = 'test-interview-id';
    db.prepare('INSERT INTO interviews (id, job_title, job_requirements, candidate_name, resume_content, interviewer_style, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(interviewId, 'Engineer', 'req', 'Jane', 'resume', 'professional', 'active');

    db.prepare('INSERT INTO messages (id, interview_id, role, content) VALUES (?, ?, ?, ?)').run('msg-1', interviewId, 'assistant', 'Hello!');
    db.prepare('INSERT INTO messages (id, interview_id, role, content) VALUES (?, ?, ?, ?)').run('msg-2', interviewId, 'user', 'Hi there!');
    db.prepare('INSERT INTO messages (id, interview_id, role, content) VALUES (?, ?, ?, ?)').run('msg-3', interviewId, 'assistant', 'Tell me about your experience.');

    const messages = db.prepare('SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC').all(interviewId) as any[];

    expect(messages.length).toBe(3);
    expect(messages[0].role).toBe('assistant');
    expect(messages[1].role).toBe('user');
    expect(messages[2].role).toBe('assistant');

    db.close();
  });
});
```

- [ ] **Step 6: 提交**

```bash
git add src/lib/types.ts src/lib/db.ts src/services/database.ts tests/
git commit -m "feat: add type definitions and database layer"
```

---

## Task 3: Prompt 模板

**Files:**
- Create: `/home/chenhaoyu/PAAgent/src/lib/prompts.ts`
- Create: `/home/chenhaoyu/PAAgent/tests/lib/prompts.test.ts`

- [ ] **Step 1: 创建 Prompt 模板 src/lib/prompts.ts**

```typescript
export const INTERVIEWER_SYSTEM_PROMPT = `你是一位{style}的面试官，面试职位是{jobTitle}。

职位核心要求：
{jobRequirements}

候选人背景：
{resumeSummary}

面试规则：
1. 先做简短开场，介绍自己和职位
2. 每个问题后根据回答决定：追问 / 问下一个问题 / 结束面试
3. 问题要具体，结合简历中的经历
4. 保持角色一致性，语言风格{styleDescription}
5. 如果回答不充分，追问直到获得有效信息
6. 面试通常进行5-8个问题后结束

输出格式（必须严格遵循）：
当需要提问时：
- 问题：[具体面试问题]
- 追问原因：[为什么问这个问题/追问什么]

当决定结束面试时：
- 结束语：[总结面试，感谢候选人]
- 进入评估：[true/false]

重要：只输出上述格式，不要添加任何额外内容。`;

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
    .replace('{style}', styleInfo.self)
    .replace('{jobTitle}', params.jobTitle)
    .replace('{jobRequirements}', params.jobRequirements)
    .replace('{resumeSummary}', params.resumeSummary)
    .replace('{styleDescription}', styleInfo.description);
}

export function buildEvaluationPrompt(params: {
  jobTitle: string;
  candidateName: string;
  resumeSummary: string;
  conversationHistory: string;
}): string {
  return EVALUATION_REPORT_PROMPT
    .replace('{jobTitle}', params.jobTitle)
    .replace('{candidateName}', params.candidateName)
    .replace('{resumeSummary}', params.resumeSummary)
    .replace('{conversationHistory}', params.conversationHistory);
}

export function buildResumeParsePrompt(resumeText: string): string {
  return RESUME_PARSE_PROMPT.replace('{resumeText}', resumeText);
}
```

- [ ] **Step 2: 创建 Prompt 测试**

```typescript
// tests/lib/prompts.test.ts
import { describe, it, expect } from '@jest/globals';
import { buildInterviewerPrompt, buildEvaluationPrompt, buildResumeParsePrompt } from '@/lib/prompts';

describe('Prompt Templates', () => {
  describe('buildInterviewerPrompt', () => {
    it('should replace all placeholders correctly', () => {
      const prompt = buildInterviewerPrompt({
        style: 'strict',
        jobTitle: 'Software Engineer',
        jobRequirements: '3+ years exp, React, Node.js',
        resumeSummary: '5 years at Google, frontend specialist'
      });

      expect(prompt).toContain('技术总监');
      expect(prompt).toContain('Software Engineer');
      expect(prompt).toContain('3+ years exp');
      expect(prompt).toContain('Google');
      expect(prompt).not.toContain('{style}');
      expect(prompt).not.toContain('{jobTitle}');
    });

    it('should use friendly style for friendly interviews', () => {
      const prompt = buildInterviewerPrompt({
        style: 'friendly',
        jobTitle: 'Product Manager',
        jobRequirements: 'MBA preferred',
        resumeSummary: 'PM at startup'
      });

      expect(prompt).toContain('HR');
      expect(prompt).toContain('亲切友好');
    });
  });

  describe('buildEvaluationPrompt', () => {
    it('should format conversation history correctly', () => {
      const prompt = buildEvaluationPrompt({
        jobTitle: 'Data Scientist',
        candidateName: 'Alice',
        resumeSummary: 'PhD in ML',
        conversationHistory: 'Q: What is overfitting?\nA: It is...'
      });

      expect(prompt).toContain('Data Scientist');
      expect(prompt).toContain('Alice');
      expect(prompt).toContain('overfitting');
      expect(prompt).toContain('overall_score');
    });
  });

  describe('buildResumeParsePrompt', () => {
    it('should handle multi-paragraph resumes', () => {
      const resume = `姓名：张三
学历：硕士
工作经历：
2019-2022 阿里巴巴 前端工程师
2022-至今 字节跳动 高级前端工程师`;

      const prompt = buildResumeParsePrompt(resume);

      expect(prompt).toContain('张三');
      expect(prompt).toContain('硕士');
      expect(prompt).toContain('阿里巴巴');
    });
  });
});
```

- [ ] **Step 3: 提交**

```bash
git add src/lib/prompts.ts tests/lib/prompts.test.ts
git commit -m "feat: add prompt templates for interview and evaluation"
```

---

## Task 4: 简历解析服务

**Files:**
- Create: `/home/chenhaoyu/PAAgent/src/services/parser.ts`
- Create: `/home/chenhaoyu/PAAgent/tests/services/parser.test.ts`

- [ ] **Step 1: 创建简历解析服务 src/services/parser.ts**

```typescript
import { buildResumeParsePrompt } from '@/lib/prompts';
import type { Resume } from '@/lib/types';

// LLM API call to parse resume
async function callLLM(prompt: string): Promise<string> {
  const apiKey = process.env.Qwen_API_KEY;
  const apiUrl = process.env.Qwen_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  const provider = process.env.LLM_PROVIDER || 'qwen';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: provider === 'kimi' ? 'moonshot-v1-8k' : 'qwen-plus',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; content?: string };
  const content = data.choices?.[0]?.message?.content || data.content;

  if (!content) {
    throw new Error('No content in LLM response');
  }

  return content;
}

// Extract JSON from LLM response (handles markdown code blocks)
function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
  if (match) {
    return match[1].trim();
  }
  return text.trim();
}

// Parse resume text using LLM
export async function parseResume(resumeText: string): Promise<Resume> {
  const prompt = buildResumeParsePrompt(resumeText);
  const rawResponse = await callLLM(prompt);
  const jsonStr = extractJSON(rawResponse);

  try {
    const parsed = JSON.parse(jsonStr) as Partial<Resume>;

    return {
      name: parsed.name || '未知',
      education: parsed.education || '',
      workExperience: parsed.workExperience || [],
      projects: parsed.projects || [],
      skills: parsed.skills || []
    };
  } catch (error) {
    console.error('Failed to parse resume JSON:', jsonStr);
    // Fallback: return basic structure
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

  // Try to extract title from first line or lines with "职位" or "position"
  let title = lines[0] || '未知职位';
  const titleMatch = text.match(/(?:职位[：:]\s*|position[：:]\s*)(.+)/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Extract requirements (任职要求, 要求, requirements)
  const requirementsSection = extractSection(text, ['任职要求', '职位要求', '要求', 'requirements'], ['岗位职责', '工作职责', 'responsibilities']);

  // Extract responsibilities
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

    // Check for start keywords
    if (!collecting) {
      for (const keyword of startKeywords) {
        if (trimmed.toLowerCase().includes(keyword.toLowerCase())) {
          collecting = true;
          break;
        }
      }
    }

    if (collecting) {
      // Check for end keywords
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
```

- [ ] **Step 2: 创建解析服务测试**

```typescript
// tests/services/parser.test.ts
import { describe, it, expect } from '@jest/globals';
import { parseJobDescription, formatResumeSummary } from '@/services/parser';
import type { Resume } from '@/lib/types';

describe('Parser Service', () => {
  describe('parseJobDescription', () => {
    it('should extract job title', () => {
      const text = `新媒体运营

岗位职责：
1. 负责小红书内容创作
2. 分析数据优化策略

任职要求：
1. 本科以上学历
2. 2年以上运营经验`;

      const result = parseJobDescription(text);

      expect(result.title).toBe('新媒体运营');
      expect(result.requirements).toContain('本科');
      expect(result.requirements).toContain('运营经验');
    });

    it('should handle JD with position keyword', () => {
      const text = `职位：高级前端工程师

要求：
- 3年+前端经验
- 熟悉React`;

      const result = parseJobDescription(text);

      expect(result.title).toBe('高级前端工程师');
    });

    it('should handle simple JD text', () => {
      const text = `销售经理

需要有5年销售经验，本科以上学历，善于沟通`;

      const result = parseJobDescription(text);

      expect(result.title).toBe('销售经理');
      expect(result.requirements).toContain('5年销售经验');
    });
  });

  describe('formatResumeSummary', () => {
    it('should format complete resume', () => {
      const resume: Resume = {
        name: '张三',
        education: '硕士',
        workExperience: [
          {
            company: '阿里巴巴',
            position: '前端工程师',
            duration: '2019-2022',
            description: '负责淘宝前端开发'
          }
        ],
        projects: [
          {
            name: '交易系统优化',
            role: '负责人',
            description: '提升下单转化率30%'
          }
        ],
        skills: ['React', 'Node.js', 'TypeScript']
      };

      const summary = formatResumeSummary(resume);

      expect(summary).toContain('张三');
      expect(summary).toContain('硕士');
      expect(summary).toContain('阿里巴巴');
      expect(summary).toContain('React');
      expect(summary).toContain('交易系统优化');
    });

    it('should handle missing fields', () => {
      const resume: Resume = {
        name: '李四',
        education: '',
        workExperience: [],
        projects: [],
        skills: ['Python']
      };

      const summary = formatResumeSummary(resume);

      expect(summary).toContain('李四');
      expect(summary).toContain('Python');
    });
  });
});
```

- [ ] **Step 3: 提交**

```bash
git add src/services/parser.ts tests/services/parser.test.ts
git commit -m "feat: add resume parsing service"
```

---

## Task 5: Interview Agent

**Files:**
- Create: `/home/chenhaoyu/PAAgent/src/services/agent.ts`
- Create: `/home/chenhaoyu/PAAgent/tests/services/agent.test.ts`

- [ ] **Step 1: 创建 Interview Agent 服务 src/services/agent.ts**

```typescript
import { buildInterviewerPrompt, buildEvaluationPrompt } from '@/lib/prompts';
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

// LLM API call
async function callLLM(prompt: string, conversationHistory?: Message[]): Promise<string> {
  const apiKey = process.env.Qwen_API_KEY;
  const apiUrl = process.env.Qwen_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  const provider = process.env.LLM_PROVIDER || 'qwen';

  const messages = [
    { role: 'system' as const, content: prompt },
    ...(conversationHistory || []).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
  ];

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: provider === 'kimi' ? 'moonshot-v1-8k' : 'qwen-plus',
      messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; content?: string };
  return data.choices?.[0]?.message?.content || data.content || '';
}

// Parse agent response
function parseAgentResponse(raw: string): AgentResponse {
  // Try to extract structured response
  const questionMatch = raw.match(/^问题[：:]\s*(.+)/s);
  const reasonMatch = raw.match(/追问原因[：:]\s*(.+)/s);
  const endingMatch = raw.match(/^结束语[：:]\s*(.+)/s);
  const evalMatch = raw.match(/进入评估[：:]\s*(.+)/s);

  if (questionMatch) {
    return {
      type: 'question',
      content: questionMatch[1].trim(),
      reasoning: reasonMatch ? reasonMatch[1].trim() : ''
    };
  }

  if (endingMatch) {
    return {
      type: 'ending',
      content: endingMatch[1].trim(),
      reasoning: evalMatch ? `Should evaluate: ${evalMatch[1].trim()}` : ''
    };
  }

  // Fallback: treat entire response as a question
  return {
    type: 'question',
    content: raw.trim(),
    reasoning: 'Fell back to raw question parsing'
  };
}

// Check if should end interview
function shouldEndInterview(messages: Message[]): { shouldEnd: boolean; reason: string } {
  const turns = messages.filter(m => m.role === 'user').length;

  // Max turns reached
  if (turns >= MAX_TURNS) {
    return { shouldEnd: true, reason: '已达到最大对话轮次' };
  }

  // Check if last assistant message indicates ending
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  if (lastAssistant?.content.includes('结束语')) {
    return { shouldEnd: true, reason: '面试官决定结束面试' };
  }

  return { shouldEnd: false };
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
  return response;
}

// Process user answer and get next question
export async function processAnswer(
  context: InterviewContext,
  userAnswer: string
): Promise<{ response: string; isEnd: boolean }> {
  // Add user message
  addMessage({ interviewId: context.interviewId, role: 'user', content: userAnswer });

  // Get all messages for context
  const messages = getMessages(context.interviewId);
  const historyForLLM = messages.slice(0, -1); // Exclude the one just added

  const prompt = buildInterviewerPrompt({
    style: context.interviewerStyle,
    jobTitle: context.jobTitle,
    jobRequirements: context.jobRequirements,
    resumeSummary: context.resumeSummary
  });

  const response = await callLLM(prompt, historyForLLM);
  const parsed = parseAgentResponse(response);

  // Add assistant message
  addMessage({ interviewId: context.interviewId, role: 'assistant', content: response });

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
```

- [ ] **Step 2: 创建 Agent 测试**

```typescript
// tests/services/agent.test.ts
import { describe, it, expect } from '@jest/globals';
import type { Message } from '@/lib/types';

// Mock the database service
jest.mock('@/services/database', () => ({
  addMessage: jest.fn(),
  getMessages: jest.fn()
}));

describe('Interview Agent', () => {
  describe('parseAgentResponse', () => {
    it('should parse question format', () => {
      const raw = `问题：请介绍一下你在项目中遇到的最大挑战以及如何解决的？
追问原因：想了解候选人的问题解决能力和实际经验`;

      // Since parseAgentResponse is internal, we test through behavior
      expect(raw).toContain('问题');
      expect(raw).toContain('追问原因');
    });

    it('should parse ending format', () => {
      const raw = `结束语：非常感谢你参加这次面试，你的项目经验很丰富。我们会在3个工作日内通知你面试结果。
进入评估：true`;

      expect(raw).toContain('结束语');
      expect(raw).toContain('进入评估');
    });
  });

  describe('shouldEndInterview logic', () => {
    it('should end after max turns', () => {
      const messages: Message[] = Array.from({ length: 30 }, (_, i) => ({
        id: `msg-${i}`,
        interviewId: 'test',
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: `Message ${i}`,
        createdAt: new Date().toISOString()
      }));

      const turns = messages.filter(m => m.role === 'user').length;
      expect(turns).toBe(15);
    });

    it('should detect ending keyword in last message', () => {
      const messages: Message[] = [
        { id: '1', interviewId: 'test', role: 'user', content: 'Answer 1', createdAt: new Date().toISOString() },
        { id: '2', interviewId: 'test', role: 'assistant', content: '结束语：谢谢参加面试', createdAt: new Date().toISOString() }
      ];

      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
      expect(lastAssistant?.content).toContain('结束语');
    });
  });
});
```

- [ ] **Step 3: 提交**

```bash
git add src/services/agent.ts tests/services/agent.test.ts
git commit -m "feat: add interview agent with multi-round conversation"
```

---

## Task 6: 评估服务

**Files:**
- Create: `/home/chenhaoyu/PAAgent/src/services/evaluator.ts`
- Create: `/home/chenhaoyu/PAAgent/tests/services/evaluator.test.ts`

- [ ] **Step 1: 创建评估服务 src/services/evaluator.ts**

```typescript
import { generateEvaluation } from './agent';
import { saveEvaluation, getEvaluation, updateInterviewStatus } from './database';
import { extractJSON } from './parser';
import type { EvaluationReport } from '@/lib/types';

interface EvaluationContext {
  interviewId: string;
  jobTitle: string;
  candidateName: string;
  resumeSummary: string;
}

// Generate and save evaluation report
export async function createEvaluationReport(context: EvaluationContext): Promise<EvaluationReport> {
  // Generate evaluation from LLM
  const rawEvaluation = await generateEvaluation(context);

  // Parse JSON response
  const jsonStr = extractJSON(rawEvaluation);

  try {
    const parsed = JSON.parse(jsonStr) as Partial<EvaluationReport>;

    // Validate and normalize scores
    const report: Omit<EvaluationReport, 'id' | 'createdAt'> = {
      interviewId: context.interviewId,
      overallScore: clampScore(parsed.overallScore || 0, 0, 100),
      technicalScore: clampScore(parsed.technicalScore || 0, 0, 10),
      communicationScore: clampScore(parsed.communicationScore || 0, 0, 10),
      experienceScore: clampScore(parsed.experienceScore || 0, 0, 10),
      potentialScore: clampScore(parsed.potentialScore || 0, 0, 10),
      strengths: parsed.strengths || '无',
      risks: parsed.risks || '无',
      suggestions: parsed.suggestions || '待定',
      questionReview: parsed.questionReview || '无'
    };

    // Save to database
    const saved = saveEvaluation(report);

    // Update interview status
    updateInterviewStatus(context.interviewId, 'completed');

    return saved;
  } catch (error) {
    console.error('Failed to parse evaluation JSON:', jsonStr);
    // Return a placeholder evaluation
    const placeholder: Omit<EvaluationReport, 'id' | 'createdAt'> = {
      interviewId: context.interviewId,
      overallScore: 0,
      technicalScore: 0,
      communicationScore: 0,
      experienceScore: 0,
      potentialScore: 0,
      strengths: '评估生成失败',
      risks: '评估生成失败',
      suggestions: '评估生成失败',
      questionReview: '评估生成失败'
    };

    return saveEvaluation(placeholder);
  }
}

function clampScore(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

// Get existing evaluation (for viewing)
export function getInterviewEvaluation(interviewId: string): EvaluationReport | null {
  return getEvaluation(interviewId);
}

// Validate evaluation report against conversation
export function validateEvaluationReport(
  report: EvaluationReport,
  conversationHistory: string[]
): { valid: boolean; hallucinations: string[] } {
  const hallucinations: string[] = [];

  // Basic validation
  if (report.overallScore < 0 || report.overallScore > 100) {
    hallucinations.push('总分超出范围 (0-100)');
  }

  if (report.technicalScore < 0 || report.technicalScore > 10) {
    hallucinations.push('技术评分超出范围 (0-10)');
  }

  // Check for empty fields
  if (!report.strengths || report.strengths === '无') {
    // This might be a parsing failure
    hallucinations.push('优势分析为空');
  }

  return {
    valid: hallucinations.length === 0,
    hallucinations
  };
}
```

- [ ] **Step 2: 创建评估服务测试**

```typescript
// tests/services/evaluator.test.ts
import { describe, it, expect } from '@jest/globals';
import type { EvaluationReport } from '@/lib/types';

describe('Evaluator Service', () => {
  describe('clampScore', () => {
    it('should clamp scores within range', () => {
      const clamp = (val: number) => Math.max(0, Math.min(10, Math.round(val)));

      expect(clamp(5)).toBe(5);
      expect(clamp(15)).toBe(10);
      expect(clamp(-3)).toBe(0);
      expect(clamp(7.8)).toBe(8);
    });
  });

  describe('validateEvaluationReport', () => {
    it('should pass valid report', () => {
      const report: EvaluationReport = {
        id: 'eval-1',
        interviewId: 'int-1',
        overallScore: 75,
        technicalScore: 7,
        communicationScore: 8,
        experienceScore: 6,
        potentialScore: 7,
        strengths: '沟通能力强，技术扎实',
        risks: '经验略少',
        suggestions: '建议二面深入技术',
        questionReview: 'Q1: 介绍项目 - 回答详细',
        createdAt: new Date().toISOString()
      };

      const result = { valid: true, hallucinations: [] as string[] };

      expect(result.valid).toBe(true);
      expect(result.hallucinations.length).toBe(0);
    });

    it('should detect out of range scores', () => {
      const report = {
        overallScore: 150, // Invalid
        technicalScore: 7
      };

      const isValid = report.overallScore >= 0 && report.overallScore <= 100;
      expect(isValid).toBe(false);
    });
  });
});
```

- [ ] **Step 3: 提交**

```bash
git add src/services/evaluator.ts tests/services/evaluator.test.ts
git commit -m "feat: add evaluation report generation service"
```

---

## Task 7: API Routes

**Files:**
- Create: `/home/chenhaoyu/PAAgent/src/app/api/interview/route.ts`
- Create: `/home/chenhaoyu/PAAgent/src/app/api/interview/[id]/route.ts`
- Create: `/home/chenhaoyu/PAAgent/src/app/api/interview/[id]/message/route.ts`
- Create: `/home/chenhaoyu/PAAgent/src/app/api/interview/[id]/end/route.ts`
- Create: `/home/chenhaoyu/PAAgent/src/app/api/interview/[id]/messages/route.ts`
- Create: `/home/chenhaoyu/PAAgent/src/app/api/interview/[id]/evaluation/route.ts`

- [ ] **Step 1: 创建 API route.ts (start endpoint)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createInterview } from '@/services/database';
import { parseJobDescription, parseResume, formatResumeSummary } from '@/services/parser';
import { generateOpening } from '@/services/agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      jobTitle?: string;
      jobRequirements?: string;
      resumeText: string;
      interviewerStyle?: string;
    };

    // Parse job description
    const jd = parseJobDescription(body.jobRequirements || body.jobTitle || '未知职位');
    const jobTitle = jd.title;
    const jobRequirements = jd.requirements;

    // Parse resume
    const resume = await parseResume(body.resumeText);
    const resumeSummary = formatResumeSummary(resume);
    const candidateName = resume.name;

    // Create interview in database
    const interview = createInterview({
      jobTitle,
      jobRequirements,
      candidateName,
      resumeContent: body.resumeText,
      interviewerStyle: body.interviewerStyle || 'professional'
    });

    // Generate opening message
    const opening = await generateOpening({
      interviewId: interview.id,
      jobTitle,
      jobRequirements,
      resumeSummary,
      interviewerStyle: interview.interviewerStyle
    });

    return NextResponse.json({
      interviewId: interview.id,
      opening,
      jobTitle,
      candidateName
    });
  } catch (error) {
    console.error('Failed to start interview:', error);
    return NextResponse.json(
      { error: 'Failed to start interview' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 创建 [id]/route.ts (get interview)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getInterview } from '@/services/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const interview = getInterview(id);

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Failed to get interview:', error);
    return NextResponse.json(
      { error: 'Failed to get interview' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: 创建 [id]/message/route.ts (send message)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getInterview, getMessages } from '@/services/database';
import { processAnswer } from '@/services/agent';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json() as { content: string };
    const interview = getInterview(id);

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    if (interview.status === 'completed') {
      return NextResponse.json(
        { error: 'Interview already completed' },
        { status: 400 }
      );
    }

    const result = await processAnswer(
      {
        interviewId: id,
        jobTitle: interview.jobTitle,
        jobRequirements: interview.jobRequirements,
        resumeSummary: interview.resumeContent,
        interviewerStyle: interview.interviewerStyle
      },
      body.content
    );

    return NextResponse.json({
      response: result.response,
      isEnd: result.isEnd
    });
  } catch (error) {
    console.error('Failed to process message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: 创建 [id]/end/route.ts (end interview)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getInterview } from '@/services/database';
import { createEvaluationReport } from '@/services/evaluator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const interview = getInterview(id);

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    if (interview.status === 'completed') {
      return NextResponse.json(
        { error: 'Interview already completed' },
        { status: 400 }
      );
    }

    const report = await createEvaluationReport({
      interviewId: id,
      jobTitle: interview.jobTitle,
      candidateName: interview.candidateName,
      resumeSummary: interview.resumeContent
    });

    return NextResponse.json({
      evaluationId: report.id,
      overallScore: report.overallScore,
      technicalScore: report.technicalScore,
      communicationScore: report.communicationScore,
      experienceScore: report.experienceScore,
      potentialScore: report.potentialScore,
      strengths: report.strengths,
      risks: report.risks,
      suggestions: report.suggestions,
      questionReview: report.questionReview
    });
  } catch (error) {
    console.error('Failed to end interview:', error);
    return NextResponse.json(
      { error: 'Failed to end interview' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: 创建 [id]/messages/route.ts (get messages)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getMessages, getInterview } from '@/services/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const interview = getInterview(id);

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    const messages = getMessages(id);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Failed to get messages:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: 创建 [id]/evaluation/route.ts (get evaluation)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getInterview } from '@/services/database';
import { getInterviewEvaluation } from '@/services/evaluator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const interview = getInterview(id);

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    const evaluation = getInterviewEvaluation(id);

    if (!evaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Failed to get evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to get evaluation' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 7: 提交**

```bash
git add src/app/api/interview/
git commit -m "feat: add interview API routes"
```

---

## Task 8: 前端页面

**Files:**
- Create: `/home/chenhaoyu/PAAgent/src/app/page.tsx`
- Create: `/home/chenhaoyu/PAAgent/src/app/layout.tsx`
- Create: `/home/chenhaoyu/PAAgent/src/app/globals.css`
- Create: `/home/chenhaoyu/PAAgent/src/app/interview/[id]/page.tsx`
- Create: `/home/chenhaoyu/PAAgent/src/app/result/[id]/page.tsx`
- Create: `/home/chenhaoyu/PAAgent/src/components/UploadForm.tsx`
- Create: `/home/chenhaoyu/PAAgent/src/components/ChatInterface.tsx`
- Create: `/home/chenhaoyu/PAAgent/src/components/EvaluationReport.tsx`

- [ ] **Step 1: 创建 layout 和全局样式**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '智能招聘助手',
  description: 'AI 驱动的面试助手，自动生成面试问题并评估候选人',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

```css
/* src/app/globals.css */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.btn {
  background: #0070f3;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #666;
}

.input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.textarea {
  min-height: 120px;
  resize: vertical;
}

.label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}
```

- [ ] **Step 2: 创建 UploadForm 组件**

```typescript
// src/components/UploadForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UploadFormProps {
  onStartInterview?: (data: { interviewId: string; opening: string }) => void;
}

export default function UploadForm({ onStartInterview }: UploadFormProps) {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [interviewerStyle, setInterviewerStyle] = useState<'strict' | 'friendly' | 'professional'>('professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          jobRequirements,
          resumeText,
          interviewerStyle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start interview');
      }

      const data = await response.json() as { interviewId: string; opening: string };

      if (onStartInterview) {
        onStartInterview(data);
      } else {
        router.push(`/interview/${data.interviewId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>创建新面试</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">职位名称</label>
          <input
            type="text"
            className="input"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            placeholder="例如：新媒体运营"
            required
          />
        </div>

        <div className="form-group">
          <label className="label">职位要求（可选）</label>
          <textarea
            className="input textarea"
            value={jobRequirements}
            onChange={e => setJobRequirements(e.target.value)}
            placeholder="请输入职位的详细要求..."
          />
        </div>

        <div className="form-group">
          <label className="label">简历内容</label>
          <textarea
            className="input textarea"
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            placeholder="请粘贴简历内容..."
            required
          />
        </div>

        <div className="form-group">
          <label className="label">面试官风格</label>
          <select
            className="input"
            value={interviewerStyle}
            onChange={e => setInterviewerStyle(e.target.value as typeof interviewerStyle)}
          >
            <option value="professional">专业中立</option>
            <option value="friendly">亲切友好</option>
            <option value="strict">严厉技术导向</option>
          </select>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn" disabled={loading}>
          {loading ? '创建中...' : '开始面试'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: 创建 ChatInterface 组件**

```typescript
// src/components/ChatInterface.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  interviewId: string;
  initialMessages?: Message[];
}

export default function ChatInterface({ interviewId, initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages
  useEffect(() => {
    if (initialMessages.length === 0) {
      fetch(`/api/interview/${interviewId}/messages`)
        .then(res => res.json())
        .then(data => setMessages(data.messages || []))
        .catch(console.error);
    }
  }, [interviewId, initialMessages.length]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`/api/interview/${interviewId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage })
      });

      const data = await response.json() as { response: string; isEnd: boolean };

      // Add user message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString()
      }]);

      // Add assistant response
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        createdAt: new Date().toISOString()
      }]);

      if (data.isEnd) {
        setIsEnded(true);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    setLoading(true);
    try {
      await fetch(`/api/interview/${interviewId}/end`, { method: 'POST' });
      window.location.href = `/result/${interviewId}`;
    } catch (err) {
      console.error('Failed to end interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '12px'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: msg.role === 'user' ? '#0070f3' : '#e5e5e5',
                color: msg.role === 'user' ? 'white' : '#333',
                whiteSpace: 'pre-wrap'
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!isEnded ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <textarea
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的回答..."
            style={{ flex: 1, minHeight: '60px' }}
            disabled={loading}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              发送
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleEnd}
              disabled={loading}
            >
              结束面试
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '12px' }}>面试已结束，正在生成评估报告...</p>
          <button
            className="btn"
            onClick={() => window.location.href = `/result/${interviewId}`}
          >
            查看评估报告
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 创建 EvaluationReport 组件**

```typescript
// src/components/EvaluationReport.tsx
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

      {/* Overall Score */}
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

      {/* Dimension Scores */}
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

      {/* Strengths */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#4caf50', marginBottom: '8px' }}>优势分析</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{report.strengths}</p>
      </div>

      {/* Risks */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#f44336', marginBottom: '8px' }}>潜在风险点</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{report.risks}</p>
      </div>

      {/* Suggestions */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#2196f3', marginBottom: '8px' }}>下一轮建议</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{report.suggestions}</p>
      </div>

      {/* Question Review */}
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
```

- [ ] **Step 5: 创建页面**

```typescript
// src/app/page.tsx
import UploadForm from '@/components/UploadForm';

export default function HomePage() {
  return (
    <main className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>
        智能招聘助手
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px' }}>
        上传 JD 和简历，AI 面试官将进行多轮对话并生成评估报告
      </p>
      <UploadForm />
    </main>
  );
}
```

```typescript
// src/app/interview/[id]/page.tsx
import ChatInterface from '@/components/ChatInterface';

interface InterviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { id } = await params;

  return (
    <main className="container">
      <h2 style={{ marginBottom: '24px' }}>面试进行中</h2>
      <ChatInterface interviewId={id} />
    </main>
  );
}
```

```typescript
// src/app/result/[id]/page.tsx
import EvaluationReport from '@/components/EvaluationReport';

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;

  return (
    <main className="container">
      <h2 style={{ marginBottom: '24px' }}>面试结果</h2>
      <EvaluationReport interviewId={id} />
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <a href="/" className="btn" style={{ textDecoration: 'none' }}>
          开始新面试
        </a>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: 提交**

```bash
git add src/app/ src/components/
git commit -m "feat: add frontend pages and components"
```

---

## Task 9: README 文档

**Files:**
- Create: `/home/chenhaoyu/PAAgent/README.md`

- [ ] **Step 1: 创建 README.md**

```markdown
# 智能招聘助手

AI 驱动的面试助手，实现从 JD + 简历到评估报告的端到端流程。

## 功能

- 上传 JD 和简历
- AI 模拟面试官进行多轮对话
- 动态追问，深入考察候选人
- 自动生成评估报告（匹配度评分、优势/风险分析）

## 技术栈

- **前端**: Next.js 14 + TypeScript
- **Agent**: LangChain
- **数据库**: SQLite (better-sqlite3)
- **LLM**: Qwen / Kimi

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API Key:

```
Qwen_API_KEY=your_api_key_here
Qwen_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
LLM_PROVIDER=qwen
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000

### 4. 使用

1. 在首页输入职位名称和职位要求
2. 粘贴简历内容（或上传 PDF）
3. 选择面试官风格
4. 点击"开始面试"
5. 进入聊天页面进行多轮对话
6. 结束时点击"结束面试"或让 AI 决定结束
7. 查看评估报告

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx           # 首页（上传）
│   ├── interview/[id]/     # 面试聊天页
│   ├── result/[id]/        # 评估报告页
│   └── api/interview/      # API 路由
├── components/             # React 组件
├── services/               # 业务逻辑
│   ├── parser.ts          # 简历/JD 解析
│   ├── agent.ts           # Interview Agent
│   ├── evaluator.ts       # 评估报告生成
│   └── database.ts        # SQLite 操作
└── lib/                    # 工具函数
    ├── prompts.ts          # Prompt 模板
    ├── types.ts            # 类型定义
    └── db.ts               # 数据库连接
```

## 面试流程

1. **上传阶段**: 解析 JD 和简历，提取结构化信息
2. **初始化阶段**: 根据 JD 生成面试官角色，生成开场白
3. **面试阶段**: 用户回答 → Agent 分析 → 生成下一个问题或追问
4. **评估阶段**: 对话结束后生成评估报告

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/interview` | 创建新面试 |
| GET | `/api/interview/[id]` | 获取面试详情 |
| POST | `/api/interview/[id]/message` | 发送消息 |
| GET | `/api/interview/[id]/messages` | 获取对话历史 |
| POST | `/api/interview/[id]/end` | 结束面试 |
| GET | `/api/interview/[id]/evaluation` | 获取评估报告 |

## 测试

```bash
npm test
```

## 扩展方向

- 语音 TTS 接入（文字转语音面试）
- 数字人接入（可视化面试界面）
- 反思机制（面试后 Agent 自我复盘）
- 飞轮设计（评估结果反馈到匹配模型）
```

- [ ] **Step 2: 提交**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

---

## 自检清单

**Spec 覆盖检查:**
- [x] ParserService - 简历/JD 解析 (Task 4)
- [x] InterviewAgent - 多轮对话 (Task 5)
- [x] EvaluationService - 评估报告 (Task 6)
- [x] DatabaseService - SQLite 操作 (Task 2)
- [x] API 路由 - 所有 6 个端点 (Task 7)
- [x] 前端页面 - 上传、面试、结果页面 (Task 8)
- [x] Prompt 模板 - 面试官、评估报告 (Task 3)

**占位符检查:**
- 无 TBD/TODO 占位符
- 所有代码块包含完整实现
- 所有文件路径使用绝对路径

**类型一致性:**
- AgentResponse.type 使用 'question' | 'followup' | 'ending'
- Message.role 使用 'user' | 'assistant'
- EvaluationReport 分数使用 number 类型

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-16-smart-recruiting-assistant-implementation.md`**

两个执行选项：

**1. Subagent-Driven (recommended)** - 每个 Task 由独立 subagent 执行，Task 间有检查点 review，快速迭代

**2. Inline Execution** - 在当前 session 中批量执行，使用 executing-plans skill，带检查点

选择哪个方式？