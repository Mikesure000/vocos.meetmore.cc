/**
 * Task Orchestrator - AI Agent 工作流编排器
 * 基于 PRD 第 4.2 节和第 11 章：支持串行/并行/条件执行
 */

import { modelGateway } from '../gateway/model-gateway.js';
import { runLogger } from '../governance/run-logger.js';
import { prisma } from '../../../config/prisma.js';
import { env } from '../../../config/env.js';
import { autoSelectSkills, buildAgentPrompt } from '../skills/skill-registry.js';
import { analysisService } from '../../insight/analysis.service.js';
import type { Skill } from '../skills/skill-registry.js';

interface StepConfig {
  code: string;
  name: string;
  dependsOn: string[];
  canParallel: boolean;
}

const PIPELINE_STEPS: StepConfig[] = [
  { code: 'agent-00', name: '任务理解与目标识别', dependsOn: [], canParallel: false },
  { code: 'agent-01', name: '原内容拆解', dependsOn: ['agent-00'], canParallel: true },
  { code: 'agent-02', name: '评论去重清洗', dependsOn: ['agent-00'], canParallel: true },
  { code: 'agent-03', name: '水军与无效评论过滤', dependsOn: ['agent-02'], canParallel: false },
  { code: 'agent-04', name: '多轮对话清洗', dependsOn: ['agent-03'], canParallel: false },
  { code: 'agent-05', name: '情感深度分析', dependsOn: ['agent-04'], canParallel: true },
  { code: 'agent-06', name: '高价值评论筛选', dependsOn: ['agent-04'], canParallel: true },
  { code: 'agent-07', name: '用户需求与购买障碍识别', dependsOn: ['agent-05', 'agent-06'], canParallel: false },
  { code: 'agent-08', name: '内容-评论归因', dependsOn: ['agent-01', 'agent-07'], canParallel: true },
  { code: 'agent-09', name: '内容价值类型识别', dependsOn: ['agent-01', 'agent-07'], canParallel: true },
  { code: 'agent-10', name: '平台策略生成', dependsOn: ['agent-08', 'agent-09'], canParallel: false },
  { code: 'agent-11', name: '内容生产卡生成', dependsOn: ['agent-10'], canParallel: true },
  { code: 'agent-12', name: '评论区运营', dependsOn: ['agent-10'], canParallel: true },
  { code: 'agent-13', name: '投流适配评分', dependsOn: ['agent-10'], canParallel: false },
  { code: 'agent-14', name: '发布前质检', dependsOn: [], canParallel: false },
  { code: 'agent-15', name: '报告组装', dependsOn: ['agent-11', 'agent-12', 'agent-13'], canParallel: false },
  { code: 'agent-16', name: 'AI 质量评估', dependsOn: ['agent-15'], canParallel: false },
];

interface TaskContext {
  taskId: string;
  teamId: string;
  projectId?: string;
  createdBy: string;
  contentTitle: string;
  contentBody: string;
  platform: string;
  contentGoal: string;
  brandInfo: string;
  outputOptions: string[];
  commentCount: number;
  categoryInfo?: string;   // 品类知识库 JSON
  brandKnowledge?: string;  // 品牌知识库 JSON
}

export class TaskOrchestrator {
  private results: Map<string, any> = new Map();
  private skills: Skill[] = [];

