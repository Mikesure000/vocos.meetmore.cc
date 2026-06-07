import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip, TextField,
  Divider, Switch, FormControlLabel, Alert, CircularProgress,
} from '@mui/material';
import { ArrowBack, Business, Palette, VisibilityOff, Save, AutoAwesome } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { apiClient } from '../../shared/api/client';

const DEFAULT_COLORS = ['#16a34a', '#2563eb', '#dc2626', '#9333ea', '#f59e0b', '#0891b2'];

export default function TeamSettings() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamId, setTeamId] = useState('default');

  const [whiteLabel, setWhiteLabel] = useState({
    companyName: '',
    logo: '',
    primaryColor: '#16a34a',
    hideVocosBrand: false,
  });

  useEffect(() => {
    Promise.all([
      apiClient.get('/api/teams').then(r => { if (r.data[0]) setTeamId(r.data[0].id); }),
      apiClient.get(`/api/teams/default/white-label`).then(r => { if (r.data.companyName) setWhiteLabel(r.data); }).catch(()=>{}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/api/teams/${teamId}/white-label`, whiteLabel);
      enqueueSnackbar('白标配置已保存', { variant: 'success' });
    } catch { enqueueSnackbar('保存失败', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/settings')}>返回</Button>
        <Typography variant="h4" fontWeight={700}>团队设置</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* White Label */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Business color="primary" />
                <Typography variant="h6">白标配置</Typography>
                <Chip label="代运营专享" size="small" color="primary" variant="outlined" />
              </Box>
              <Typography variant="body2" color="text.secondary" mb={3}>
                配置后，导出的报告将使用您的品牌标识，隐藏 VocosAI 品牌。
              </Typography>

              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField fullWidth label="公司名称" value={whiteLabel.companyName}
                    onChange={e => setWhiteLabel({ ...whiteLabel, companyName: e.target.value })}
                    placeholder="默认为 VocosAI"
                    helperText="在报告封面和页脚展示" />
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth label="Logo URL" value={whiteLabel.logo}
                    onChange={e => setWhiteLabel({ ...whiteLabel, logo: e.target.value })}
                    placeholder="https://your-company.com/logo.png"
                    helperText="报告封面展示的 Logo" />
                </Grid>
                <Grid size={12}>
                  <Typography variant="subtitle2" gutterBottom>品牌主色</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                    {DEFAULT_COLORS.map(c => (
                      <Box key={c} onClick={() => setWhiteLabel({ ...whiteLabel, primaryColor: c })}
                        sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: c, cursor: 'pointer',
                          border: whiteLabel.primaryColor === c ? '3px solid white' : '3px solid transparent',
                          outline: whiteLabel.primaryColor === c ? `2px solid ${c}` : 'none',
                          transition: 'all 0.15s',
                        }} />
                    ))}
                  </Box>
                  <TextField size="small" value={whiteLabel.primaryColor} sx={{ width: 120 }}
                    onChange={e => setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value })} />
                </Grid>
                <Grid size={12}>
                  <FormControlLabel
                    control={<Switch checked={whiteLabel.hideVocosBrand}
                      onChange={e => setWhiteLabel({ ...whiteLabel, hideVocosBrand: e.target.checked })} />}
                    label="隐藏 VocosAI 品牌标识"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    开启后报告中将不显示"由 VocosAI 生成"字样
                  </Typography>
                </Grid>
              </Grid>

              <Box mt={3}>
                <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '保存白标配置'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>报告预览</Typography>
              <Box sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                {/* Logo */}
                {whiteLabel.logo ? (
                  <Box component="img" src={whiteLabel.logo} alt="logo" sx={{ maxHeight: 40, mb: 1 }} />
                ) : (
                  <Typography variant="h6" color="text.disabled" mb={1}>[ Logo ]</Typography>
                )}
                {/* Title */}
                <Typography variant="h5" fontWeight={700} color={whiteLabel.primaryColor} mb={0.5}>
                  分析报告
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {whiteLabel.companyName || 'VocosAI'}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">内容拆解 · 评论洞察 · 策略卡 · 生产卡</Typography>
                <Typography variant="caption" color="text.disabled" display="block" mt={1}>
                  {whiteLabel.hideVocosBrand ? '— 纯白标报告 —' : '由 VocosAI 生成'}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mt: 2 }}>
            导出报告（Markdown/PDF/Word/Excel/HTML/PPT）将自动应用白标配置。
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}
