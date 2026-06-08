import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip,
  CircularProgress, Alert, Accordion, AccordionSummary, AccordionDetails,
  Divider, Table, TableBody, TableCell, TableRow,
} from '@mui/material';
import { ArrowBack, ExpandMore, Chat, ContentCopy, TrendingUp, Psychology, Campaign, CheckCircle, Analytics } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';

const stepLabels = ['识别现象', '定位触发', '分析原因', '品类判断', '制定动作', '平台差异', '验证指标'];

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
  const hasMethodology = !!data.methodology;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/insights`)}>返回</Button>
        <Typography variant="h4" fontWeight={700}>内容-评论归因</Typography>
        <Chip label={isMock ? '示例数据' : 'AI 分析'} size="small" color={isMock ? 'warning' : 'success'} variant="outlined" />
      </Box>

      {isMock && <Alert severity="warning" sx={{ mb: 2 }}>当前展示示例数据。启动分析任务后，AI Pipeline 将基于真实评论生成归因结果。</Alert>}

      {/* Methodology */}
      {hasMethodology && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom><Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />归因框架</Typography>
            <Alert severity="info" icon={false} sx={{ mb: 2 }}>
              <Typography variant="body2" fontFamily="monospace" whiteSpace="pre-wrap">{data.methodology}</Typography>
            </Alert>
            <Box display="flex" gap={1} flexWrap="wrap">
              {stepLabels.map((s, i) => (
                <Chip key={i} label={`${i+1}. ${s}`} size="small" variant="outlined" color={i < 3 ? 'primary' : 'default'} />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {data.attributions?.map((a: any, i: number) => (
          <Grid size={{ xs: 12 }} key={i}>
            <Card sx={{ borderLeft: '4px solid', borderColor: i === 0 ? 'error.main' : i === 1 ? 'warning.main' : 'info.main' }}>
              <CardContent>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="h6" color="primary.main">{i + 1}. {a.commentPhenomenon}</Typography>
                    {a.rootCause && <Typography variant="body2" color="text.secondary" mt={0.5}>{a.rootCause}</Typography>}
                  </Box>
                  {a.priority && <Chip label={a.priority || `P${i}`} color="error" size="small" />}
                </Box>

                {/* Evidence + Trigger */}
                <Grid container spacing={2} mb={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined"><CardContent sx={{ py: 1 }}>
                      <Typography variant="subtitle2" gutterBottom><Chat fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />评论证据</Typography>
                      {a.commentEvidence?.map((e: string, j: number) => <Chip key={j} label={`"${e}"`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)}
                    </CardContent></Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined"><CardContent sx={{ py: 1 }}>
                      <Typography variant="subtitle2" gutterBottom><ContentCopy fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />内容触发点</Typography>
                      <Typography variant="body2">{a.contentTrigger}</Typography>
                      {a.contentGap && <Typography variant="caption" color="error.main" display="block" mt={0.5}>缺口: {a.contentGap}</Typography>}
                    </CardContent></Card>
                  </Grid>
                </Grid>

                {/* Key Insights Flow */}
                <Box mb={2} display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                  {[
                    { label: '归因判断', text: a.attributionJudgment, color: '#f44336' },
                    { label: '深层原因', text: a.rootCause?.slice(0, 60) || a.attributionJudgment, color: '#ff9800' },
                    { label: '真实需求', text: a.userRealNeed, color: '#2196f3' },
                    { label: '业务影响', text: a.businessImpact, color: '#9c27b0' },
                  ].filter(Boolean).map((item, idx) => (
                    <Box key={idx} flex={1} minWidth={160} textAlign="center">
                      <Box px={1.5} py={1} bgcolor={`${item.color}12`} borderRadius={1} border={`1px solid ${item.color}40`}>
                        <Typography variant="caption" color={item.color} fontWeight={600}>{item.label}</Typography>
                        <Typography variant="body2" fontSize={12}>{item.text}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Category Context */}
                {a.categoryContext && (
                  <Alert severity="info" sx={{ mb: 2 }} icon={<Psychology />}>
                    <Typography variant="body2"><strong>品类判断:</strong> {a.categoryContext}</Typography>
                  </Alert>
                )}

                {/* Next Actions */}
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom><TrendingUp fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />下一条内容动作</Typography>
                  {a.nextAction_p0 && (
                    <Alert severity="success" sx={{ mb: 1 }}>
                      <Chip label="P0 必做" size="small" color="error" sx={{ mr: 1 }} />
                      {a.nextAction_p0}
                    </Alert>
                  )}
                  {a.nextAction_p1 && (
                    <Alert severity="info">
                      <Chip label="P1 建议" size="small" color="warning" sx={{ mr: 1 }} />
                      {a.nextAction_p1}
                    </Alert>
                  )}
                  {!a.nextAction_p0 && a.nextAction && (
                    <Alert severity="success">{a.nextAction}</Alert>
                  )}
                </Box>

                {/* Platform Strategy */}
                {a.platformStrategy && (
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2"><Campaign fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />平台差异化打法</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1}>
                        {a.platformStrategy.douyin && (
                          <Grid size={6}><Card variant="outlined"><CardContent sx={{ py: 1 }}>
                            <Typography variant="subtitle2" color="#ff0050">🎵 抖音</Typography>
                            <Typography variant="body2" fontSize={12}>{a.platformStrategy.douyin}</Typography>
                          </CardContent></Card></Grid>
                        )}
                        {a.platformStrategy.xiaohongshu && (
                          <Grid size={6}><Card variant="outlined"><CardContent sx={{ py: 1 }}>
                            <Typography variant="subtitle2" color="#ff2442">📕 小红书</Typography>
                            <Typography variant="body2" fontSize={12}>{a.platformStrategy.xiaohongshu}</Typography>
                          </CardContent></Card></Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Verify Metrics */}
                {a.verifyMetrics && (
                  <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary"><CheckCircle fontSize="small" sx={{ verticalAlign: 'middle' }} /> 验证指标:</Typography>
                    {a.verifyMetrics.map((m: string, j: number) => <Chip key={j} label={m} size="small" variant="outlined" color="success" />)}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
