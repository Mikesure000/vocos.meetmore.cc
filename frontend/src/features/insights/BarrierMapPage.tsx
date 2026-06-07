import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip,
  CircularProgress, LinearProgress, Alert,
} from '@mui/material';
import { ArrowBack, Warning, TrendingUp } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';

const levelColors: Record<string, string> = { high: '#f44336', medium: '#ff9800', low: '#2196f3' };
const priorityLabels: Record<string, string> = { P0: 'P0 必做', P1: 'P1 建议', P2: 'P2 储备' };

export default function BarrierMapPage() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/api/tasks/${taskId}/barrier-map`).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!data) return <Typography>暂无数据</Typography>;

  const isMock = data._source === 'mock';

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/insights`)}>返回</Button>
        <Typography variant="h4" fontWeight={700}>购买障碍地图</Typography>
        <Chip
          label={isMock ? '示例数据' : 'AI 分析'}
          size="small"
          color={isMock ? 'warning' : 'success'}
          variant="outlined"
        />
      </Box>

      {isMock && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          当前展示的是示例数据。启动分析任务后，AI Pipeline 将基于真实评论生成障碍分析。
        </Alert>
      )}

      <Grid container spacing={3}>
        {data.barriers?.map((b: any, i: number) => (
          <Grid size={{ xs: 12, md: 6 }} key={i}>
            <Card sx={{ borderLeft: `4px solid ${levelColors[b.level] || '#999'}` }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Box display="flex" gap={1} alignItems="center">
                    <Chip label={priorityLabels[b.priority] || b.priority} size="small"
                      color={b.priority === 'P0' ? 'error' : b.priority === 'P1' ? 'warning' : 'info'} />
                    <Typography variant="h6">{b.type === 'price' ? '价格障碍' : b.type === 'trust' ? '信任障碍' : b.type === 'effect' ? '效果障碍' : b.type === 'safety' ? '安全障碍' : b.type === 'applicability' ? '适配障碍' : '竞品障碍'}</Typography>
                  </Box>
                  <Chip label={b.level === 'high' ? '高' : b.level === 'medium' ? '中' : '低'}
                    size="small" color={b.level === 'high' ? 'error' : b.level === 'medium' ? 'warning' : 'info'} />
                </Box>

                <Box mb={1}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">占比</Typography>
                    <Typography variant="caption" fontWeight={600}>{b.percentage}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={b.percentage * 3}
                    sx={{ height: 8, borderRadius: 4 }} color={b.level === 'high' ? 'error' : 'warning'} />
                </Box>

                <Typography variant="caption" color="text.secondary">证据:</Typography>
                {b.evidence?.map((e: string, j: number) => (
                  <Chip key={j} label={`"${e}"`} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                ))}

                <Alert severity="warning" sx={{ mt: 1, mb: 1, py: 0 }}>
                  <Typography variant="body2" fontWeight={600}>{b.userPsychology}</Typography>
                </Alert>

                <Box mt={1} p={1} bgcolor="action.hover" borderRadius={1}>
                  <Typography variant="body2" fontWeight={600}>
                    <TrendingUp fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    {b.action}
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
