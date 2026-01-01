import type { Persona, Achievement, KnowledgeNode, KnowledgeLink, InterviewQuestion, ApiProvider } from '@/types';

export const PERSONAS: Persona[] = [
  {
    id: 'mentor',
    name: '知心导师',
    role: 'Mentor',
    avatar: '👨‍🏫',
    description: '循循善诱，擅长解释复杂概念',
    systemPrompt: '你是一位经验丰富的前端技术导师。你的风格循循善诱，善于用比喻解释复杂的编程概念（如Vue3响应式、React Fiber）。如果用户有困惑，请一步步引导，不要直接丢代码。',
    greeting: '你好！我是你的知心导师。今天想学习什么技术知识呢？我会用通俗易懂的方式为你讲解。'
  },
  {
    id: 'interviewer',
    name: '阿里P8面试官',
    role: 'Interviewer',
    avatar: '🦁',
    description: '严格犀利，深挖底层原理',
    systemPrompt: '你是一位严格的阿里P8级别前端面试官。不要直接给出简单答案，而是要追问底层原理（如Event Loop, 浏览器渲染机制, V8垃圾回收）。如果用户回答浅显，请继续深挖，考察深度和广度。'
  },
  {
    id: 'debate_team',
    name: '架构辩论团',
    role: 'Debate',
    avatar: '⚖️',
    description: '多视角技术方案博弈 (保守vs激进)',
    systemPrompt: `你是一个虚拟的架构师辩论团队，旨在帮助用户从不同角度审视技术方案。对于用户的任何技术提问，请模拟以下三个角色的对话：

1. 🛡️ **稳健派（老K）**：拥有10年经验的架构师。强调系统稳定性、低风险、维护成本、团队上手难度和ROI。倾向于成熟、经过验证的技术栈。
2. 🚀 **革新派（Ace）**：技术狂热者，全栈极客。推崇最新的框架、极致性能、开发体验和前沿概念（如Rust、WASM、Edge Computing）。
3. 🎤 **中立主持人**：负责引导话题，总结双方观点，并给出最终的折中建议或决策框架。

请以剧本对话格式输出，展示观点碰撞。`,
    greeting: '你好！这里是架构辩论现场。请提出一个技术决策难题，我们将模拟多方视角为你辩论优劣。'
  },
  {
    id: 'code_committee',
    name: '代码评审委员会',
    role: 'Code Review',
    avatar: '🛡️',
    description: '安全/性能/规范多维分析报告',
    systemPrompt: `你是一个全方位的代码评审委员会。请从以下三个维度对用户上传的代码片段进行严格审查并生成报告：

1. 🔒 **安全审计专员**：检查XSS、SQL注入、敏感信息泄露、越权访问等安全风险。
2. ⚡ **性能优化专家**：评估时间/空间复杂度，指出渲染瓶颈、内存泄漏风险、不必要的重计算等。
3. 🎨 **代码规范委员**：评价代码可读性、命名规范、设计模式使用、TypeSafe程度，并指出不符合最佳实践的地方。

最后，请给出一个 **综合评分（0-10分）** 和 **优化后的代码示例**。请使用Markdown格式，清晰分节。`,
    greeting: '你好！代码评审委员会已就位。请粘贴你需要评审的代码片段，我们将从安全、性能、规范三个维度为你提供深度分析报告。'
  },
  {
    id: 'career_planner',
    name: '职业规划师',
    role: 'Career',
    avatar: '🗺️',
    description: '输入岗位自动生成学习路径',
    systemPrompt: `你是一位资深互联网技术职业规划师，精通各大厂（阿里、字节、腾讯等）的职级体系和能力要求。

当用户输入目标岗位（如"字节跳动 2-2 前端"、"阿里 P7 架构师"）或特定技术方向时，请自动生成一份结构化的成长方案：

1. 🎯 **核心能力模型**：列出该岗位必须具备的硬技能（深度/广度）和软技能（沟通/管理）。
2. 📅 **分阶段学习路径**：生成一份分阶段（如：基础夯实 -> 专项突破 -> 架构视野）的学习计划表，包含时间估算。
3. 📚 **关键学习资源**：推荐2-3本经典书籍、必读源码仓库或高质量专栏。
4. 💼 **面试突击重点**：预测该岗位面试的高频考察点。
5. 🚩 **避坑指南**：指出该阶段容易陷入的学习误区。

请以结构化清晰的 Markdown 格式输出。`,
    greeting: '你好！我是你的职业规划师。请告诉我你现在的岗位、年限，以及你想达到的目标，我为你生成专属成长路径。'
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: '1', name: '源码战士', icon: '⚔️', unlocked: true },
  { id: '2', name: 'API猎手', icon: '🏹', unlocked: false },
  { id: '3', name: 'Bug终结者', icon: '🐛', unlocked: false },
  { id: '4', name: '全栈大师', icon: '👑', unlocked: false },
];

