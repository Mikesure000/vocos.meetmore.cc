import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip, Alert,
  List, ListItem, ListItemIcon, ListItemText, CircularProgress,
} from '@mui/material';
import { ArrowBack, CheckCircle, ContentCopy, AutoAwesome, Bookmark } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { apiClient } from '../../shared/api/client';

const fallbackMock: any = {};

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
        if (cards.length > 0) { setCard(JSON.parse(cards[0].cardJson)); setIsMock(false); }
        else { setCard(fallbackMock); setIsMock(true); }
      })
      .catch(() => { setCard(fallbackMock); setIsMock(true); })
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await apiClient.post(`/api/tasks/${taskId}/production-cards/generate`, { platform: 'xiaohongshu' });
      setCard(JSON.parse(res.data.card.cardJson)); setIsMock(false);
      enqueueSnackbar('AI 小红书生产卡生成完成', { variant: 'success' });
    } catch { enqueueSnackbar('生成失败', { variant: 'error' }); }
    finally { setGenerating(false); }
  };

  const copy = (t: string) => { navigator.clipboard.writeText(t); enqueueSnackbar('已复制', { variant: 'success' }); };
  const copyAll = () => { copy(JSON.stringify(card, null, 2)); };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!card) return <Typography py={8} textAlign="center" color="text.secondary">暂无数据，请先生成生产卡</Typography>;

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

      {isMock && <Alert severity="warning" sx={{ mb: 2 }}>当前展示示例数据。点击「AI 重新生成」将基于真实评论数据生成内容生产卡。</Alert>}

      <Grid container spacing={2}>
        <Grid size={12}><Card><CardContent>
          <Field label="内容目标" value={card.contentGoal} />
          <Field label="目标用户" value={card.targetUser} />
          <Field label="核心判断" value={card.coreJudgment} color="primary.main" />
        </CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent>
          <Field label="标题方案">
            {(card.titleOptions || []).map((t: string, i: number) => (
              <Typography key={i} variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => copy(t)}>{i + 1}. {t}</Typography>
            ))}
          </Field>
        </CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent>
          <Field label="封面文案" value={card.coverText} />
          <Typography variant="subtitle2" mt={1}>核心关键词</Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
            {(card.coreKeywords || []).map((k: string, i: number) => <Chip key={i} label={k} size="small" />)}
          </Box>
        </CardContent></Card></Grid>

        <Grid size={12}><Card><CardContent>
          <Field label="搜索词布局" value={card.searchLayout} />
        </CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent>
          <Field label="正文结构" value={(card.bodyStructure || []).map((s: string, i: number) => `${i + 1}. ${s}`).join(' | ')} />
        </CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent>
          <Field label="笔记类型" value={card.noteType} />
          <Typography variant="subtitle2" mt={1}>收藏点</Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
            {(card.collectionPoints || []).map((c: string, i: number) => <Chip key={i} label={c} size="small" icon={<Bookmark />} />)}
          </Box>
        </CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent>
          <Field label="素材需求" chips={(card.materialNeeds || [])} />
          <Field label="卖点呈现" value={card.sellingPoints} />
        </CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent>
          <Field label="证明机制" value={card.proofMechanism} />
          <Field label="CTA" value={card.cta} color="success.main" />
        </CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent>
          <Field label="互动问题" values={(card.interactionQuestions || [])} />
        </CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent>
          <Field label="避坑提醒" bullets={(card.avoidanceTips || [])} />
        </CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent>
          <Field label="验收标准" bullets={(card.acceptanceCriteria || [])} />
        </CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent>
          <Field label="验证指标" chips={(card.verificationMetrics || [])} />
        </CardContent></Card></Grid>
      </Grid>
    </Box>
  );
}

function Field({ label, value, color, chips, values, bullets }: any) {
  return (
    <Box mb={1.5}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      {value && <Box mt={0.5}><Typography variant="body2" color={color}>{value}</Typography></Box>}
      {chips && <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>{chips.map((c: string, i: number) => <Chip key={i} label={c} size="small" />)}</Box>}
      {values && <Box mt={0.5}>{(values || []).map((q: string, i: number) => <Typography key={i} variant="body2">💬 {q}</Typography>)}</Box>}
      {bullets && <Box mt={0.5}>{(bullets || []).map((b: string, i: number) => <Typography key={i} variant="body2">• {b}</Typography>)}</Box>}
    </Box>
  );
}
