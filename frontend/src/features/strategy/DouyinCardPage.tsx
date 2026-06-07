import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip, Alert,
  Divider, List, ListItem, ListItemIcon, ListItemText, CircularProgress,
} from '@mui/material';
import { ArrowBack, CheckCircle, ContentCopy, AutoAwesome } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { apiClient } from '../../shared/api/client';

// Fallback mock 数据（当 DB 无数据时使用）
const fallbackMock = {
  contentGoal: '解决价格异议，提高转化信任',
  targetUser: '对产品感兴趣但觉得价格偏高的人群',
  userPainPoint: '不理解产品价值来源',
  commentEvidence: ['这个和几十块的有什么区别？', '贵在哪里？', '是不是智商税？'],
  coreJudgment: '用户不是嫌贵，是不理解价值来源',
  contentDirection: '做一条"贵在哪里"的价值拆解视频',
  titleOptions: ['它凭什么比平替贵？看完这3点再决定', '评论区都在问贵在哪里，我一次讲清楚', '几十块平替和它到底差在哪？'],
  hook: '评论区都在问：它到底凭什么比几十块的贵？',
  structure: ['展示评论质疑', '承认疑问合理', '拆解3个差异', '展示真实反馈', '说明适合人群', '引导评论'],
  scriptOutline: '开头（0-3秒）：评论区截图+大字"贵在哪里？"\n中段（3-45秒）：成分对比→工艺差异→效果数据→用户反馈\n结尾（45-60秒）：总结3个核心差异+引导评论',
  materialNeeds: ['评论截图', '产品对比图', '成分对比表', '用户反馈截图'],
  sellingPoints: '3个核心差异：成分浓度高30%、使用周期短50%、安全认证多3项',
  proofMechanism: '对比实验数据 + 真实用户28天前后对比',
  cta: '你觉得最需要对比哪一点？评论区告诉我',
  commentGuide: '引导用户评论下一个想看的对比对象',
  adFitSuggestion: '适合小预算测试，建议测试3版开头',
  acceptanceCriteria: ['必须直接回应价格质疑', '必须有具体对比数据', '不能只说"高级品质好"', '必须明确适合人群'],
  verificationMetrics: ['CTR > 3%', '商品点击率 > 2%', '价格异议评论占比下降', 'CVR > 1.5%'],
};

export default function DouyinCardPage() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    apiClient.get(`/api/tasks/${taskId}/production-cards?platform=douyin`)
      .then((r) => {
        const cards = r.data || [];
        if (cards.length > 0) {
          const data = JSON.parse(cards[0].cardJson);
          setCard(data);
          setIsMock(false);
        } else {
          setCard(fallbackMock);
          setIsMock(true);
        }
      })
      .catch(() => { setCard(fallbackMock); setIsMock(true); })
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await apiClient.post(`/api/tasks/${taskId}/production-cards/generate`, { platform: 'douyin' });
      const data = JSON.parse(res.data.card.cardJson);
      setCard(data);
      setIsMock(false);
      enqueueSnackbar('AI 抖音生产卡生成完成', { variant: 'success' });
    } catch { enqueueSnackbar('生成失败', { variant: 'error' }); }
    finally { setGenerating(false); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); enqueueSnackbar('已复制', { variant: 'success' }); };
  const copyAll = () => { copy(JSON.stringify(card, null, 2)); };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  const F = ({ label, children }: any) => (
    <Box mb={1.5}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      <Box mt={0.5}>{children}</Box>
    </Box>
  );

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/strategy`)}>返回</Button>
        <Typography variant="h4" fontWeight={700}>抖音内容生产卡</Typography>
        <Chip label={isMock ? '示例数据' : 'AI 生成'} size="small" color={isMock ? 'warning' : 'success'} variant="outlined" />
      </Box>

      <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
        <Button variant="outlined" startIcon={<AutoAwesome />} onClick={handleGenerate} disabled={generating}>
          {generating ? '生成中...' : 'AI 重新生成'}
        </Button>
        <Button variant="outlined" startIcon={<ContentCopy />} onClick={copyAll}>复制全部</Button>
      </Box>

      {isMock && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          当前展示示例数据。点击「AI 重新生成」将基于真实评论数据生成内容生产卡。
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={12}><Card><CardContent><F label="选题方向"><Typography fontWeight={600}>{card.contentDirection}</Typography></F></CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent><F label="内容目标">{card.contentGoal}</F><F label="目标用户">{card.targetUser}</F><F label="用户痛点">{card.userPainPoint}</F></CardContent></Card></Grid>
        <Grid size={6}><Card><CardContent><F label="核心判断"><Typography color="primary.main">{card.coreJudgment}</Typography></F><F label="评论证据">{card.commentEvidence?.map((e: string,i: number)=><Chip key={i} label={e} size="small" sx={{mr:0.5,mb:0.5}}/>)}</F></CardContent></Card></Grid>

        <Grid size={12}><Card><CardContent><F label="标题方案">{card.titleOptions?.map((t: string,i: number)=><Typography key={i} variant="body2" sx={{cursor:'pointer','&:hover':{color:'primary.main'}}} onClick={()=>copy(t)}>{i+1}. {t}</Typography>)}</F></CardContent></Card></Grid>

        <Grid size={12}><Card><CardContent><F label="前 3 秒钩子"><Alert severity="info" icon={false}><Typography fontWeight={500}>{card.hook}</Typography></Alert></F></CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent><F label="脚本结构"><List dense>{card.structure?.map((s: string,i: number)=><ListItem key={i}><ListItemIcon><CheckCircle color="success" fontSize="small"/></ListItemIcon><ListItemText primary={s}/></ListItem>)}</List></F></CardContent></Card></Grid>
        <Grid size={6}><Card><CardContent><F label="脚本大纲"><Typography variant="body2" whiteSpace="pre-wrap">{card.scriptOutline}</Typography></F></CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent><F label="素材需求">{card.materialNeeds?.map((m: string,i: number)=><Chip key={i} label={m} size="small" sx={{mr:0.5,mb:0.5}}/>)}</F></CardContent></Card></Grid>
        <Grid size={6}><Card><CardContent><F label="卖点呈现">{card.sellingPoints}</F><F label="证明机制">{card.proofMechanism}</F></CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent><F label="投流建议">{card.adFitSuggestion}</F></CardContent></Card></Grid>
        <Grid size={6}><Card><CardContent><F label="CTA / 评论引导">{card.cta}<Typography variant="caption" color="text.secondary" display="block" mt={0.5}>评论引导：{card.commentGuide}</Typography></F></CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent><F label="验收标准"><List dense>{card.acceptanceCriteria?.map((a: string,i: number)=><ListItem key={i}><ListItemIcon><CheckCircle fontSize="small"/></ListItemIcon><ListItemText primary={a}/></ListItem>)}</List></F></CardContent></Card></Grid>
        <Grid size={6}><Card><CardContent><F label="验证指标">{card.verificationMetrics?.map((v: string,i: number)=><Chip key={i} label={v} size="small" sx={{mr:0.5,mb:0.5}}/>)}</F></CardContent></Card></Grid>
      </Grid>
    </Box>
  );
}
