import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, CardActions, Button, Chip,
  Grid, CircularProgress, Alert, Paper,
} from '@mui/material';
import { AutoAwesome, ArrowForward } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
}

export default function CategoryListPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/api/categories')
      .then((res) => { setCategories(res.data || []); setLoading(false); })
      .catch((err) => { setError('加载品类失败: ' + (err.response?.data?.error || err.message)); setLoading(false); });
  }, []);

  const categoryColors: Record<string, string> = {
    beauty: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #fbcfe8 100%)',
    maternal: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #cffafe 100%)',
    'functional-food': 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #d1fae5 100%)',
  };

  const categoryKeywords: Record<string, string[]> = {
    beauty: ['肤质分析', '成分拆解', '平替对比', '功效评估', '敏感肌适配'],
    maternal: ['安全评估', '适龄推荐', '成分审核', '真实案例', '合规检测'],
    'functional-food': ['功效边界', '周期验证', '成分含量', '合规审查', '价值拆解'],
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        品类知识库
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        vocosai 专注美妆护肤、母婴健康、功效食品三大高决策品类，为每个品类沉淀专业知识与平台方法论。
      </Typography>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {categories.map((cat) => (
          <Grid item xs={12} md={4} key={cat.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s',
                '&:hover': { borderColor: 'primary.main', transform: 'translateY(-4px)', boxShadow: 8 },
              }}
            >
              <Box
                sx={{
                  height: 8,
                  background: categoryColors[cat.slug] || categoryColors.beauty,
                }}
              />
              <CardContent sx={{ flex: 1, pt: 3 }}>
                <Typography variant="h3" sx={{ mb: 1 }}>{cat.icon}</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                  {cat.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {cat.description}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(categoryKeywords[cat.slug] || []).map((kw) => (
                    <Chip
                      key={kw}
                      label={kw}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 1, fontSize: 11, opacity: 0.8 }}
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  endIcon={<ArrowForward />}
                  startIcon={<AutoAwesome />}
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(`/category/${cat.id}/knowledge`)}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  查看品类知识
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
