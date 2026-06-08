/**
 * Model Gateway - 统一模型调用入口
 * 基于 Vocos 4.0 的 model-gateway.mjs 设计理念
 * 核心职责：路由、降级、重试、Token 统计、成本计算
 */

interface ModelCallParams {
  agentCode: string;
  systemPrompt: string;
  userPrompt: string;
  responseFormat?: 'json_object' | 'text';
  temperature?: number;
  maxTokens?: number;
}

interface ModelCallResult {
  success: boolean;
  content: string;
  modelName: string;
  providerName: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
  retryCount: number;
  fallbackUsed: boolean;
  error?: string;
}

interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: {
    name: string;
    type: 'fast' | 'reasoning' | 'powerful';
    inputPrice: number; // per 1K tokens
    outputPrice: number; // per 1K tokens
  }[];
}

// Agent → Model 路由映射
const AGENT_MODEL_MAP: Record<string, { primary: string; fallback?: string }> = {
  'agent-00': { primary: 'deepseek-v4-flash' },
  'agent-01': { primary: 'deepseek-v4-pro', fallback: 'gpt-4.1' },
  'agent-02': { primary: 'deepseek-v4-flash' },
  'agent-03': { primary: 'deepseek-v4-flash' },
  'agent-04': { primary: 'deepseek-v4-flash' },
  'agent-05': { primary: 'deepseek-v4-flash', fallback: 'gpt-4.1-mini' },
  'agent-06': { primary: 'deepseek-v4-pro', fallback: 'gpt-4.1' },
  'agent-07': { primary: 'deepseek-v4-pro', fallback: 'gpt-4.1' },
  'agent-08': { primary: 'gpt-4.1', fallback: 'deepseek-v4-pro' },
  'agent-09': { primary: 'deepseek-v4-pro', fallback: 'gpt-4.1' },
  'agent-10': { primary: 'gpt-4.1', fallback: 'deepseek-v4-pro' },
  'agent-11': { primary: 'gpt-4.1', fallback: 'deepseek-v4-pro' },
  'agent-12': { primary: 'deepseek-v4-pro', fallback: 'gpt-4.1' },
  'agent-13': { primary: 'gpt-4.1', fallback: 'deepseek-v4-pro' },
  'agent-14': { primary: 'deepseek-v4-pro', fallback: 'gpt-4.1' },
  'agent-15': { primary: 'deepseek-v4-pro', fallback: 'gpt-4.1' },
  'agent-16': { primary: 'deepseek-v4-flash' },
};

export class ModelGateway {
  private providers: Record<string, ProviderConfig> = {};

  constructor() {
    this.initProviders();
  }

  private initProviders() {
    const deepseekKey = process.env.DEEPSEEK_API_KEY || '';
    const openaiKey = process.env.OPENAI_API_KEY || '';

    if (deepseekKey) {
      this.providers['deepseek'] = {
        name: 'deepseek',
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        apiKey: deepseekKey,
        models: [
          { name: 'deepseek-v4-flash', type: 'fast', inputPrice: 0.002, outputPrice: 0.004 },
          { name: 'deepseek-v4-pro', type: 'reasoning', inputPrice: 0.004, outputPrice: 0.008 },
        ],
      };
    }

    if (openaiKey) {
      this.providers['openai'] = {
        name: 'openai',
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        apiKey: openaiKey,
        models: [
          { name: 'gpt-4.1-mini', type: 'fast', inputPrice: 0.02, outputPrice: 0.08 },
          { name: 'gpt-4.1', type: 'powerful', inputPrice: 0.04, outputPrice: 0.16 },
        ],
      };
    }
  }

  /**
   * 智能调用：live模式下尝试真实API，失败回退mock
   */
  async smartCall(params: ModelCallParams): Promise<ModelCallResult> {
    const mode = process.env.VOCOS_MODEL_MODE || 'mock';
    if (mode === 'live') {
      const hasKeys = !!(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY);
      if (hasKeys) {
        const result = await this.call(params);
        if (result.success) return result;
        console.warn('[ModelGateway] Live call failed, falling back to mock:', result.error);
      }
    }
    return this.mockCall(params);
  }

