import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Paper, Button, TextField,
  LinearProgress, Chip, CircularProgress, Alert, IconButton, Divider,
} from '@mui/material';
import { ArrowBack, Add, Refresh, TrendingUp, TrendingDown } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';

interface Review {
  id: string;
  taskId: string;
  newContentUrl?: string;
  newContentTitle?: string;
  newContentBody?: string;
  strategyExecutionScore: number;
  cardEffectivenessScore: number;
  metrics?: { clickRate?: number; collectRate?: number; commentSentiment?: string };
  commentChangeAssessment?: { improved: string[]; unchanged: string[]; new: string[] };
  nextRoundSuggestions?: { priority: string; action: string; reason: string }[];
  status: string;
  createdAt: string;
  taskName?: string;
}

export default function PostPublishReviewPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newContentUrl, setNewContentUrl] = useState('');
  const [newContentTitle, setNewContentTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const loadReviews = () => {
    setLoading(true);
    apiClient.get('/api/reviews')
      .then((res) => { setReviews(res.data || []); setLoading(false); })
      .catch((err) => { setError('加载复盘列表失败'); setLoading(false); });
  };

  useEffect(() => { loadReviews(); }, []);

  const createReview = () => {
    apiClient.post('/api/reviews', { taskId: 'demo-task', newContentUrl, newContentTitle, newContentBody: '' })
      .then(() => {
        setShowCreate(false); setNewContentUrl(''); setNewContentTitle(''); loadReviews();
      })
      .catch(() => setError('创建复盘失败'));
  };

  const scoreColor = (score: number) => (score >= 70 ? 'success.main' : score >= 40 ? 'warning.main' : 'error.main');

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>发布后复盘</Typography>
          <Typography variant="body2" color="text.secondary">
            上传新内容数据，对比上一轮生产卡，形成内容迭代闭环
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreate(!showCreate)}>
          新建复盘
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* 创建复盘表单 */}
      {showCreate && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>新建复盘任务</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="新内容链接" value={newContentUrl}
                onChange={(e) => setNewContentUrl(e.target.value)} size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="新内容标题" value={newContentTitle}
                onChange={(e) => setNewContentTitle(e.target.value)} size="small" />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={createReview}>提交创建</Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {loading ? <CircularProgress /> : (
        <Grid container spacing={3}>
          {/* 复盘列表 */}
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>复盘历史</Typography>
            {reviews.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                <Typography color="text.secondary">暂无复盘记录，点击"新建复盘"开始</Typography>
              </Paper>
            )}
            {reviews.map((r) => (
              <Card
                key={r.id}
                sx={{
                  mb: 1, cursor: 'pointer', borderRadius: 2,
                  border: selectedReview?.id === r.id ? '2px solid' : '1px solid',
                  borderColor: selectedReview?.id === r.id ? 'primary.main' : 'divider',
                }}
                onClick={() => setSelectedReview(r)}
              >
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {r.newContentTitle || '复盘任务'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label={r.status === 'completed' ? '已完成' : '进行中'} size="small"
                      color={r.status === 'completed' ? 'success' : 'default'} />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Grid>

          {/* 复盘详情 */}
          <Grid item xs={12} md={7}>
            {selectedReview ? (
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  {selectedReview.newContentTitle || '复盘详情'}
                </Typography>

                {/* 评分卡片 */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">策略执行评分</Typography>
                      <Typography variant="h3" fontWeight={700} sx={{ color: scoreColor(selectedReview.strategyExecutionScore) }}>
                        {selectedReview.strategyExecutionScore}
                      </Typography>
                      <LinearProgress variant="determinate" value={selectedReview.strategyExecutionScore}
                        sx={{ mt: 1, borderRadius: 1, height: 6 }} />
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">生产卡有效性</Typography>
                      <Typography variant="h3" fontWeight={700} sx={{ color: scoreColor(selectedReview.cardEffectivenessScore) }}>
                        {selectedReview.cardEffectivenessScore}
                      </Typography>
                      <LinearProgress variant="determinate" value={selectedReview.cardEffectivenessScore}
                        color="secondary" sx={{ mt: 1, borderRadius: 1, height: 6 }} />
                    </Paper>
                  </Grid>
                </Grid>

                {/* 评论变化 */}
                {selectedReview.commentChangeAssessment && (
                  <Paper sx={{ p: 3, borderRadius: 3, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>评论区变化对比</Typography>
                    {selectedReview.commentChangeAssessment.improved?.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Chip icon={<TrendingUp />} label="已改善" size="small" color="success" sx={{ mr: 1, mb: 1 }} />
                        {selectedReview.commentChangeAssessment.improved.map((item: string, i: number) => (
                          <Chip key={i} label={item} size="small" variant="outlined" sx={{ m: 0.25 }} />
                        ))}
                      </Box>
                    )}
                    {selectedReview.commentChangeAssessment.unchanged?.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Chip label="未变化" size="small" color="default" sx={{ mr: 1, mb: 1 }} />
                        {selectedReview.commentChangeAssessment.unchanged.map((item: string, i: number) => (
                          <Chip key={i} label={item} size="small" variant="outlined" sx={{ m: 0.25 }} />
                        ))}
                      </Box>
                    )}
                    {selectedReview.commentChangeAssessment.new?.length > 0 && (
                      <Box>
                        <Chip icon={<TrendingDown />} label="新出现" size="small" color="warning" sx={{ mr: 1, mb: 1 }} />
                        {selectedReview.commentChangeAssessment.new.map((item: string, i: number) => (
                          <Chip key={i} label={item} size="small" variant="outlined" sx={{ m: 0.25 }} color="warning" />
                        ))}
                      </Box>
                    )}
                  </Paper>
                )}

                {/* 下轮建议 */}
                {selectedReview.nextRoundSuggestions?.length > 0 && (
                  <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>下一轮内容策略建议</Typography>
                    {selectedReview.nextRoundSuggestions.map((sug, i) => (
                      <Box key={i} sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Chip label={sug.priority} size="small" color={sug.priority === 'P0' ? 'error' : 'primary'} />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{sug.action}</Typography>
                          <Typography variant="caption" color="text.secondary">{sug.reason}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                )}
              </Box>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                <Typography color="text.secondary">选择一个复盘记录查看详情</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
