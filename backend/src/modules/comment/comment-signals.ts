/**
 * 评论信号分类系统
 * 基于 PRD 第 8.3 节和 Vocos 4.0 的 13 个垂直标签体系
 */

export interface CommentSignal {
  key: string;
  label: string;
  category: 'intent' | 'barrier' | 'sentiment' | 'action';
  description: string;
  examples: string[];
}

export const COMMENT_SIGNALS: CommentSignal[] = [
  {
    key: 'purchase_intent',
    label: '购买意图',
    category: 'intent',
    description: '明确表达购买意愿或询价行为',
    examples: ['求链接', '怎么买', '多少钱', '哪里买', '已下单', '已加购'],
  },
  {
    key: 'price_objection',
    label: '价格异议',
    category: 'barrier',
    description: '对价格表示疑虑或不理解',
    examples: ['贵', '贵在哪里', '不值这个价', '平替推荐', '智商税'],
  },
  {
    key: 'effect_skepticism',
    label: '效果怀疑',
    category: 'barrier',
    description: '对产品效果表示怀疑',
    examples: ['有用吗', '真的假的', '效果怎么样', '用过的说说', '是不是吹的'],
  },
  {
    key: 'safety_concern',
    label: '安全担忧',
    category: 'barrier',
    description: '对产品安全性有疑虑',
    examples: ['安全吗', '有副作用吗', '成分安全吗', '敏感肌能用吗', '孕妇能用吗'],
  },
  {
    key: 'usage_question',
    label: '使用疑问',
    category: 'action',
    description: '询问使用方法或适用场景',
    examples: ['怎么用', '适合油皮吗', '干皮能用吗', '什么时候用', '搭配什么用'],
  },
  {
    key: 'audience_fit',
    label: '人群适配',
    category: 'barrier',
    description: '询问是否适合特定人群',
    examples: ['适合学生党吗', '妈妈能用吗', '30岁适合吗', '男生能用吗'],
  },
  {
    key: 'competitor_comparison',
    label: '竞品比较',
    category: 'intent',
    description: '与其他品牌或产品对比',
    examples: ['和XX比哪个好', '平替', '还不如买XX', 'XX更好用', '同类对比'],
  },
  {
    key: 'negative_experience',
    label: '负面体验',
    category: 'sentiment',
    description: '表达不满或负面使用体验',
    examples: ['不好用', '过敏了', '踩雷', '后悔买了', '千万别买'],
  },
  {
    key: 'repurchase_signal',
    label: '复购信号',
    category: 'intent',
    description: '表达再次购买的意愿',
    examples: ['回购', '囤货', '用完了再买', '一直用', '真爱'],
  },
  {
    key: 'dm_consult_signal',
    label: '私信咨询信号',
    category: 'action',
    description: '表达私下沟通的意愿',
    examples: ['私', '私信', '怎么联系', '加微信', 'V我'],
  },
  {
    key: 'scenario_need',
    label: '场景需求',
    category: 'intent',
    description: '表达特定场景下的需求',
    examples: ['约会用', '上班通勤', '出门旅游', '见家长', '面试用'],
  },
  {
    key: 'ingredient_focus',
    label: '成分关注',
    category: 'intent',
    description: '关注产品成分或配方',
    examples: ['含酒精吗', '有香精吗', '成分表发一下', 'XX成分含量多少'],
  },
  {
    key: 'trust_gap',
    label: '信任缺口',
    category: 'barrier',
    description: '对品牌或内容真实性有质疑',
    examples: ['广告吧', '收钱了吧', '托', '博主自己用过吗', '是不是推广'],
  },
  {
    key: 'skincare_concern',
    label: '护肤困扰',
    category: 'intent',
    description: '表达特定护肤问题或困扰',
    examples: ['黑眼圈', '细纹', '泪沟', '法令纹', '眼袋', '暗沉'],
  },
  {
    key: 'positive_feedback',
    label: '正向反馈',
    category: 'sentiment',
    description: '表达对产品/内容的正面评价',
    examples: ['好用', '不错', '明显', '推荐', '惊艳'],
  },
];

