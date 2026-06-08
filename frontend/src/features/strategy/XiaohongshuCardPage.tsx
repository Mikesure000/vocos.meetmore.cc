import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip, Alert,
  List, ListItem, ListItemIcon, ListItemText, CircularProgress,
} from '@mui/material';
import { ArrowBack, CheckCircle, ContentCopy, AutoAwesome, Bookmark } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { apiClient } from '../../shared/api/client';

const fallbackMock = {
  contentGoal: '分肤质使用教程，提升收藏和种草转化',
  targetUser: '油皮/干皮/敏感肌用户，对产品适配有疑问',
  userPainPoint: '不确定产品是否适合自己肤质',
  commentEvidence: ['适合油皮吗？', '敏感肌能用吗？', '干皮会不会干？'],
  coreJudgment: '分肤质教程可覆盖最大的信息缺口',
  titleOptions: ['油皮怎么用？干皮怎么用？一篇讲清楚', '混油皮的真实使用感受，看完再决定', '不同肤质用它效果差多少？真实对比来了'],
  coverText: '油皮 vs 干皮 使用全攻略',
  coreKeywords: ['肤质', '使用方法', '真实感受', '油皮', '干皮', '敏感肌'],
  searchLayout: '布局"油皮+产品名""干皮+产品名""敏感肌+产品名"等长尾关键词',
  bodyStructure: ['开头：肤质自测引导（你是哪种肤质？）', '中段：分肤质步骤详解（油皮版/干皮版/敏感肌版）', '结尾：常见问题Q&A + 收藏引导'],
  noteType: '图文教程 + 收藏清单',
  collectionPoints: ['肤质自测清单', '分肤质使用步骤表', '搭配产品推荐'],
  materialNeeds: ['肤质对比图', '使用步骤图', '前后对比图'],
  sellingPoints: '不同肤质的不同效果展示',
  proofMechanism: '28天真实使用记录 + 周期对比照片',
  interactionQuestions: ['你是什么肤质？', '还有其他使用问题吗？评论区告诉我'],
  cta: '收藏这篇，下次不知道怎么用就翻出来看',
  avoidanceTips: ['不要只说"适合所有肤质"', '不要忽略敏感肌的特殊需求', '不要过度承诺效果'],
  acceptanceCriteria: ['必须有分肤质具体步骤', '必须有真实使用场景照片', '必须有Q&A互动环节'],
  verificationMetrics: ['收藏率 > 5%', '评论互动率 > 3%', '私信咨询转化', '笔记涨粉数'],
};

export default function XiaohongshuCardPage() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    apiClient.get(`/api/tasks/${taskId}/production-cards?platform=xiaohongshu`)
      .then((r) => {
        const cards = r.data || [];
        if (cards.length > 0) {
          setCard(JSON.parse(cards[0].cardJson));
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
      const res = await apiClient.post(`/api/tasks/${taskId}/production-cards/generate`, { platform: 'xiaohongshu' });
      setCard(JSON.parse(res.data.card.cardJson));
      setIsMock(false);
      enqueueSnackbar('AI 小红书生产卡生成完成', { variant: 'success' });
    } catch { enqueueSnackbar('生成失败', { variant: 'error' }); }
    finally { setGenerating(false); }
  };

  const copy = (t: string) => { navigator.clipboard.writeText(t); enqueueSnackbar('已复制', { variant: 'success' }); };
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
        <Typography variant="h4" fontWeight={700}>小红书内容生产卡</Typography>
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
        <Grid size={12}><Card><CardContent><F label="内容目标">{card.contentGoal}</F><F label="目标用户">{card.targetUser}</F><F label="核心判断"><Typography color="primary.main">{card.coreJudgment}</Typography></F></CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent><F label="标题方案">{card.titleOptions?.map((t: string,i: number)=><Typography key={i} variant="body2" sx={{cursor:'pointer','&:hover':{color:'primary.main'}}} onClick={()=>copy(t)}>{i+1}. {t}</Typography>)}</F></CardContent></Card></Grid>
        <Grid size={6}><Card><CardContent><F label="封面文案"><Alert severity="info" icon={false}><Typography fontWeight={500}>{card.coverText}</Typography></Alert></F><F label="核心关键词">{card.coreKeywords?.map((k: string,i: number)=><Chip key={i} label={k} size="small" sx={{mr:0.5,mb:0.5}}/>)}</F></CardContent></Card></Grid>

        <Grid size={12}><Card><CardContent><F label="搜索词布局">{card.searchLayout}</F></CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent><F label="正文结构"><List dense>{card.bodyStructure?.map((s: string,i: number)=><ListItem key={i}><ListItemIcon><CheckCircle color="success" fontSize="small"/></ListItemIcon><ListItemText primary={s}/></ListItem>)}</List></F></CardContent></Card></Grid>
        <Grid size={6}><Card><CardContent><F label="笔记类型 + 收藏点">{card.noteType}<Box mt={1}>{card.collectionPoints?.map((c: string,i: number)=><Chip key={i} icon={<Bookmark/>} label={c} size="small" sx={{mr:0.5,mb:0.5}}/>)}</Box></F></CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent><F label="素材需求">{card.materialNeeds?.map((m: string,i: number)=><Chip key={i} label={m} size="small" sx={{mr:0.5,mb:0.5}}/>)}</F><F label="卖点呈现">{card.sellingPoints}</F><F label="证明机制">{card.proofMechanism}</F></CardContent></Card></Grid>
        <Grid size={6}><Card><CardContent><F label="互动问题">{card.interactionQuestions?.map((q: string,i: number)=><Typography key={i} variant="body2">💬 {q}</Typography>)}<F label="CTA">{card.cta}</F></CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent><F label="避坑提醒"><List dense>{card.avoidanceTips?.map((t: string,i: number)=><ListItem key={i}><ListItemIcon><CheckCircle fontSize="small"/></ListItemIcon><ListItemText primary={t}/></ListItem>)}</List></F></CardContent></Card></Grid>
        <Grid size={6}><Card><CardContent><F label="验收标准"><List dense>{card.acceptanceCriteria?.map((a: string,i: number)=><ListItem key={i}><ListItemIcon><CheckCircle fontSize="small"/></ListItemIcon><ListItemText primary={a}/></ListItem>)}</List></F></CardContent></Card></Grid>
        <Grid size={6}><Card><CardContent><F label="验证指标">{card.verificationMetrics?.map((v: string,i: number)=><Chip key={i} label={v} size="small" sx={{mr:0.5,mb:0.5}}/>)}</F></CardContent></Card></Grid>
      </Grid>
    </Box>
  );
}
