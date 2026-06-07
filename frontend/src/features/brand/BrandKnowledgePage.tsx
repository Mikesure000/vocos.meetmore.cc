import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip,
  TextField, CircularProgress, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { ArrowBack, Add, Save, Delete, Edit } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';
import { useSnackbar } from 'notistack';

export default function BrandKnowledgePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productDialog, setProductDialog] = useState(false);
  const [prodForm, setProdForm] = useState({ name: '', category: '', priceRange: '', description: '' });

  const load = () => {
    apiClient.get(`/api/brands/${id}`).then(r => setBrand(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/api/brands/${id}`, brand);
      enqueueSnackbar('已保存', { variant: 'success' });
    } catch { enqueueSnackbar('保存失败', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleAddProduct = async () => {
    try {
      await apiClient.post(`/api/brands/${id}/products`, prodForm);
      setProductDialog(false);
      setProdForm({ name: '', category: '', priceRange: '', description: '' });
      load();
      enqueueSnackbar('产品已添加', { variant: 'success' });
    } catch { enqueueSnackbar('添加失败', { variant: 'error' }); }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!brand) return <Typography>品牌不存在</Typography>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/brands')}>返回</Button>
        <Typography variant="h4" fontWeight={700}>品牌知识库</Typography>
        {brand.industry && <Chip label={brand.industry} size="small" variant="outlined" />}
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>品牌信息</Typography>
              <Grid container spacing={2}>
                <Grid size={6}><TextField fullWidth label="品牌名称" value={brand.name || ''} onChange={e => setBrand({ ...brand, name: e.target.value })} size="small" /></Grid>
                <Grid size={6}><TextField fullWidth label="行业" value={brand.industry || ''} onChange={e => setBrand({ ...brand, industry: e.target.value })} size="small" /></Grid>
                <Grid size={12}><TextField fullWidth label="品牌定位" value={brand.positioning || ''} onChange={e => setBrand({ ...brand, positioning: e.target.value })} size="small" multiline rows={2} /></Grid>
                <Grid size={12}><TextField fullWidth label="品牌调性" value={brand.tone || ''} onChange={e => setBrand({ ...brand, tone: e.target.value })} size="small" multiline rows={2} /></Grid>
              </Grid>
              <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving} sx={{ mt: 2 }}>
                {saving ? '保存中...' : '保存品牌信息'}
              </Button>
            </CardContent>
          </Card>

          {/* 产品列表 */}
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">产品列表</Typography>
                <Button size="small" startIcon={<Add />} onClick={() => setProductDialog(true)}>添加产品</Button>
              </Box>
              {(brand.products || []).length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={2}>暂无产品</Typography>
              ) : (
                <List dense>
                  {(brand.products || []).map((p: any) => (
                    <ListItem key={p.id} divider>
                      <ListItemText primary={p.name} secondary={p.category ? `${p.category} · ${p.priceRange || '-'}` : p.description || ''} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 核心卖点 + 禁用表达 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>核心卖点</Typography>
              <TextField fullWidth size="small" multiline rows={4} placeholder="一行一个卖点"
                value={brand.sellingPoints ? JSON.parse(brand.sellingPoints).join('\n') : ''}
                onChange={e => setBrand({ ...brand, sellingPoints: JSON.stringify(e.target.value.split('\n').filter(Boolean)) })} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error.main">禁用表达</Typography>
              <TextField fullWidth size="small" multiline rows={4} placeholder="一行一条禁用规则"
                value={brand.taboos ? JSON.parse(brand.taboos).join('\n') : ''}
                onChange={e => setBrand({ ...brand, taboos: JSON.stringify(e.target.value.split('\n').filter(Boolean)) })} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Product Dialog */}
      <Dialog open={productDialog} onClose={() => setProductDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加产品</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="产品名称" value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} margin="normal" required />
          <TextField fullWidth label="品类" value={prodForm.category} onChange={e => setProdForm({ ...prodForm, category: e.target.value })} margin="normal" />
          <TextField fullWidth label="价格区间" value={prodForm.priceRange} onChange={e => setProdForm({ ...prodForm, priceRange: e.target.value })} margin="normal" placeholder="99-199元" />
          <TextField fullWidth label="描述" value={prodForm.description} onChange={e => setProdForm({ ...prodForm, description: e.target.value })} margin="normal" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialog(false)}>取消</Button>
          <Button variant="contained" onClick={handleAddProduct} disabled={!prodForm.name}>添加</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