// Simple keyword-based signal detection
export function detectSignals(commentText: string): string[] {
  const text = commentText.toLowerCase();
  const detected: string[] = [];

  const keywordMap: Record<string, string[]> = {
    purchase_intent: ['求链接', '怎么买', '多少钱', '哪里买', '下单', '加购', '想要', '买它', '链接', '买了', '已购', '入手', '冲了', '冲', '哪里买', '在哪买', '给我链接', '被种草'],
    price_objection: ['太贵', '不值', '平替', '智商税', '贵在哪里', '便宜点', '这个价', '贵了', '贵的', '有点贵', '价格', '贵吗', '划算', '值吗'],
    effect_skepticism: ['有用吗', '真的假的', '效果', '管用', '有效', '吹的', '忽悠', '见效', '有用', '真的吗', '骗人', '夸张', '真的能', '确定能'],
    safety_concern: ['安全', '副作用', '过敏', '成分安全', '敏感肌', '孕妇', '检测', '刺激', '会不会过敏', '能不能用', '有事吗', '危害', '风险'],
    usage_question: ['怎么用', '适合', '能用吗', '什么时候', '搭配', '方法', '怎么敷', '怎么贴', '一次', '多久', '敷多久', '频率', '步骤'],
    audience_fit: ['学生', '妈妈', '男生', '女生', '年龄', '适合我吗', '我这种', '能用吗', '能不能用', '合适', '能敷吗'],
    competitor_comparison: ['哪个好', '更好', '不如', '相比', '对比', '区别', '差距', '比起', '和一个', '比起那个', 'XX比', '大牌', '跟那个'],
    negative_experience: ['不好用', '踩雷', '后悔', '千万别买', '垃圾', '差评', '没用', '没效果', '浪费', '退货', '扔了', '不推荐', '很差'],
    repurchase_signal: ['回购', '囤货', '再买', '一直用', '真爱', '用完了', '回够', '续购', '囤', '一定会回购', '复购', '继续买'],
    dm_consult_signal: ['私', '私信', '联系', '加微信', 'v我', '私聊', '看私', '已私'],
    scenario_need: ['约会', '上班', '通勤', '旅游', '见家长', '面试', '场景', '日常', '急救', '重要场合', '聚会', '出门前'],
    ingredient_focus: ['成分', '酒精', '香精', '配方', '含量', '添加', '原料', '提取', '技术', '原理', '渗透', '微晶', '玻尿酸', '胶原'],
    trust_gap: ['广告', '收钱', '托', '推广', '博主自己', '真的用过', '是不是推广', '真的假的啊', '别骗我', '信得过'],
    // 美妆护肤扩展
    skincare_concern: ['黑眼圈', '细纹', '皱纹', '泪沟', '法令纹', '眼袋', '浮肿', '暗沉', '美白', '淡斑', '痘印', '毛孔', '出油', '干燥', '起皮', '红血丝', '眼纹'],
    positive_feedback: ['好用', '不错', '真的很好', '很明显', '惊艳', '太牛', '绝了', '推荐', '买对了', '感觉不错'],
  };

  for (const [signal, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((kw) => text.includes(kw))) {
      detected.push(signal);
    }
  }

  return detected;
}

// Get signal display info
export function getSignalInfo(key: string): CommentSignal | undefined {
  return COMMENT_SIGNALS.find((s) => s.key === key);
}

// ============================================================
// 多因子评论价值评分模型 (v4.3)
// ============================================================

export interface CommentScoreFactors {
  signalScore: number;      // 信号维度 0-5
  lengthScore: number;      // 信息量维度 0-5
  sentimentScore: number;   // 情感维度 0-5
  engagementScore: number;  // 互动维度 0-5
}

