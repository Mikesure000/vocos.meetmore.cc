import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  Table, TableBody, TableCell, TableRow,
} from '@mui/material';
import { Add, Assessment, TrendingUp, Insights, Description, Comment, AutoAwesome, ContentPaste, Replay, Category } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';
import { PageShell } from '../../shared/components/PageShell';

export default function WorkspacePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/workspace/stats').then((r) => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageShell loading skeleton />;

  const statCards = [
    { label: '活跃项目', value: stats.projects || 0, icon: <Assessment color="primary" />, color: '#4caf50' },
    { label: '分析任务', value: stats.tasks || 0, icon: <TrendingUp color="success" />, color: '#2196f3' },
    { label: '已完成', value: stats.completedTasks || 0, icon: <Insights color="warning" />, color: '#ff9800' },
    { label: '策略卡', value: stats.strategyCards || 0, icon: <AutoAwesome color="info" />, color: '#9c27b0' },
    { label: '生产卡', value: stats.productionCards || 0, icon: <ContentPaste />, color: '#00bcd4' },
    { label: '复盘数', value: stats.reviews || 0, icon: <Replay />, color: '#e91e63' },
    { label: '报告', value: stats.reports || 0, icon: <Description />, color: '#795548' },
    { label: '评论总数', value: (stats.comments || 0).toLocaleString(), icon: <Comment />, color: '#f44336' },
  ];

  const statusMap: Record<string, string> = {
    draft: '草稿', analyzing: '分析中', completed: '已完成', failed: '失败', ready: '就绪',
  };

  return (
    <PageShell>
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>工作台</Typography>
          <Typography variant="body2" color="text.secondary">Voice of Consumer OS — 评论驱动内容策略系统</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/projects')}>
          新建分析
        </Button>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={1.5} mb={3}>
        {statCards.map((card) => (
          <Grid size={{ xs: 6, sm: 3, md: 1.5 }} key={card.label}>
            <Card sx={{ borderTop: `3px solid ${card.color}` }}>
              <CardContent sx={{ py: 1, textAlign: 'center' }}>
                {card.icon}
                <Typography variant="h5" fontWeight={700} mt={0.5}>{card.value}</Typography>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Tasks */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">最近任务</Typography>
                <Button size="small" onClick={() => navigate('/projects')}>查看全部</Button>
              </Box>
              {stats.recentTasks?.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary">暂无任务</Typography>
                  <Button sx={{ mt: 1 }} onClick={() => navigate('/projects')}>创建第一个任务</Button>
                </Box>
              ) : (
                <Table size="small">
                  <TableBody>
                    {stats.recentTasks?.map((t: any) => (
                      <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${t.projectId}/tasks/${t.id}/insights`)}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{t.taskName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.project?.category?.icon} {t.project?.projectName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {t.project?.category && <Chip label={t.project.category.name} size="small" variant="outlined" sx={{ mr: 0.5 }} />}
                          <Chip label={t.platform === 'douyin' ? '抖音' : '小红书'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip label={statusMap[t.status] || t.status} size="small"
                            color={t.status === 'completed' ? 'success' : t.status === 'analyzing' ? 'info' : 'default'} />
                        </TableCell>
                        <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 品类分布 + 快速开始 */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* 品类分布 */}
          {stats.categoryStats?.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>品类分布</Typography>
                {stats.categoryStats.map((c: any) => (
                  <Box key={c.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, p: 0.5, borderRadius: 1 }}
                    onClick={() => navigate(`/category/${c.id}/knowledge`)}>
                    <Typography variant="body2">{c.icon} {c.name}</Typography>
                    <Chip label={`${c.projectCount} 项目`} size="small" variant="outlined" />
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 快速开始 */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>快速开始</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {['1. 创建项目并选择品类', '2. 创建分析任务', '3. 上传评论文件', '4. AI 自动分析', '5. 查看策略卡+生产卡'].map((step) => (
                  <Chip key={step} label={step} variant="outlined" sx={{ justifyContent: 'flex-start', height: 32 }} />
                ))}
              </Box>
              <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => navigate('/projects')}>开始使用</Button>
            </CardContent>
          </Card>

          {/* 今日概览 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>今日概览</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">今日新任务</Typography>
                <Typography fontWeight={600}>{stats.todayTasks || 0}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">累计评论</Typography>
                <Typography fontWeight={600}>{(stats.comments || 0).toLocaleString()}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">生产卡</Typography>
                <Typography fontWeight={600}>{stats.productionCards || 0}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">复盘数</Typography>
                <Typography fontWeight={600}>{stats.reviews || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
    </PageShell>
  );
}