  /**
   * 调用模型（含路由、降级、重试）
   */
  async call(params: ModelCallParams): Promise<ModelCallResult> {
    const startTime = Date.now();
    const route = AGENT_MODEL_MAP[params.agentCode] || { primary: 'deepseek-v4-flash' };
    const models = [route.primary, route.fallback].filter(Boolean) as string[];

    let lastError: string | undefined;
    let retryCount = 0;
    let fallbackUsed = false;

    for (const modelName of models) {
      if (fallbackUsed) retryCount++;

      const provider = this.findProvider(modelName);
      if (!provider) {
        lastError = `No provider found for model: ${modelName}`;
        continue;
      }

      const modelConfig = provider.models.find((m) => m.name === modelName);
      if (!modelConfig) {
        lastError = `Model not found: ${modelName}`;
        continue;
      }

      try {
        const result = await this.callProvider(provider, modelName, params);
        const latencyMs = Date.now() - startTime;
        const inputTokens = this.estimateTokens(params.systemPrompt + params.userPrompt);
        const outputTokens = this.estimateTokens(result);
        const totalTokens = inputTokens + outputTokens;
        const cost = (inputTokens / 1000) * modelConfig.inputPrice +
                     (outputTokens / 1000) * modelConfig.outputPrice;

        return {
          success: true,
          content: result,
          modelName,
          providerName: provider.name,
          inputTokens,
          outputTokens,
          totalTokens,
          cost: Math.round(cost * 10000) / 10000,
          latencyMs,
          retryCount,
          fallbackUsed,
        };
      } catch (err: any) {
        lastError = err.message || String(err);
        fallbackUsed = true;
        console.warn(`[ModelGateway] ${modelName} failed: ${lastError}, trying fallback...`);
      }
    }

    return {
      success: false,
      content: '',
      modelName: models[0] || 'unknown',
      providerName: 'unknown',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cost: 0,
      latencyMs: Date.now() - startTime,
      retryCount,
      fallbackUsed,
      error: lastError,
    };
  }

