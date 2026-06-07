import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip, CircularProgress,
  LinearProgress, Alert, Table, TableBody, TableCell, TableRow, TableHead,
} from '@mui/material';
import { ArrowBack, TrendingUp, Warning, CheckCircle, AutoAwesome } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';

export default function AdFitPage() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    apiClient.get(`/api/tasks/${taskId}/ad-fit`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [taskId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try { const r = await apiClient.post(`/api/tasks/${taskId}/ad-fit/generate`); setData(r.data); } catch {}
    finally { setGenerating(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!data) return <Typography>暂无数据</Typography>;

  const isMock = data._source === 'mock';
  const scoreColor = (data.score || 0) >= 80 ? 'success.main' : (data.score || 0) >= 60 ? 'warning.main' : 'error.main';

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/strategy`)}>返回</Button>
        <Typography variant="h4" fontWeight={700}>投流适配评分</Typography>
        <Chip label={isMock ? '示例数据' : 'AI 分析'} size="small" color={isMock ? 'warning' : 'success'} variant="outlined" />
      </Box>

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="outlined" startIcon={<AutoAwesome />} onClick={handleGenerate} disabled={generating}>{generating ? '生成中...' : 'AI 重新评估'}</Button>
      </Box>

      {isMock && <Alert severity="warning" sx={{ mb: 2 }}>当前展示示例数据。启动分析任务后将基于真实评论生成投流评估。</Alert>}

      <Grid container spacing={3}>
        <Grid size={4}>
          <Card><CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h2" fontWeight={700} color={scoreColor}>{data.score || '—'}<Typography component="span" variant="h5" color="text.secondary">/100</Typography></Typography>
            <Typography color="text.secondary">投流适配评分</Typography>
            {data.conclusion && <Chip label={data.conclusion} size="small" color={data.score >= 70 ? 'success' : 'warning'} sx={{ mt: 1 }} />}
          </CardContent></Card>
        </Grid>

        <Grid size={8}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>评分维度</Typography>
            {(data.dimensions || []).map((d: any, i: number) => (
              <Box key={i} mb={1.5}>
                <Box display="flex" justifyContent="space-between" mb={0.3}>
                  <Typography variant="body2">{d.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{d.score}/{d.weight}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={(d.score / d.weight) * 100} sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 3 } }} />
                {d.comment && <Typography variant="caption" color="text.secondary">{d.comment}</Typography>}
              </Box>
            ))}
          </CardContent></Card>
        </Grid>

        <Grid size={6}><Card><CardContent>
          <Typography variant="h6" gutterBottom>测试变量建议</Typography>
          {(data.testVariables || []).map((v: any, i: number) => <Box key={i} display="flex" gap={1} alignItems="center" mb={1}><Chip label={v.variant} size="small" color="primary" variant="outlined" /><Box><Typography variant="body2" fontWeight={600}>{v.name}</Typography><Typography variant="caption" color="text.secondary">{v.description}</Typography></Box></Box>)}
        </CardContent></Card></Grid>

        <Grid size={6}><Card><CardContent>
          <Typography variant="h6" gutterBottom>投流建议</Typography>
          {data.targetAudience && <><Typography variant="subtitle2">推荐人群</Typography><Typography variant="body2" mb={1}>{data.targetAudience}</Typography></>}
          {data.scaleAdvice && <><Typography variant="subtitle2">放量建议</Typography><Typography variant="body2" mb={1}>{data.scaleAdvice}</Typography></>}
          {data.riskWarning && <Alert severity="warning" sx={{ mt: 1 }} icon={<Warning />}>{data.riskWarning}</Alert>}
        </CardContent></Card></Grid>
      </Grid>
    </Box>
  );
}