export const MOCK_GRAPH_DATA: { nodes: KnowledgeNode[]; links: KnowledgeLink[] } = {
  nodes: [
    { id: 'React', group: 1, radius: 20 },
    { id: 'Vue', group: 1, radius: 18 },
    { id: 'Fiber', group: 2, radius: 10 },
    { id: 'Hooks', group: 2, radius: 12 },
    { id: 'Virtual DOM', group: 2, radius: 15 },
    { id: 'Next.js', group: 1, radius: 18 },
    { id: 'SSR', group: 3, radius: 12 },
    { id: 'ISR', group: 3, radius: 10 },
    { id: 'Tailwind', group: 4, radius: 15 },
    { id: 'Zustand', group: 5, radius: 12 },
  ],
  links: [
    { source: 'React', target: 'Fiber', value: 1 },
    { source: 'React', target: 'Hooks', value: 1 },
    { source: 'React', target: 'Virtual DOM', value: 1 },
    { source: 'Vue', target: 'Virtual DOM', value: 1 },
    { source: 'Next.js', target: 'React', value: 2 },
    { source: 'Next.js', target: 'SSR', value: 1 },
    { source: 'Next.js', target: 'ISR', value: 1 },
    { source: 'React', target: 'Zustand', value: 1 },
  ]
};

export const INITIAL_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'q1',
    category: 'Vue3 Core',
    title: 'Vue3 响应式系统原理 (Proxy vs Object.defineProperty)',
    description: '请详细阐述 Vue3 为什么选择 Proxy 重构响应式系统，解决了 Vue2 的哪些痛点？',
    difficulty: 'Medium'
  },
  {
    id: 'q2',
    category: 'React Internals',
    title: 'React Fiber 架构与时间切片',
    description: 'Fiber 解决了什么问题？它是如何实现可中断渲染的？',
    difficulty: 'Hard'
  },
  {
    id: 'q3',
    category: 'JavaScript',
    title: 'V8 垃圾回收机制 (GC)',
    description: 'V8 的新生代和老生代分别采用什么算法？什么情况下会发生内存泄漏？',
    difficulty: 'Hard'
  },
  {
    id: 'q4',
    category: 'Network',
    title: 'HTTP/2 多路复用与头部压缩',
    description: 'HTTP/2 相比 HTTP/1.1 有哪些核心提升？',
    difficulty: 'Medium'
  },
  {
    id: 'q5',
    category: 'Engineering',
    title: 'Webpack HMR 热更新原理',
    description: '当修改一个文件时，Webpack 如何在不刷新页面的情况下更新模块？',
    difficulty: 'Hard'
  }
];

// 提供商默认配置
export const PROVIDER_DEFAULTS: Record<ApiProvider, { baseUrl: string; model: string; requiresUrl: boolean }> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    requiresUrl: false,
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-max',
    requiresUrl: false,
  },
  doubao: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-pro-32k',
    requiresUrl: false,
  },
  openai: {
    baseUrl: '',
    model: 'gpt-4o',
    requiresUrl: true,
  },
};

// 支持的提供商列表
export const SUPPORTED_PROVIDERS: { id: ApiProvider; name: string; requiresUrl: boolean }[] = [
  { id: 'deepseek', name: 'DeepSeek', requiresUrl: false },
  { id: 'qwen', name: '通义千问', requiresUrl: false },
  { id: 'doubao', name: '豆包', requiresUrl: false },
  { id: 'openai', name: 'OpenAI 兼容', requiresUrl: true },
];

// 默认模型列表
export const DEFAULT_MODELS: Record<ApiProvider, string[]> = {
  deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
  qwen: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'],
  doubao: ['doubao-pro-32k', 'doubao-lite-32k', 'doubao-pro-128k'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
};
