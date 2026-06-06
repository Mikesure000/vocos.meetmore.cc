import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, ToggleButtonGroup, ToggleButton, Paper,
} from '@mui/material';
import { Add, Folder } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';
import type { Project, CategoryInfo } from '../../shared/types/project';

const CATEGORY_OPTIONS = [
  { id: 'cat-beauty', name: '美妆护肤', icon: '💄', slug: 'beauty', desc: '肤质/成分/功效/平替' },
  { id: 'cat-maternal', name: '母婴健康', icon: '👶', slug: 'maternal', desc: '适龄/安全/成分/案例' },
  { id: 'cat-functional-food', name: '功效食品', icon: '🍵', slug: 'functional-food', desc: '功效/周期/安全/合规' },
];

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    projectName: '', brandName: '', productName: '', industry: '', description: '',
    categoryId: '',
  });

  useEffect(() => {
    apiClient.get('/api/projects').then((res) => setProjects(res.data)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    try {
      const res = await apiClient.post('/api/projects', { ...form, teamId: 'default' });
      setProjects((prev) => [res.data, ...prev]);
      setDialogOpen(false);
      setForm({ projectName: '', brandName: '', productName: '', industry: '', description: '', categoryId: '' });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>项目管理</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          创建项目
        </Button>
      </Box>

      <Grid container spacing={3}>
        {projects.length === 0 && (
          <Grid size={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Folder sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">暂无项目</Typography>
                <Typography variant="body2" color="text.disabled" mb={2}>选择品类创建你的第一个项目</Typography>
                <Button variant="outlined" onClick={() => setDialogOpen(true)}>创建项目</Button>
              </CardContent>
            </Card>
          </Grid>
        )}
        {projects.map((p) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
            <Card
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="h6">
                      {p.category?.icon && <Box component="span" mr={0.5}>{p.category.icon}</Box>}
                      {p.projectName}
                    </Typography>
                    {p.brandName && <Typography variant="body2" color="text.secondary">{p.brandName}</Typography>}
                  </Box>
                  <Chip label={p.status === 'active' ? '活跃' : '已归档'} size="small" color={p.status === 'active' ? 'success' : 'default'} />
                </Box>
                <Box mt={1} display="flex" gap={0.5} flexWrap="wrap">
                  {p.category && <Chip label={p.category.name} size="small" color="primary" variant="outlined" />}
                  {p.industry && <Chip label={p.industry} size="small" variant="outlined" />}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>创建项目</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
            选择品类（必选）
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {CATEGORY_OPTIONS.map((cat) => (
              <Paper
                key={cat.id}
                variant="outlined"
                onClick={() => setForm({ ...form, categoryId: cat.id })}
                sx={{
                  flex: 1,
                  p: 1.5,
                  cursor: 'pointer',
                  textAlign: 'center',
                  borderColor: form.categoryId === cat.id ? 'primary.main' : 'divider',
                  borderWidth: form.categoryId === cat.id ? 2 : 1,
                  bgcolor: form.categoryId === cat.id ? 'action.selected' : 'background.paper',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: 'primary.light' },
                }}
              >
                <Typography variant="h5" component="div">{cat.icon}</Typography>
                <Typography variant="body2" fontWeight={600}>{cat.name}</Typography>
                <Typography variant="caption" color="text.secondary">{cat.desc}</Typography>
              </Paper>
            ))}
          </Box>
          <TextField fullWidth label="项目名称" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} margin="normal" required />
          <TextField fullWidth label="品牌名称" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} margin="normal" />
          <TextField fullWidth label="产品名称" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} margin="normal" />
          <TextField fullWidth label="行业" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} margin="normal" />
          <TextField fullWidth label="描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} margin="normal" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.projectName || !form.categoryId}>创建</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
