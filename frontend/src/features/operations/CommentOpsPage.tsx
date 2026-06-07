import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip, CircularProgress,
  Alert, List, ListItem, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import { ArrowBack, PushPin, Reply, SmsFailed, Email, QuestionAnswer, TrendingUp, Warning, AutoAwesome, ContentCopy } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { apiClient } from '../../shared/api/client';

export default function CommentOpsPage() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    apiClient.get(`/api/tasks/${taskId}/comment-ops`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [taskId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try { const r = await apiClient.post(`/api/tasks/${taskId}/comment-ops/generate`); setData(r.data); } catch {}
    finally { setGenerating(false); }
  };

  const copy = (t: string) => { navigator.clipboard.writeText(t); enqueueSnackbar('已复制', { variant: 'success' }); };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!data) return <Typography>暂无数据</Typography>;

  const isMock = data._source === 'mock';

  const Section = ({ title, icon, children }: any) => (
    <Card sx={{ mb: 2 }}><CardContent>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}><Box color="primary.main">{icon}</Box><Typography variant="h6">{title}</Typography></Box>
      {children}
    </CardContent></Card>
  );

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/strategy`)}>返回</Button>
        <Typography variant="h4" fontWeight={700}>评论区运营方案</Typography>
        <Chip label={isMock ? '示例数据' : 'AI 生成'} size="small" color={isMock ? 'warning' : 'success'} variant="outlined" />
      </Box>

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="outlined" startIcon={<AutoAwesome />} onClick={handleGenerate} disabled={generating}>{generating ? '生成中...' : 'AI 重新生成'}</Button>
      </Box>

      {isMock && <Alert severity="warning" sx={{ mb: 2 }}>当前展示示例数据。启动分析任务后将基于真实评论生成运营方案。</Alert>}

      <Grid container spacing={2}>
        {/* 建议置顶 */}
        <Grid size={6}>
          <Section title="建议置顶评论" icon={<PushPin />}>
            {(data.pinned || []).map((t: string, i: number) => (
              <Alert key={i} severity="info" sx={{ mb: 1, cursor: 'pointer' }} onClick={() => copy(t)}>{t}</Alert>
            ))}
          </Section>
        </Grid>

        {/* 标准回复 */}
        <Grid size={6}>
          <Section title="高频问题标准回复" icon={<Reply />}>
            {(data.standardReplies || []).map((r: any, i: number) => (
              <Box key={i} mb={1.5}><Typography variant="subtitle2" color="primary.main">{r.type}</Typography><Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }} onClick={() => copy(r.template)}>{r.template}</Typography></Box>
            ))}
          </Section>
        </Grid>

        {/* 负面回应 */}
        <Grid size={6}>
          <Section title="负面评论回应" icon={<SmsFailed />}>
            {(data.negativeReplies || []).map((r: any, i: number) => (
              <Box key={i} mb={1.5}><Typography variant="subtitle2" color="error.main">{r.scenario}</Typography><Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }} onClick={() => copy(r.reply)}>{r.reply}</Typography></Box>
            ))}
          </Section>
        </Grid>

        {/* 私信承接 */}
        <Grid size={6}>
          <Section title="私信承接话术" icon={<Email />}>
            {(data.dmScripts || []).map((t: string, i: number) => (
              <Typography key={i} variant="body2" color="text.secondary" mb={1} sx={{ cursor: 'pointer' }} onClick={() => copy(t)}>💬 {t}</Typography>
            ))}
          </Section>
        </Grid>

        {/* 互动 + 引导 */}
        <Grid size={6}>
          <Section title="二次互动问题" icon={<QuestionAnswer />}>
            {(data.interactionQuestions || []).map((t: string, i: number) => (
              <Typography key={i} variant="body2" mb={0.5}>❓ {t}</Typography>
            ))}
          </Section>
          <Section title="下一条内容引导" icon={<TrendingUp />}>
            {(data.nextContentHooks || []).map((t: string, i: number) => (
              <Typography key={i} variant="body2" color="primary.main" mb={0.5}>📢 {t}</Typography>
            ))}
          </Section>
        </Grid>

        {/* 高风险处理 */}
        <Grid size={6}>
          <Section title="高风险评论处理" icon={<Warning />}>
            {(data.highRisk || []).map((r: any, i: number) => (
              <Box key={i} mb={1.5}><Typography variant="subtitle2" color="error.main" mb={0.3}>{r.signal}</Typography><Typography variant="body2" color="text.secondary">{r.action}</Typography></Box>
            ))}
          </Section>
        </Grid>
      </Grid>
    </Box>
  );
}
