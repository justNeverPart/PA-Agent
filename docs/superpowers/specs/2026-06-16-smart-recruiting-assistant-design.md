# 智能招聘助手 MVP - 设计文档

**日期**: 2026-06-16
**版本**: v1.0
**状态**: 已批准

---

## 1. 项目概述

### 1.1 背景
AI 招聘助手是一个端到端闭环系统，实现从"输入非结构化数据（JD + 简历）"到"输出结构化决策建议（面试评估报告）"的完整 AI 处理流程。

### 1.2 核心主线
**场景 B：AI 模拟面试官 Agent**

输入 JD（职位描述）和简历（PDF/Word），通过多轮对话完成面试，并生成评估报告。

### 1.3 技术栈

| 类别 | 选择 |
|------|------|
| 前端/交互 | Next.js + API |
| Agent 框架 | LangChain |
| 对话历史 | SQLite |
| LLM | Qwen / Kimi |
| 简历解析 | PDF 解析库 + LLM 提取 |

---

## 2. 架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │  Upload  │  │  Chat    │  │  Evaluation Report    │  │
│  │  Page    │  │  Room    │  │  Page                 │  │
│  └────┬─────┘  └────┬─────┘  └───────────┬───────────┘  │
│       │             │                    │              │
│       └─────────────┼────────────────────┘              │
│                     ▼                                   │
│              /api/interview                             │
│                     │                                   │
│       ┌─────────────┴─────────────┐                     │
│       ▼                           ▼                     │
│  ┌─────────┐              ┌─────────────┐               │
│  │ Parser  │              │ Interview   │               │
│  │ Service │              │ Agent       │               │
│  └────┬────┘              └──────┬──────┘               │
│       │                          │                      │
│       ▼                          ▼                      │
│  ┌─────────┐              ┌─────────────┐               │
│  │ SQLite  │              │  LLM API    │               │
│  │(History)│              │(Qwen/Kimi)  │               │
│  └─────────┘              └─────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### 2.2 数据流

1. **上传阶段**: 用户上传 JD + 简历 → ParserService 提取结构化信息 → 存入 SQLite
2. **初始化阶段**: 根据 JD 生成面试官角色（System Prompt）→ 初始化 InterviewAgent
3. **面试阶段**: 用户发送回答 → Agent 记忆上下文 → 生成下一个问题或追问
4. **评估阶段**: 对话结束后 → 调用 LLM 生成评估报告

### 2.3 核心组件

| 组件 | 职责 |
|------|------|
| `ParserService` | 解析 JD/简历，提取关键信息 |
| `InterviewAgent` | 核心 Agent，处理多轮对话 |
| `EvaluationService` | 生成评估报告 |
| `DatabaseService` | SQLite 操作，对话历史存储 |

---

## 3. 功能模块

### 3.1 上传模块

**功能**:
- 支持上传 JD（文本输入或文件）
- 支持上传简历（PDF/Word）
- 支持简历格式：PDF、DOCX、TXT

**数据提取**:
- JD 提取：职位名、核心职责、任职要求、加分项
- 简历提取：姓名、学历、工作经历、项目经验、技能

### 3.2 面试 Agent 模块

**角色设定**:
- 根据 JD 信息，初始化面试官风格（严厉技术总监/亲切 HR/专业面试官）
- 通过 System Prompt 控制角色行为

**多轮对话**:
- 开场白：自我介绍 + 职位介绍
- 问题生成：基于简历和 JD 生成相关问题
- 动态追问：根据回答内容深入追问
- 结束判断：根据回答质量决定是否进入下一问题或结束面试

**记忆能力**:
- 完整保留面试对话历史
- 基于历史回答生成追问

### 3.3 评估报告模块

**报告内容**:
- 岗位匹配度评分（0-100）
- 各维度评分：技术能力、沟通能力、项目经验、潜力
- 候选人优势分析
- 潜在风险点
- 下一轮考察建议
- 面试问题回顾

---

## 4. Prompt 设计

### 4.1 面试官 System Prompt 模板

```
你是一位{风格}的面试官，面试职位是{职位名}。

职位核心要求：
{JD关键点}

候选人背景：
{简历摘要}

面试规则：
1. 先做简短开场，介绍自己和职位
2. 每个问题后根据回答决定：追问 / 问下一个问题 / 结束面试
3. 问题要具体，结合简历中的经历
4. 保持角色一致性，语言风格{严肃/亲切/技术导向}
5. 如果回答不充分，追问直到获得有效信息
6. 面试通常进行5-8个问题后结束

输出格式：
- 问题：[具体面试问题]
- 追问原因：[为什么问这个问题/追问什么]
或者
- 结束语：[总结面试，感谢候选人]
```

