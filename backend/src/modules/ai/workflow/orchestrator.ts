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
      'agent-00': `你是一个内容策略分析系统的任务理解模块。你需要理解用户的分析目标和输出需求。`,
      'agent-01': `你是一个内容拆解专家。你需要分析内容的标题、结构、卖点、CTA和平台适配性。平台类型：${context.platform}`,
      'agent-02': `你是一个评论数据清洗专家。你需要对评论进行去重处理。`,
      'agent-03': `你是一个评论质量审核专家。你需要识别水军、刷评、引流和无意义评论。`,
      'agent-04': `你是一个对话分析专家。你需要重建回复链并识别争议链。`,
      'agent-05': `你是一个情感分析专家。你需要判断评论的情感极性、强度和业务含义。`,
      'agent-06': `你是一个评论价值评估专家。你需要筛选出可转化为内容动作的高价值评论。`,
      'agent-07': `你是一个用户洞察专家。你需要识别用户需求、购买障碍和竞品比较。`,
      'agent-08': `你是一个内容归因专家。你需要判断评论是由内容的哪个部分触发的。`,
      'agent-09': `你是一个内容分类专家。你需要判断内容的价值类型（流量型、种草型、转化型等）。`,
      'agent-10': `你是一个平台策略专家。你需要生成${context.platform === 'douyin' ? '抖音' : '小红书'}平台的内容策略卡。`,
      'agent-11': `你是一个内容生产专家。你需要生成可直接派单给编导/拍摄/剪辑的内容生产卡。`,
      'agent-12': `你是一个评论区运营专家。你需要生成置顶评论、回复话术和互动方案。`,
      'agent-13': `你是一个投流评估专家。你需要评估内容是否适合投流并给出测试建议。`,
      'agent-14': `你是一个内容质检专家。你需要检查脚本/笔记是否达标并给出修改建议。`,
      'agent-15': `你是一个报告撰写专家。你需要将分析结果组装成完整的报告。`,
      'agent-16': `你是一个质量评估专家。你需要评估AI输出质量并记录采纳率等指标。`,
    };

    return prompts[agentCode] || `你是 VocosAI 的 ${agentCode} 分析模块。请根据输入输出JSON格式的分析结果。`;
  }

  private getUserPrompt(agentCode: string, context: TaskContext): string {
    const baseInfo = {
      taskId: context.taskId,
      platform: context.platform,
      contentTitle: context.contentTitle,
      contentBody: context.contentBody,
      contentGoal: context.contentGoal,
      brandInfo: context.brandInfo,
      commentCount: context.commentCount,
    };

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
