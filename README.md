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
2. 粘贴简历内容
3. 选择面试官风格
4. 点击"开始面试"
5. 进入聊天页面进行多轮对话
6. 结束时点击"结束面试"
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
    ├── db.ts               # 数据库连接
    └── llm.ts              # LLM API 客户端
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