export function scoreComment(text: string, likeCount: number = 0, replyCount: number = 0): {
  score: number;
  signals: string[];
  factors: CommentScoreFactors;
  verdict: 'critical' | 'high' | 'medium' | 'low' | 'noise';
} {
  const signals = detectSignals(text);
  
  // 1. 信号维度 (0-5)：不是简单计数，按信号质量加权
  const signalWeights: Record<string, number> = {
    purchase_intent: 3,        // 购买意图 = 最高价值
    price_objection: 2.5,      // 价格异议 = 可转化
    effect_skepticism: 2,      // 效果怀疑 = 教育机会
    safety_concern: 2,         // 安全担忧 = 信任建设
    competitor_comparison: 2.5,// 竞品比较 = 差异化机会
    skincare_concern: 2,       // 护肤困扰 = 需求信号
    audience_fit: 2,           // 人群适配 = 精准定位
    usage_question: 1.5,       // 使用疑问 = 内容机会
    ingredient_focus: 2,       // 成分关注 = 专业信任
    repurchase_signal: 3,      // 复购信号 = 忠诚度
    positive_feedback: 1.5,    // 好评 = 社交证明
    negative_experience: 3,    // 负面 = 风险信号(高关注)
    trust_gap: 2.5,            // 信任缺口 = 关键障碍
    dm_consult_signal: 1,      // 私信咨询 = 低公开价值
    scenario_need: 1.5,        // 场景需求 = 内容灵感
  };
  const totalWeight = signals.reduce((sum, s) => sum + (signalWeights[s] || 1), 0);
  const signalScore = Math.min(5, totalWeight / 2); // 归一化到0-5

  // 2. 信息量维度 (0-5)：评论长度反映信息密度
  const len = text.length;
  const lengthScore = len >= 100 ? 5 : len >= 60 ? 4 : len >= 30 ? 3 : len >= 15 ? 2 : len >= 5 ? 1 : 0;

  // 3. 情感维度 (0-5)：负面 > 质疑 > 中性 > 正面（负面和质疑更有分析价值）
  const hasNegative = signals.includes('negative_experience') || signals.includes('trust_gap');
  const hasSkepticism = signals.includes('effect_skepticism') || signals.includes('price_objection') || signals.includes('safety_concern');
  const hasPositive = signals.includes('positive_feedback') || signals.includes('repurchase_signal');
  const sentimentScore = hasNegative ? 5 : hasSkepticism ? 4 : hasPositive ? 2 : 3;

  // 4. 互动维度 (0-5)：点赞量和回复量反映社区共鸣
  const engagementScore = Math.min(5, Math.floor((likeCount / 5) + (replyCount / 2)));

  // 综合评分：加权平均 (信号40% + 信息量25% + 情感20% + 互动15%)
  const finalScore = Math.round(
    signalScore * 0.40 + lengthScore * 0.25 + sentimentScore * 0.20 + engagementScore * 0.15
  );

  const verdict = finalScore >= 4 ? 'critical' : finalScore >= 3 ? 'high' : finalScore >= 2 ? 'medium' : finalScore >= 1 ? 'low' : 'noise';

  return {
    score: finalScore,
    signals,
    factors: { signalScore, lengthScore, sentimentScore, engagementScore },
    verdict,
  };
}

/**
 * 为评论列表计算批量评分
 */
export function batchScoreComments(comments: Array<{ text: string; likeCount?: number; replyCount?: number }>): Array<{
  text: string;
  score: number;
  signals: string[];
  verdict: string;
}> {
  return comments.map(c => {
    const result = scoreComment(c.text, c.likeCount || 0, c.replyCount || 0);
    return { text: c.text, score: result.score, signals: result.signals, verdict: result.verdict };
  });
}

// Get all signals
export function getAllSignals(): CommentSignal[] {
  return COMMENT_SIGNALS;
}