### 4.2 评估报告 Prompt 模板

```
作为资深面试官，请根据以下面试记录生成评估报告。

职位：{职位名}
候选人：{简历摘要}

面试记录：
{完整对话历史}

请生成以下格式的报告：

## 岗位匹配度
评分：{0-100}

## 各维度评分
- 技术能力：{评分}/10
- 沟通表达：{评分}/10
- 项目经验：{评分}/10
- 发展潜力：{评分}/10

## 优势分析
{3-5条}

## 潜在风险点
{2-3条}

## 下一轮建议
{具体建议}

## 面试问题回顾
{问题列表及回答摘要}
```

---

## 5. 数据库设计

### 5.1 SQLite 表结构

```sql
-- 面试会话表
CREATE TABLE interviews (
    id TEXT PRIMARY KEY,
    job_title TEXT,
    job_requirements TEXT,
    candidate_name TEXT,
    resume_content TEXT,
    interviewer_style TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 对话历史表
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    interview_id TEXT,
    role TEXT, -- 'user' | 'assistant'
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (interview_id) REFERENCES interviews(id)
);

-- 评估报告表
CREATE TABLE evaluations (
    id TEXT PRIMARY KEY,
    interview_id TEXT UNIQUE,
    overall_score INTEGER,
    technical_score INTEGER,
    communication_score INTEGER,
    experience_score INTEGER,
    potential_score INTEGER,
    strengths TEXT,
    risks TEXT,
    suggestions TEXT,
    question_review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (interview_id) REFERENCES interviews(id)
);
```

---

## 6. API 设计

### 6.1 接口列表

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/interview/start` | 创建新面试会话 |
| POST | `/api/interview/{id}/message` | 发送消息并获取回复 |
| POST | `/api/interview/{id}/end` | 结束面试并生成报告 |
| GET | `/api/interview/{id}` | 获取面试详情 |
| GET | `/api/interview/{id}/messages` | 获取对话历史 |
| GET | `/api/interview/{id}/evaluation` | 获取评估报告 |

### 6.2 请求/响应示例

**POST /api/interview/start**
```json
// Request
{
  "jobTitle": "新媒体运营",
  "jobRequirements": "熟悉小红书、抖音平台...",
  "resumeText": "姓名：小明\n学历：本科...",
  "interviewerStyle": "professional"
}

// Response
{
  "interviewId": "uuid-xxx",
  "opening": "你好，我是xxx，今天面试的是新媒体运营岗位..."
}
```

**POST /api/interview/{id}/message**
```json
// Request
{
  "content": "我之前在小红书做过..."
}

// Response
{
  "messageId": "uuid-yyy",
  "response": "感谢你的分享，能否详细说说...",
  "isEnd": false
}
```

---

## 7. 项目结构

```
/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # 首页（上传）
│   │   ├── interview/[id]/page.tsx  # 面试页面
│   │   ├── result/[id]/page.tsx     # 评估报告页
│   │   └── api/
│   │       └── interview/
│   │           ├── route.ts         # 面试 API 入口
│   │           └── [id]/
│   │               └── route.ts     # 单个面试 API
│   ├── components/
│   │   ├── UploadForm.tsx
│   │   ├── ChatInterface.tsx
│   │   └── EvaluationReport.tsx
│   ├── services/
│   │   ├── parser.ts                # 简历/JD 解析
│   │   ├── agent.ts                 # Interview Agent
│   │   ├── evaluator.ts             # 评估报告生成
│   │   └── database.ts              # SQLite 操作
│   └── lib/
│       ├── prompts.ts               # Prompt 模板
│       └── types.ts                 # 类型定义
├── data/
│   └── interview.db                 # SQLite 数据库
├── .env                             # 环境变量（API Key）
├── package.json
└── README.md
```

---

## 8. 验收标准

### 8.1 功能验收

- [ ] 可以上传 JD 和简历
- [ ] 面试 Agent 可以进行多轮对话
- [ ] Agent 可以根据回答动态追问
- [ ] 面试结束后可以生成评估报告
- [ ] 对话历史正确保存和加载

### 8.2 技术验收

- [ ] API Key 不硬编码，使用 .env 管理
- [ ] 核心逻辑有注释
- [ ] 异常处理得当（格式错误、API 超时等）
- [ ] 代码结构清晰，模块职责明确

### 8.3 文档验收

- [ ] README.md 包含环境配置、启动步骤
- [ ] README.md 包含架构设计说明
- [ ] README.md 包含核心 Prompt 设计思路

---

## 9. Harness 设计

### 9.1 轻量级验证机制

MVP 阶段采用简化的 Harness 验证，不引入复杂框架：

```typescript
// src/lib/harness.ts
interface ValidationResult {
  valid: boolean;
  errors?: string[];
  hallucinations?: string[];
}

