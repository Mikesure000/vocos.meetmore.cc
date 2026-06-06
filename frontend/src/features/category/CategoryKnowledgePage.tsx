import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Paper, Tabs, Tab,
  List, ListItem, ListItemIcon, ListItemText, CircularProgress, Alert, Button,
  Divider,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Warning, Info, SmartToy,
  Psychology, Rule, Campaign,
} from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';

interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  knowledgeBase: { dimensions: string[]; keyConcerns: string[]; [key: string]: any };
  complianceRules: string[];
  platformMethodology: { douyin: any; xiaohongshu: any };
}

export default function CategoryKnowledgePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/categories/${id}`)
      .then((res) => { setCategory(res.data); setLoading(false); })
      .catch((err) => { setError('加载失败: ' + (err.response?.data?.error || err.message)); setLoading(false); });
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  if (!category) return <Alert severity="warning" sx={{ m: 3 }}>品类不存在</Alert>;

  const hasDouyin = category.platformMethodology?.douyin;
  const hasXiaohongshu = category.platformMethodology?.xiaohongshu;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* 顶部导航 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/category')} sx={{ textTransform: 'none' }}>
          返回品类列表
        </Button>
      </Box>

      {/* 品类标题 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>{category.icon}</Typography>
        <Typography variant="h4" fontWeight={700}>{category.name} 知识库</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>{category.description}</Typography>
      </Box>

      {/* Tab 导航 */}
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="品类特征" icon={<Psychology />} iconPosition="start" />
        <Tab label="合规规则" icon={<Warning />} iconPosition="start" />
        <Tab label="平台方法论" icon={<Campaign />} iconPosition="start" />
      </Tabs>

      {/* Tab 0: 品类特征 */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          {/* 核心维度 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info color="primary" /> 核心分析维度
              </Typography>
              <List dense>
                {(category.knowledgeBase.dimensions || []).map((dim: string, i: number) => (
                  <ListItem key={i}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <SmartToy fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={dim} primaryTypographyProps={{ fontSize: 14 }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* 关键关注点 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" /> 用户关键关注点
              </Typography>
              {category.knowledgeBase.keyConcerns?.map((concern: string, i: number) => (
                <Chip key={i} label={concern} sx={{ m: 0.5, borderRadius: 1 }} variant="outlined" color="primary" />
              ))}
            </Paper>
          </Grid>

          {/* 扩展维度 */}
          {Object.entries(category.knowledgeBase)
            .filter(([k]) => !['dimensions', 'keyConcerns'].includes(k) && Array.isArray(category.knowledgeBase[k]))
            .map(([key, values]) => (
              <Grid item xs={12} md={6} key={key}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, textTransform: 'capitalize' }}>
                    {key}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(values as string[]).map((v: string, i: number) => (
                      <Chip key={i} label={v} size="small" sx={{ borderRadius: 1 }} />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
        </Grid>
      )}

      {/* Tab 1: 合规规则 */}
      {tabIndex === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" /> 合规表达边界
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {category.name}品类发布前必须遵守以下合规规则，尤其在抖音和小红书平台。
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {(category.complianceRules || []).map((rule: string, i: number) => (
              <ListItem key={i}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Rule fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={rule}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Tab 2: 平台方法论 */}
      {tabIndex === 2 && (
        <Grid container spacing={3}>
          {hasDouyin && (
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: '#ff0050' }}>
                    🎵 抖音方法论
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">推荐开头钩子</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {(category.platformMethodology.douyin?.hooks || []).map((h: string, i: number) => (
                        <Chip key={i} label={h} size="small" sx={{ borderRadius: 1, bgcolor: 'rgba(255,0,80,0.1)' }} />
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">内容结构</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {(category.platformMethodology.douyin?.structures || []).map((s: string, i: number) => (
                        <Chip key={i} label={s} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    建议时长: {category.platformMethodology.douyin?.minDuration}-{category.platformMethodology.douyin?.maxDuration}秒
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {hasXiaohongshu && (
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: '#ff2442' }}>
                    📕 小红书方法论
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">标题类型</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {(category.platformMethodology.xiaohongshu?.titles || []).map((t: string, i: number) => (
                        <Chip key={i} label={t} size="small" sx={{ borderRadius: 1, bgcolor: 'rgba(255,36,66,0.1)' }} />
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">关键词</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {(category.platformMethodology.xiaohongshu?.keywords || []).map((k: string, i: number) => (
                        <Chip key={i} label={k} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                      ))}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">正文结构</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {(category.platformMethodology.xiaohongshu?.structures || []).map((s: string, i: number) => (
                        <Chip key={i} label={s} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