  async runPipeline(context: TaskContext): Promise<void> {
    console.log(`[Orchestrator] Starting pipeline for task ${context.taskId}`);

    // 自动选择匹配的Skills
    this.skills = autoSelectSkills({
      platform: context.platform,
      industry: context.brandInfo ? JSON.parse(context.brandInfo || '{}').industry : undefined,
      contentGoal: context.contentGoal,
      outputOptions: context.outputOptions,
    });
    console.log(`[Orchestrator] Selected ${this.skills.length} skills: ${this.skills.map(s => s.name).join(', ')}`);

    const allSteps = PIPELINE_STEPS.map((s) => s.code);
    const totalSteps = allSteps.length;

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      const step = PIPELINE_STEPS[i];

      // Check if this step should be skipped (conditional execution)
      if (step.code === 'agent-14' && !context.outputOptions.includes('pre_publish_check')) {
        await this.updateProgress(context.taskId, allSteps, i, totalSteps, 'skipped');
        continue;
      }

      if (step.code === 'agent-04') {
        // Check if reply chains exist - simplified check
        await this.updateProgress(context.taskId, allSteps, i, totalSteps, 'running');
      }

      // Update progress
      await this.updateProgress(context.taskId, allSteps, i, totalSteps, 'running');

      // Execute agent
      try {
        const result = await this.runAgent(step.code, context);
        this.results.set(step.code, result);
        await this.updateProgress(context.taskId, allSteps, i, totalSteps, 'success');
      } catch (err: any) {
        console.error(`[Orchestrator] Agent ${step.code} failed:`, err.message);
        await this.updateProgress(context.taskId, allSteps, i, totalSteps, 'failed');

        // Store partial failure
        await prisma.analysisTask.update({
          where: { id: context.taskId },
          data: { status: 'partially_failed' },
        });
        return;
      }
    }

    // Save pipeline results to DB (v3.1: bridge Pipeline → DB → Frontend)
    try {
      const resultsObj: Record<string, any> = {};
      this.results.forEach((value, key) => { resultsObj[key] = value; });
      await analysisService.savePipelineResults(context.taskId, resultsObj);
      console.log(`[Orchestrator] Analysis results saved to DB for task ${context.taskId}`);
    } catch (err) {
      console.error(`[Orchestrator] Failed to save analysis results:`, err);
    }

    // Mark complete
    await prisma.analysisTask.update({
      where: { id: context.taskId },
      data: { status: 'completed', completedAt: new Date() },
    });

