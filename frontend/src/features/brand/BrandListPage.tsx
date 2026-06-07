import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress,
} from '@mui/material';
import { Add, Store } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';
import { useSnackbar } from 'notistack';

export default function BrandListPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '' });

  useEffect(() => {
    apiClient.get('/api/brands').then(r => setBrands(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      const res = await apiClient.post('/api/brands', { ...form, teamId: 'default' });
      setBrands([res.data, ...brands]);
      setDialogOpen(false);
      setForm({ name: '', industry: '' });
      enqueueSnackbar('品牌已创建', { variant: 'success' });
    } catch { enqueueSnackbar('创建失败', { variant: 'error' }); }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight={700}>品牌管理</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>添加品牌</Button>
      </Box>

      <Grid container spacing={3}>
        {brands.length === 0 && (
          <Grid size={12}><Card><CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Store sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">暂无品牌</Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setDialogOpen(true)}>添加第一个品牌</Button>
          </CardContent></Card></Grid>
        )}
        {brands.map((b) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={b.id}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate(`/brands/${b.id}/knowledge`)}>
              <CardContent>
                <Typography variant="h6">{b.name}</Typography>
                {b.industry && <Chip label={b.industry} size="small" sx={{ mt: 0.5 }} />}
                <Box mt={1} display="flex" gap={1}>
                  {b.positioning && <Typography variant="caption" color="text.secondary">{b.positioning}</Typography>}
                </Box>
                <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                  {b._count?.products || 0} 个产品
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加品牌</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="品牌名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} margin="normal" required />
          <TextField fullWidth label="行业" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name}>创建</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
