import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, TextField, MenuItem,
  FormControl, InputLabel, Select, Grid, CircularProgress,
  FormGroup, FormControlLabel, Checkbox, Alert,
} from '@mui/material';
import { ArrowBack, Category as CategoryIcon } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';
import { PLATFORMS, CONTENT_GOALS, OUTPUT_OPTIONS } from '../../shared/constants/platforms';
import type { Project } from '../../shared/types/project';

export default function TaskCreatePage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    apiClient.get(`/api/projects/${projectId}`).then((r) => setProject(r.data)).catch(() => {});
  }, [projectId]);

  const [form, setForm] = useState({
    taskName: '',
    platform: 'douyin',
    contentUrl: '',
    contentTitle: '',
    contentBody: '',
    contentGoal: '',
    brandName: '',
    productName: '',
    productSellingPoints: '',
    competitorInfo: '',
    outputOptions: OUTPUT_OPTIONS.map((o) => o.value),
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/api/tasks', {
        projectId,
        taskName: form.taskName || form.contentTitle || '未命名任务',
        platform: form.platform,
        contentUrl: form.contentUrl,
        contentTitle: form.contentTitle,
        contentBody: form.contentBody,
        contentGoal: form.contentGoal,
        brandInfo: JSON.stringify({ brandName: form.brandName, productName: form.productName, sellingPoints: form.productSellingPoints }),
        competitorInfo: form.competitorInfo,
        outputOptions: form.outputOptions,
      });
      navigate(`/projects/${projectId}/tasks/${res.data.id}/mapping`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${projectId}`)}>返回</Button>
        <Typography variant="h4" fontWeight={700}>创建分析任务</Typography>
      </Box>

      {project?.category && (
        <Alert severity="info" icon={<CategoryIcon />} sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            当前项目品类：{project.category.icon} {project.category.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            系统将自动应用该品类的知识库、合规规则和平台方法论进行分析
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>基本信息</Typography>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField fullWidth label="任务名称" value={form.taskName} onChange={(e) => setForm({ ...form, taskName: e.target.value })} placeholder="默认为内容标题" />
                </Grid>
                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel>平台类型</InputLabel>
                    <Select value={form.platform} label="平台类型" onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                      {PLATFORMS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel>内容目标</InputLabel>
                    <Select value={form.contentGoal} label="内容目标" onChange={(e) => setForm({ ...form, contentGoal: e.target.value })}>
                      {CONTENT_GOALS.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <TextField fullWidth label="内容链接" value={form.contentUrl} onChange={(e) => setForm({ ...form, contentUrl: e.target.value })} placeholder="抖音/小红书内容链接" />
                </Grid>
                <Grid size={12}>
                  <TextField fullWidth label="内容标题" value={form.contentTitle} onChange={(e) => setForm({ ...form, contentTitle: e.target.value })} required />
                </Grid>
                <Grid size={12}>
                  <TextField fullWidth label="内容正文/视频文案" value={form.contentBody} onChange={(e) => setForm({ ...form, contentBody: e.target.value })} multiline rows={4} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>品牌与产品信息</Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField fullWidth label="品牌名称" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} />
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth label="产品名称" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
                </Grid>
                <Grid size={12}>
                  <TextField fullWidth label="产品卖点" value={form.productSellingPoints} onChange={(e) => setForm({ ...form, productSellingPoints: e.target.value })} multiline rows={2} />
                </Grid>
                <Grid size={12}>
                  <TextField fullWidth label="竞品信息" value={form.competitorInfo} onChange={(e) => setForm({ ...form, competitorInfo: e.target.value })} multiline rows={2} placeholder="竞品名称、竞品卖点等" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>输出需求</Typography>
              <FormGroup>
                {OUTPUT_OPTIONS.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    control={
                      <Checkbox
                        checked={form.outputOptions.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, outputOptions: [...form.outputOptions, opt.value] });
                          } else {
                            setForm({ ...form, outputOptions: form.outputOptions.filter((v) => v !== opt.value) });
                          }
                        }}
                      />
                    }
                    label={opt.label}
                  />
                ))}
              </FormGroup>
              <Button fullWidth variant="contained" size="large" onClick={handleSubmit} disabled={loading || !form.contentTitle} sx={{ mt: 2 }}>
                {loading ? '创建中...' : '下一步：上传评论文件'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
