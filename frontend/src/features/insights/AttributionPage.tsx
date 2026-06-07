import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip,
  CircularProgress, Stepper, Step, StepLabel, Alert,
} from '@mui/material';
import { ArrowBack, ArrowForward, Chat, ContentCopy, TrendingUp } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';

export default function AttributionPage() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/api/tasks/${taskId}/attribution`).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!data) return <Typography>暂无数据</Typography>;

  const isMock = data._source === 'mock';

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/insights`)}>返回</Button>
        <Typography variant="h4" fontWeight={700}>内容-评论归因</Typography>
        <Chip
          label={isMock ? '示例数据' : 'AI 分析'}
          size="small"
          color={isMock ? 'warning' : 'success'}
          variant="outlined"
        />
      </Box>

      {isMock && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          当前展示的是示例数据。启动分析任务后，AI Pipeline 将基于真实评论生成归因结果。
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        本页展示评论是如何被内容的特定部分触发的，帮助内容负责人理解"为什么用户会这样评论"
      </Alert>

      <Grid container spacing={3}>
        {data.attributions?.map((a: any, i: number) => (
          <Grid size={{ xs: 12 }} key={i}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary.main">
                  {i + 1}. {a.commentPhenomenon}
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          <Chat fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          评论证据
                        </Typography>
                        {a.commentEvidence?.map((e: string, j: number) => (
                          <Chip key={j} label={`"${e}"`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          <ContentCopy fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          内容触发点
                        </Typography>
                        <Typography variant="body2">{a.contentTrigger}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Attribution Flow */}
                <Box my={2} display="flex" alignItems="center" justifyContent="center" flexWrap="wrap" gap={2}>
                  {[
                    { label: '归因判断', text: a.attributionJudgment, color: '#f44336' },
                    { label: '用户真实需求', text: a.userRealNeed, color: '#ff9800' },
                    { label: '内容缺口', text: a.contentGap, color: '#2196f3' },
                    { label: '业务影响', text: a.businessImpact, color: '#9c27b0' },
                  ].map((item, idx) => (
                    <Box key={idx} textAlign="center">
                      <Box px={2} py={1} bgcolor={`${item.color}15`} borderRadius={1} border={`1px solid ${item.color}`} maxWidth={200}>
                        <Typography variant="caption" color={item.color} fontWeight={600}>{item.label}</Typography>
                        <Typography variant="body2">{item.text}</Typography>
                      </Box>
                      {idx < 3 && <ArrowForward sx={{ color: 'text.disabled', mt: 0.5 }} />}
                    </Box>
                  ))}
                </Box>

                <Box mt={2} p={1.5} bgcolor="success.light" borderRadius={1} color="success.contrastText">
                  <Typography variant="body2" fontWeight={600}>
                    <TrendingUp fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    下一条内容动作：{a.nextAction}
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