const validationChecks = {
  // 1. 格式验证：输出是否为有效 JSON
  isValidJSON: (text: string): boolean => {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  },

  // 2. 必需字段检查
  hasRequiredFields: (report: EvaluationReport): boolean => {
    return !!(
      report.overall_score >= 0 &&
      report.technical_score >= 0 &&
      report.strengths &&
      report.risks
    );
  },

  // 3. 评分范围检查（0-100）
  isScoreValid: (score: number): boolean => score >= 0 && score <= 100,

  // 4. 对话轮次限制（防止无限循环）
  checkMaxTurns: (messages: Message[], max: number = 15): boolean => {
    return messages.length < max * 2; // user + assistant
  }
};
```

### 9.2 后续扩展方向

- LangChain `TrajectoryEvalChain` 用于 Agent 轨迹评估
- 自定义评测数据集（Golden Dataset）
- A/B Prompt 对比实验框架

---

## 10. 幻觉与格式错误处理

### 10.1 策略 1：输出格式强制约束

```typescript
// Prompt 中使用 XML 标签强制格式
const FORMAT_CONSTRAINT = `
输出必须严格遵循以下 JSON 格式，禁止添加任何额外内容：
{
  "type": "question" | "followup" | "ending",
  "content": "具体内容",
  "reasoning": "生成这个回答的思考过程"
}
`;

// 解析时使用 try-catch + 默认值
function parseAgentResponse(raw: string): AgentResponse {
  try {
    const json = extractJSON(raw); // 提取 JSON 部分
    return JSON.parse(json);
  } catch {
    // 降级处理：返回格式错误提示而非崩溃
    return {
      type: "question",
      content: "抱歉，我需要重新组织一下语言，请稍等...",
      reasoning: "JSON解析失败，降级处理"
    };
  }
}
```

### 10.2 策略 2：评分数据幻觉防护

```typescript
// 评估报告中增加数据来源标注
const REPORT_CONSTRAINT = `
重要约束：
1. 评分必须基于【面试记录】中的实际对话内容
2. 优势分析必须引用候选人的具体回答
3. 风险点必须与面试中的负面信号对应
4. 禁止编造候选人说过的内容
`;

// 自验证：生成后检查报告内容与对话记录的一致性
function validateReport(
  report: EvaluationReport,
  messages: Message[]
): ValidationResult {
  const candidateStatements = extractStatements(messages, 'user');
  const reportStatements = extractStatements(report.strengths + report.risks);

  const unsupported = reportStatements.filter(
    (s) => !isSupported(s, candidateStatements)
  );

  if (unsupported.length > 0) {
    return { valid: false, hallucinations: unsupported };
  }
  return { valid: true };
}
```

### 10.3 策略 3：对话轮次保护

```typescript
const MAX_TURNS = 15;

function shouldEndInterview(
  messages: Message[],
  jobRequirements: string
): { shouldEnd: boolean; reason: string } {
  // 达到最大轮次强制结束
  if (messages.length >= MAX_TURNS * 2) {
    return { shouldEnd: true, reason: "已达到最大对话轮次" };
  }

  // 检查核心要求是否已覆盖
  const coveredRequirements = checkCoverage(messages, jobRequirements);
  if (coveredRequirements >= 0.8) {
    return { shouldEnd: true, reason: "核心要求已覆盖" };
  }

  return { shouldEnd: false };
}
```

---

## 11. 后续扩展（可选）

- 场景 A 串联：简历解析后自动生成面试题
- 语音 TTS 接入：文字转语音面试
- 数字人接入：可视化面试界面
- 反思机制：面试后 Agent 自我复盘
- 飞轮设计：评估结果反馈到匹配模型持续优化