  /**
   * Mock 模式调用（开发环境无 API Key 时使用）
   */
  async mockCall(params: ModelCallParams): Promise<ModelCallResult> {
    const startTime = Date.now();

    // Simulate network latency
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 700));

    const mockContent = this.generateMockResponse(params.agentCode, params.userPrompt);
    const inputTokens = this.estimateTokens(params.systemPrompt + params.userPrompt);
    const outputTokens = this.estimateTokens(mockContent);

    return {
      success: true,
      content: mockContent,
      modelName: 'mock-model',
      providerName: 'mock',
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost: 0,
      latencyMs: Date.now() - startTime,
      retryCount: 0,
      fallbackUsed: false,
    };
  }

  private generateMockResponse(agentCode: string, userPrompt: string): string {
    const mockResponses: Record<string, string> = {
      'agent-00': JSON.stringify({ taskType: 'content_analysis', goals: ['拉新曝光', '种草收藏'], outputModules: ['full'] }),
      'agent-01': JSON.stringify({
        titleStructure: { hasPainPoint: true, hasKeyword: true, hasBenefit: false, score: 72 },
        contentTheme: '产品测评对比',
        hook: '价格争议型开头',
        structure: ['提出问题', '展示对比', '给出结论', '引导评论'],
        sellingPoints: [{ point: '成分优势', clarity: 'medium', evidence: 'weak' }],
        cta: { type: 'comment_guide', effectiveness: 'medium' },
        platformFit: { douyin: 'good', xiaohongshu: 'excellent' },
        triggerPoints: ['价格未解释清楚', '效果证据不足'],
        problems: ['缺少具体使用场景', '信任背书不够'],
      }),
      'agent-02': JSON.stringify({
        originalCount: 1523,
        normalizedCount: 1498,
        exactDuplicates: 18,
        fuzzyDuplicates: 7,
        crossPostDuplicates: 0,
        validCount: 1473,
      }),
      'agent-03': JSON.stringify({
        spamCount: 45,
        invalidCount: 23,
       引流Count: 8,
        validAfterFilter: 1397,
        spamExamples: ['ddd', '顶', '好', '纯表情刷屏'],
      }),
      'agent-04': JSON.stringify({
        threadCount: 87,
        maxDepth: 5,
        controversyChains: 3,
        highRiskThreads: 2,
        summary: '发现3条争议链，涉及价格质疑和效果争议',
      }),
      'agent-05': JSON.stringify({
        positive: 423, neutral: 612, negative: 258, complex: 104,
        sentimentTargets: {
          price: { positive: 30, negative: 145, neutral: 80 },
          effect: { positive: 120, negative: 67, neutral: 45 },
          packaging: { positive: 55, negative: 12, neutral: 20 },
          service: { positive: 35, negative: 18, neutral: 15 },
        },
      }),
      'agent-06': JSON.stringify({
        totalHighValue: 287,
        scoringMethodology: 'Multi-factor: signal quality(40%) + information density(25%) + sentiment intensity(20%) + engagement(15%)',
        categories: {
          purchaseIntent: { count: 89, pct: '31%', topSignal: '已下单/求链接/怎么买' },
          priceObjection: { count: 52, pct: '18%', topSignal: '贵在哪里/智商税/不值' },
          competitorComparison: { count: 45, pct: '16%', topSignal: '和XX比/哪个好/不如买XX' },
          usageQuestion: { count: 38, pct: '13%', topSignal: '怎么用/适合我吗/什么时候用' },
          scenarioNeed: { count: 28, pct: '10%', topSignal: '约会用/上班/出门旅游' },
          effectSkepticism: { count: 20, pct: '7%', topSignal: '有用吗/真的假的/效果' },
          safetyConcern: { count: 8, pct: '3%', topSignal: '安全吗/过敏/孕妇' },
          repurchaseSignal: { count: 7, pct: '2%', topSignal: '回购/囤货/真爱' },
        },
        contentActionableComments: {
          canGenerateTitles: ['它和几十块平替到底差在哪？', '评论区最关心的价格问题一次讲清', '不同肤质用它的真实感受'],
          canGenerateHooks: ['评论区都在问：它凭什么比几十块的贵？', '你们一直问的和XX的区别，今天讲清楚'],
          canGenerateFAQ: ['Q: 敏感肌能用吗？A: 无酒精无香精，但建议耳后先测试', 'Q: 多久见效？A: 根据个体差异，一般2-4周'],
        },
        topComments: [
          { text: '这个和几十块的有什么区别？', score: 5, category: 'priceObjection', actionValue: 'title+hook' },
          { text: '求链接！！！', score: 5, category: 'purchaseIntent', actionValue: 'conversionSignal' },
          { text: '适合油皮吗？', score: 4, category: 'usageQuestion', actionValue: 'tutorialNeeded' },
          { text: '用了半个月真的白了！', score: 5, category: 'repurchaseSignal', actionValue: 'socialProof' },
        ],
      }),
      'agent-07': JSON.stringify({
        demandMap: [
          { category: '效果验证', frequency: 'high', intensity: 'strong', evidence: ['到底有没有用？', '用了多久能看到效果？', '和宣传的一样吗？'], insight: '用户最在意真实效果，需要量化证据', suggestedContent: '28天使用记录系列，分阶段展示变化' },
          { category: '价格解释', frequency: 'high', intensity: 'strong', evidence: ['贵在哪里？', '和几十块区别？', '值这个价吗？'], insight: '价格异议 = 价值认知不足，非支付能力问题', suggestedContent: '成本拆解+竞品对标+每日成本计算' },
          { category: '适用人群', frequency: 'medium', intensity: 'moderate', evidence: ['适合油皮吗？', '敏感肌能用吗？', '孕妇能用吗？'], insight: '缺乏人群细分指导，用户自我排除', suggestedContent: '分肤质/分年龄/分场景使用指南' },
          { category: '使用方法', frequency: 'medium', intensity: 'moderate', evidence: ['怎么用效果最好？', '早晚都用吗？', '和XX搭配行吗？'], insight: '使用门槛不明确，降低购买意愿', suggestedContent: '教程视频+搭配方案+常见误区' },
          { category: '成分安全', frequency: 'low', intensity: 'moderate', evidence: ['成分安全吗？', '有酒精吗？', '会不会过敏？'], insight: '成分科普不足导致安全焦虑', suggestedContent: '成分解析+检测报告+安全说明' },
        ],
        barrierMap: [
          { type: 'price', level: 'high', percentage: 31, psychology: '不理解价值来源，缺少价格锚点', action: '价值拆解+竞品对标+日均成本', priority: 'P0' },
          { type: 'trust', level: 'medium', percentage: 22, psychology: '对内容真实性和效果有怀疑', action: '真实案例+第三方检测+用户证言', priority: 'P1' },
          { type: 'effect', level: 'medium', percentage: 18, psychology: '担心产品效果不如预期', action: '长周期记录+量化数据+多场景验证', priority: 'P1' },
          { type: 'safety', level: 'low', percentage: 12, psychology: '对成分/适用性有安全顾虑', action: '成分科普+敏感测试+禁忌说明', priority: 'P2' },
          { type: 'applicability', level: 'low', percentage: 10, psychology: '不确定是否适合自己的情况', action: '分人群指南+自测工具+试用装', priority: 'P2' },
          { type: 'competitor', level: 'low', percentage: 7, psychology: '在多品牌间犹豫对比', action: '多维度对比+差异化定位+场景卡位', priority: 'P2' },
        ],
        competitorMentions: [
          { brand: '花西子', frequency: 23, sentiment: 'neutral', context: '价格/设计对比' },
          { brand: 'MAC', frequency: 15, sentiment: 'positive', context: '品质参考基准' },
        ],
      }),
      'agent-08': JSON.stringify({
        methodology: 'Content-Comment Causal Attribution: For each comment cluster, trace back to content trigger → identify root cause → prescribe next action',
        attributions: [
          {
            commentPhenomenon: '价格异议集中出现（31%高价值评论）',
            commentEvidence: ['这个和几十块的有什么区别？', '贵在哪里？', '是不是智商税？', '值不值这个价？'],
            contentTrigger: '原内容直接展示价格但未解释价值构成（成本/研发/成分/效果）',
            rootCause: '对高决策品类（美妆），用户价格接受度=价值感知÷价格认知，原内容只建立了价格认知未建立价值感知',
            userRealNeed: '需要理解"为什么值这个价"而非"价格贵不贵"',
            contentGap: '缺少价格价值对比框架（成分浓度对比/使用周期对比/安全认证对比/日均成本计算）',
            businessImpact: '价格异议直接阻碍转化，转化为购买意图的前提是价值认知建立',
            categoryContext: '美妆护肤品类中，价格接受度依赖于成分透明度+效果可视化+适用人群明确性',
            nextAction_p0: '制作一条"贵在哪里"的价值拆解视频：成分对比→工艺差异→效果数据→用户反馈→日均成本',
            nextAction_p1: '在小红书发布"XX元用XX天，每天才X元"的性价比计算笔记',
            platformStrategy: {
              douyin: '开头直接引用评论区质疑 → 3维度拆解 → 总结适合人群 → 投票互动',
              xiaohongshu: '标题：它凭什么比平替贵？4个维度拆清楚 → 收藏引导',
            },
            verifyMetrics: ['价格异议评论占比下降', '购买意图评论上升', '商品点击率提升'],
          },
          {
            commentPhenomenon: '效果追问反复出现（25%高价值评论）',
            commentEvidence: ['真的有用吗？', '多久能看到效果？', '有用过的姐妹说说吗？', '是不是吹的'],
            contentTrigger: '效果展示只有"对比展示"一个维度且缺少量化和时间线',
            rootCause: '用户处于"兴趣→信任"的过渡阶段，需要可验证的证据而非营销话术',
            userRealNeed: '需要看到真实、可量化、有周期的效果证据',
            contentGap: '缺少多维度证明机制（数据/案例/周期/第三方）',
            businessImpact: '效果怀疑直接延长决策周期，竞品可能在此期间截流',
            nextAction_p0: '制作28天使用记录系列：第1/7/14/28天实拍对比',
            nextAction_p1: '邀请真实用户分享使用感受（UGC社会证明）',
          },
          {
            commentPhenomenon: '肤质适配问题频繁出现',
            commentEvidence: ['适合油皮吗？', '敏感肌能用吗？', '干皮会不会干？', '混油皮能用吗？'],
            contentTrigger: '内容未明确说明适用肤质，未展示不同肤质的效果差异',
            rootCause: '美妆消费决策中"适不适合我"是排名第一的决策因素，缺乏个性化指导导致用户自我排除',
            contentGap: '缺少分肤质的使用指导和效果对比',
            nextAction_p0: '分肤质使用教程：油皮版/干皮版/敏感肌版/混油版',
          },
        ],
        attributionFramework: {
          step1: '识别评论现象（What：用户在说什么？）',
          step2: '定位内容触发点（Where：内容的哪个部分触发的？）',
          step3: '分析深层原因（Why：用户为什么这样反馈？）',
          step4: '品类判断（Category：为什么在这个品类中特别重要？）',
          step5: '制定内容动作（How：下一条内容怎么做？）',
          step6: '平台差异化（Platform：抖音和小红书怎么分别做？）',
          step7: '验证指标（Metrics：发布后看什么数据判断是否有效？）',
        },
      }),
      'agent-10': JSON.stringify({
        cards: [
          {
            cardId: 'P0-001', priority: 'P0', title: '制作"贵在哪里"价值拆解视频',
            platform: 'douyin', contentFormat: '口播+对比', goal: '转化成交',
            evidence: ['这个和几十块的有什么区别？', '贵在哪里？', '是不是智商税？'],
            coreJudgment: '用户不是嫌贵，是不理解价值来源',
            riskWarning: '避免贬低竞品，聚焦自身价值',
          },
          {
            cardId: 'P1-001', priority: 'P1', title: '油皮/干皮分肤质使用教程',
            platform: 'xiaohongshu', contentFormat: '图文教程', goal: '种草收藏',
            evidence: ['适合油皮吗？', '干皮会不会干？'],
            coreJudgment: '人群适配信息不足，需补充使用场景',
          },
        ],
      }),
    };

    const response = mockResponses[agentCode];
    if (response) return response;

    // Default structured response
    return JSON.stringify({
      agentCode,
      result: 'mock_response',
      summary: `Mock analysis result for ${agentCode}`,
      timestamp: new Date().toISOString(),
    });
  }

  private async callProvider(
    provider: ProviderConfig,
    modelName: string,
    params: ModelCallParams
  ): Promise<string> {
    const url = `${provider.baseUrl}/chat/completions`;

    const body: any = {
      model: modelName,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 4096,
    };

    if (params.responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000), // 120s timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
  }

  private findProvider(modelName: string): ProviderConfig | undefined {
    for (const provider of Object.values(this.providers)) {
      if (provider.models.some((m) => m.name === modelName)) {
        return provider;
      }
    }
    return undefined;
  }

  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for Chinese, 1 token ≈ 1 word for English
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }
}

// Singleton
export const modelGateway = new ModelGateway();
