import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip,
  CircularProgress, LinearProgress, Alert,
} from '@mui/material';
import { ArrowBack, TrendingUp, Lightbulb, Chat } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';

export default function DemandMapPage() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/api/tasks/${taskId}/demand-map`).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!data) return <Typography>暂无数据</Typography>;

  const isMock = data._source === 'mock';
  const freqColor: Record<string, string> = { high: '#f44336', medium: '#ff9800', low: '#4caf50' };
  const intensityWidth: Record<string, number> = { strong: 90, moderate: 60, weak: 30 };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/insights`)}>返回</Button>
        <Typography variant="h4" fontWeight={700}>用户需求地图</Typography>
        <Chip
          label={isMock ? '示例数据' : 'AI 分析'}
          size="small"
          color={isMock ? 'warning' : 'success'}
          variant="outlined"
        />
      </Box>

      {isMock && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          当前展示的是示例数据。启动分析任务后，AI Pipeline 将基于真实评论生成需求分析。
        </Alert>
      )}

      <Grid container spacing={3}>
        {data.demands?.map((d: any, i: number) => (
          <Grid size={{ xs: 12, md: 6 }} key={i}>
            <Card sx={{ borderLeft: `4px solid ${freqColor[d.frequency] || '#999'}` }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Typography variant="h6">{d.category}</Typography>
                  <Box display="flex" gap={0.5}>
                    <Chip label={d.frequency === 'high' ? '高频' : d.frequency === 'medium' ? '中频' : '低频'}
                      size="small" color={d.frequency === 'high' ? 'error' : d.frequency === 'medium' ? 'warning' : 'success'} />
                    <Chip label={d.intensity === 'strong' ? '强需求' : d.intensity === 'moderate' ? '中等' : '弱'}
                      size="small" variant="outlined" />
                  </Box>
                </Box>

                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">需求强度</Typography>
                  <LinearProgress variant="determinate" value={intensityWidth[d.intensity] || 30}
                    sx={{ height: 6, borderRadius: 3 }} color={d.intensity === 'strong' ? 'error' : 'warning'} />
                </Box>

                <Alert severity="info" sx={{ mb: 1, py: 0 }}>
                  <Typography variant="body2">{d.insight}</Typography>
                </Alert>

                <Typography variant="caption" color="text.secondary">代表评论:</Typography>
                {d.representativeComments?.map((c: string, j: number) => (
                  <Chip key={j} icon={<Chat fontSize="small" />} label={`"${c}"`} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                ))}

                <Box mt={1} p={1} bgcolor="success.light" borderRadius={1} color="success.contrastText">
                  <Typography variant="body2" fontWeight={600}>
                    <Lightbulb fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    {d.suggestedContent}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
