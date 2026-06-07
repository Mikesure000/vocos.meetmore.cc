import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Paper, Tabs, Tab,
  List, ListItem, ListItemIcon, ListItemText, CircularProgress, Alert, Button,
  Divider, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Warning, Info, SmartToy, Psychology,
  Rule, Campaign, ExpandMore, Lightbulb, Reply, TrendingUp, CalendarToday,
} from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';

export default function CategoryKnowledgePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/api/categories/${id}`)
      .then((res) => { setCategory(res.data); setLoading(false); })
      .catch((err) => { setError('加载失败'); setLoading(false); });
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  if (!category) return <Alert severity="warning" sx={{ m: 3 }}>品类不存在</Alert>;

  const kb = category.knowledgeBase || {};
  const hasDouyin = category.platformMethodology?.douyin;
  const hasXiaohongshu = category.platformMethodology?.xiaohongshu;

  const renderArrayChips = (arr: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
      {arr.map((v, i) => <Chip key={i} label={v} size="small" sx={{ borderRadius: 1 }} />)}
    </Box>
  );

  const renderObjectChips = (obj: Record<string, string | string[]>) => (
    <Box sx={{ mt: 1 }}>
      {Object.entries(obj).map(([k, v]) => (
        <Box key={k} sx={{ mb: 1 }}>
          <Typography variant="subtitle2" color="primary.main">{k}</Typography>
          {Array.isArray(v)
            ? <Typography variant="body2" color="text.secondary">{v.join(' · ')}</Typography>
            : <Typography variant="body2" color="text.secondary">{v}</Typography>}
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/category')}>返回品类列表</Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h3">{category.icon}</Typography>
        <Typography variant="h4" fontWeight={700}>{category.name} 知识库</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>{category.description}</Typography>
      </Box>

      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="品类特征" icon={<Psychology />} iconPosition="start" />
        <Tab label="内容策略" icon={<Lightbulb />} iconPosition="start" />
        <Tab label="合规规则" icon={<Warning />} iconPosition="start" />
        <Tab label="平台方法论" icon={<Campaign />} iconPosition="start" />
      </Tabs>

      {/* Tab 0: 品类特征 */}
      {tabIndex === 0 && (
        <Grid container spacing={2}>
          {/* 分析维度 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight={600} mb={1.5}><Info color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />核心分析维度</Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {(kb.dimensions || []).map((d: string, i: number) => (
                  <Chip key={i} label={d} size="small" color="primary" variant="outlined" sx={{ borderRadius: 1 }} />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* 用户关键关注点 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight={600} mb={1.5}><CheckCircle color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />用户关键关注点</Typography>
              {kb.keyConcerns?.map((c: string, i: number) => (
                <Chip key={i} label={c} sx={{ m: 0.3, borderRadius: 1 }} variant="outlined" />
              ))}
            </Paper>
          </Grid>

          {/* 肤质/年龄分组等结构化数据 */}
          {Object.entries(kb).filter(([k]) => typeof kb[k] === 'object' && !Array.isArray(kb[k]) && !['dimensions', 'keyConcerns', 'contentStrategies', 'commonMistakes', 'responseGuidelines', 'forbiddenClaims', 'efficacyCycle', 'seasonalTopics'].includes(k))
            .map(([key, val]: [string, any]) => (
              <Grid size={{ xs: 12, md: 6 }} key={key}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1" fontWeight={600}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>{renderObjectChips(val)}</AccordionDetails>
                </Accordion>
              </Grid>
            ))}

          {/* 数组型扩展数据 */}
          {Object.entries(kb).filter(([k]) => Array.isArray(kb[k]) && !['dimensions', 'keyConcerns'].includes(k))
            .map(([key, values]) => (
              <Grid size={{ xs: 12, md: 6 }} key={key}>
                <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={600} mb={1} textTransform="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Typography>
                  {renderArrayChips(values as string[])}
                </Paper>
              </Grid>
            ))}
        </Grid>
      )}

      {/* Tab 1: 内容策略 */}
      {tabIndex === 1 && kb.contentStrategies && (
        <Grid container spacing={2}>
          {Object.entries(kb.contentStrategies).map(([key, val]: [string, any]) => (
            <Grid size={{ xs: 12, md: 6 }} key={key}>
              <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1} color="primary.main">{key}</Typography>
                <Typography variant="body2" color="text.secondary">{val}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      {tabIndex === 1 && !kb.contentStrategies && (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">该品类暂未配置内容策略</Typography>
        </Paper>
      )}

      {/* 季节话题 (母婴专属) */}
      {tabIndex === 1 && kb.seasonalTopics && (
        <Box mt={2}>
          <Typography variant="h6" fontWeight={600} mb={1.5}><CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />季节内容话题</Typography>
          <Grid container spacing={1}>
            {Object.entries(kb.seasonalTopics).map(([season, topics]: [string, any]) => (
              <Grid size={{ xs: 6, md: 3 }} key={season}>
                <Card variant="outlined"><CardContent sx={{ py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>{season}</Typography>
                  <Typography variant="caption" color="text.secondary">{topics}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* 功效周期 (功效食品专属) */}
      {tabIndex === 1 && kb.efficacyCycle && (
        <Box mt={2}>
          <Typography variant="h6" fontWeight={600} mb={1.5}><TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />功效周期参考</Typography>
          <Grid container spacing={1}>
            {Object.entries(kb.efficacyCycle).map(([period, desc]: [string, any]) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={period}>
                <Card variant="outlined"><CardContent sx={{ py: 1.5 }}>
                  <Chip label={period} size="small" color="primary" variant="outlined" sx={{ mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">{desc}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* 回复指南 */}
      {tabIndex === 1 && kb.responseGuidelines && (
        <Box mt={2}>
          <Typography variant="h6" fontWeight={600} mb={1.5}><Reply sx={{ mr: 1, verticalAlign: 'middle' }} />评论回复指南</Typography>
          <Grid container spacing={1}>
            {Object.entries(kb.responseGuidelines).map(([key, val]: [string, any]) => (
              <Grid size={{ xs: 12 }} key={key}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>{key}</Typography>
                  <Typography variant="body2" color="text.secondary">{val}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tab 2: 合规规则 */}
      {tabIndex === 2 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}><Warning color="warning" sx={{ mr: 1, verticalAlign: 'middle' }} />合规表达边界</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {category.name}品类发布前必须遵守以下合规规则。违反可能导致内容下架、账号限流或行政处罚。
          </Typography>
          <List>
            {(category.complianceRules || []).map((rule: string, i: number) => (
              <ListItem key={i}>
                <ListItemIcon sx={{ minWidth: 28 }}><Rule fontSize="small" color="error" /></ListItemIcon>
                <ListItemText primary={rule} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Tab 3: 平台方法论 */}
      {tabIndex === 3 && (
        <Grid container spacing={2}>
          {hasDouyin && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2} color="#ff0050">🎵 抖音方法论</Typography>
                  {category.platformMethodology.douyin?.hooks && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary">推荐开头钩子</Typography>
                      {renderArrayChips(category.platformMethodology.douyin.hooks)}
                    </Box>
                  )}
                  {category.platformMethodology.douyin?.structures && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary">内容结构</Typography>
                      {renderArrayChips(category.platformMethodology.douyin.structures)}
                    </Box>
                  )}
                  {category.platformMethodology.douyin?.ctaPatterns && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary">CTA 话术模板</Typography>
                      {renderArrayChips(category.platformMethodology.douyin.ctaPatterns)}
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    建议 {category.platformMethodology.douyin?.optimalDuration || category.platformMethodology.douyin?.minDuration} 秒
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {hasXiaohongshu && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2} color="#ff2442">📕 小红书方法论</Typography>
                  {category.platformMethodology.xiaohongshu?.titles && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary">标题模式</Typography>
                      {renderArrayChips(category.platformMethodology.xiaohongshu.titles)}
                    </Box>
                  )}
                  {category.platformMethodology.xiaohongshu?.keywords && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary">核心关键词</Typography>
                      {renderArrayChips(category.platformMethodology.xiaohongshu.keywords)}
                    </Box>
                  )}
                  {category.platformMethodology.xiaohongshu?.structures && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary">正文结构</Typography>
                      {renderArrayChips(category.platformMethodology.xiaohongshu.structures)}
                    </Box>
                  )}
                  {category.platformMethodology.xiaohongshu?.interactionDesign && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">互动设计</Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>{category.platformMethodology.xiaohongshu.interactionDesign}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