    console.log(`[Orchestrator] Pipeline completed for task ${context.taskId}`);
  }

  private async runAgent(agentCode: string, context: TaskContext): Promise<any> {
    const basePrompt = this.getSystemPrompt(agentCode, context);
    // 使用Skill增强Prompt
    const systemPrompt = buildAgentPrompt(agentCode, basePrompt, this.skills);
    const userPrompt = this.getUserPrompt(agentCode, context);

    console.log(`[Orchestrator] ${agentCode} prompt enhanced with ${this.skills.length} skills, total length: ${systemPrompt.length}`);

    // Choose mock or live based on env
    const result = await modelGateway.smartCall({ agentCode, systemPrompt, userPrompt, responseFormat: 'json_object' });

    // Log the run
    await runLogger.log({
      teamId: context.teamId,
      projectId: context.projectId,
      taskId: context.taskId,
      agentCode,
      providerName: result.providerName,
      modelName: result.modelName,
      inputTokenCount: result.inputTokens,
      outputTokenCount: result.outputTokens,
      totalTokenCount: result.totalTokens,
      estimatedCost: result.cost,
      actualCost: result.cost,
      latencyMs: result.latencyMs,
      status: result.success ? 'success' : 'failed',
      errorMessage: result.error,
      retryCount: result.retryCount,
      fallbackUsed: result.fallbackUsed,
      outputRaw: result.content,
      outputJson: this.tryParseJson(result.content),
      createdBy: context.createdBy,
    });

    // Parse and return
    if (result.success) {
      return this.tryParseJson(result.content);
    }

    throw new Error(result.error || 'Agent execution failed');
  }

  private getSystemPrompt(agentCode: string, context: TaskContext): string {
    const prompts: Record<string, string> = {
      'agent-00': `你是一个内容策略分析系统的任务理解模块。你需要理解用户的分析目标和输出需求。平台：${context.platform || '抖音'}。内容目标：${context.contentGoal || '未知'}。`,

      'agent-01': `你是一个内容拆解专家。你需要分析内容的标题结构、开头钩子、卖点表达、证明机制、CTA和平台适配性。
分析维度：
1. 标题是否有人群定位、痛点、关键词、利益承诺？
2. 前3秒是否抓住用户？（抖音）/首屏是否有吸引力？（小红书）
3. 卖点是否清晰？用户能否理解产品价值？
4. 是否有证明机制（案例/对比/数据/用户反馈）？
5. CTA是否明确？是否引导了具体行为？`,

      'agent-02': `你是一个评论数据清洗专家。你需要：
1. 基于评论ID进行精确去重
2. 识别语义重复的评论（即使文字不同但含义相同）
3. 标记跨帖重复刷评的用户
4. 保留短但有价值的评论（如"求链接""怎么买""多少钱"）
5. 输出清洗后的统计指标`,

      'agent-03': `你是一个评论质量审核专家。识别以下类型并过滤：
- 水军评论：模板式好评、纯表情、单字刷屏、无意义符号
- 引流评论：含微信号、手机号、外链、异常@符号
- 低质评论：纯数字、纯标点、乱码
- 保留：即使短但有明确意图的评论（购买意愿、使用疑问等）`,

      'agent-04': `你是一个对话分析专家。你需要：
1. 重建主评论→回复→回复的回复链
2. 识别争议链（多个用户围绕同一话题争论）
3. 统计回复链的深度分布
4. 标注高风险争议链（负面体验、竞品攻击等）
5. 输出争议链摘要`,

      'agent-05': `你是一个情感分析专家。判断评论的情感：
- positive: 满意/推荐/回购意愿
- negative: 不满/投诉/负面体验
- neutral: 客观描述/简单提问
- complex: 正负面混合（"好用但太贵"）
重点识别隐含情感（如"还行吧"实际是勉强接受）。`,

      'agent-06': `你是一个评论价值评估专家。从多维度筛选高价值评论：
1. 购买意图：求链接、问价格、问购买渠道
2. 决策障碍：价格异议、功效怀疑、安全担忧、竞品比较
3. 内容灵感：可转选题、可做脚本开头、可做FAQ
4. 风险信号：严重负面、合规风险、竞品攻击
5. 运营机会：可做置顶、可做回复、可做私信承接
评分标准：综合信号质量、信息密度、互动热度、情感强度。`,

      'agent-07': `你是一个用户洞察专家。识别三大维度的用户信号：
1. 用户需求：功效需求、场景需求、人群需求、信息需求
2. 购买障碍：价格/信任/效果/安全/适用性/竞品心智
3. 竞品提及：比对品牌、比对产品、比对价格
输出结构化的需求地图和障碍地图，每条带评论证据和内容建议。`,

      'agent-08': `你是一个内容归因专家。分析评论与内容的因果关系：
核心方法论：
1. 识别评论现象（用户说了什么）
2. 定位内容触发点（内容的哪个部分引发了评论）
3. 判断深层原因（用户真正的需求和障碍）
4. 给出下一条内容动作（怎么做能解决/回应）
归因必须从"总结评论"升级为"解释评论为什么发生"。每个归因需要：
- 评论现象 + 评论证据
- 内容触发点
- 归因判断（为什么）
- 下一条内容动作（怎么做）`,
      'agent-09': `你是一个内容分类专家。判断内容的价值类型：
- 拉新曝光型：流量大、受众广、娱乐性强
- 种草信任型：真实体验、干货分享、信任建设
- 转化成交型：直接促销、优惠引导、限时限量
- 新品教育型：功能介绍、使用教程、场景演示
- 竞品对比型：客观对比、差异化定位、选择建议`,
      'agent-10': `你是一个平台策略专家。为${context.platform === 'douyin' ? '抖音' : context.platform === 'xiaohongshu' ? '小红书' : '多平台'}生成内容策略。
抖音策略：前3秒钩子 > 冲突设计 > 口播节奏 > 评论引导 > 投流适配
小红书策略：标题关键词 > 封面文案 > 搜索词布局 > 收藏点设计 > 种草逻辑
同一洞察在不同平台的表达完全不同，请严格区分。`,
      'agent-11': `你是一个内容生产专家。生成可直接派单的内容生产卡，包含：
- 平台、目标用户、用户痛点
- 评论证据（来自真实评论）
- 核心判断、内容方向
- 标题方案（3个版本）、开头钩子
- 内容结构、素材需求
- 卖点表达、证明机制
- CTA、评论引导、投流建议
- 验收标准、验证指标`,
      'agent-12': `你是一个评论区运营专家。生成运营方案：
1. 建议置顶评论（引导正向讨论）
2. 高频问题标准回复模板
3. 负面评论回应话术
4. 二次互动问题
5. 下一条内容引导
6. 私信承接话术
7. 高风险评论处理方案`,
      'agent-13': `你是一个投流评估专家。从8个维度评估投流适配度：
人群清晰度/卖点清晰度/购买理由/评论风险/合规风险/素材稳定性/可复用性/转化承接。
输出：评分/结论/测试变量/风险提醒/放量建议。`,
      'agent-14': `你是一个内容质检专家。按9个维度检查脚本/笔记：
是否回应核心评论问题/标题有效性/前3秒钩子/卖点清晰度/证明充分性/CTA明确/平台适配/合规风险/品牌调性。
输出：是否建议发布/总分/必改项/优化项/合规风险。`,
      'agent-15': `你是一个报告撰写专家。将分析结果组装成完整报告，包含：
内容拆解 → 评论清洗 → 高价值评论 → 归因分析 → 需求地图 → 障碍地图 → 策略卡 → 生产卡 → 投流评估 → 运营方案。`,
      'agent-16': `你是一个质量评估专家。评估AI输出质量：
1. 输出是否符合JSON Schema？
2. 是否有评论证据支撑？
3. 是否有平台差异化？
4. 是否可执行（非泛泛而谈）？`,
    };
    return prompts[agentCode] || `你是 VocosAI 的 ${agentCode} 分析模块。请根据输入输出JSON格式的分析结果。`;
  }

  private getUserPrompt(agentCode: string, context: TaskContext): string {
    const baseInfo: any = {
      taskId: context.taskId,
      platform: context.platform,
      contentTitle: context.contentTitle,
      contentBody: context.contentBody,
      contentGoal: context.contentGoal,
      brandInfo: context.brandInfo,
      commentCount: context.commentCount,
    };

    // 注入品类知识（尤其是合规相关 agent）
    if (context.categoryInfo) {
      const cat = JSON.parse(context.categoryInfo);
      if (['agent-00', 'agent-01', 'agent-07', 'agent-08', 'agent-10', 'agent-11', 'agent-14'].includes(agentCode)) {
        baseInfo.categoryContext = {
          name: cat.name,
          keyConcerns: cat.keyConcerns,
          dimensions: cat.dimensions,
          complianceRules: cat.complianceRules || [],
          platformMethodology: cat.platformMethodology?.[context.platform] || null,
        };
      }
    }

    // 注入品牌知识
    if (context.brandKnowledge) {
      try {
        const brand = JSON.parse(context.brandKnowledge);
        baseInfo.brandContext = { brandName: brand.brandName, positioning: brand.positioning, sellingPoints: brand.sellingPoints, taboos: brand.taboos || [] };
      } catch {}
    }

    return `请分析以下任务数据并输出JSON格式结果：\n${JSON.stringify(baseInfo, null, 2)}`;
  }

  private async updateProgress(
    taskId: string,
    allSteps: string[],
    currentIndex: number,
    totalSteps: number,
    status: string
  ) {
    const steps = allSteps.map((code, idx) => ({
      code,
      name: this.getStepName(code),
      status: idx < currentIndex ? 'success' : idx === currentIndex ? status : 'pending',
    }));

    const progress = { currentStep: currentIndex + 1, totalSteps, steps };

    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { progress: JSON.stringify(progress) },
    });
  }

  private getStepName(code: string): string {
    const step = PIPELINE_STEPS.find((s) => s.code === code);
    return step?.name || code;
  }

  private tryParseJson(content: string): string | null {
    try {
      JSON.parse(content);
      return content;
    } catch {
      // Try to extract JSON from markdown code blocks
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        try {
          JSON.parse(match[1].trim());
          return match[1].trim();
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}

export const orchestrator = new TaskOrchestrator();
