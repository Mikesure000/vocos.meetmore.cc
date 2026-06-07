import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, TextField,
  MenuItem, FormControl, InputLabel, Select, Chip, Alert, LinearProgress,
  List, ListItem, ListItemIcon, ListItemText, CircularProgress,
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, Warning, AutoAwesome } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { apiClient } from '../../shared/api/client';

export default function PrePublishCheckPage() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [draft, setDraft] = useState('');
  const [platform, setPlatform] = useState('douyin');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 加载已有质检结果
  useEffect(() => {
    apiClient.get(`/api/tasks/${taskId}/pre-publish-check`)
      .then(r => { if (r.data._source === 'db') setCheckResult(r.data); })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, [taskId]);

  const handleCheck = async () => {
    if (!draft.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post(`/api/tasks/${taskId}/pre-publish-check`, { scriptContent: draft, platform });
      setCheckResult(res.data);
      enqueueSnackbar('质检完成', { variant: 'success' });
    } catch { enqueueSnackbar('质检失败', { variant: 'error' }); }
    finally { setLoading(false); }
  };

  if (initialLoading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  const items = checkResult?.items || [];
  const passedCount = items.filter((c: any) => c.passed).length;
  const totalCount = items.length;
  const score = checkResult?.totalScore || (totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0);
  const scoreColor = score >= 80 ? 'success.main' : score >= 60 ? 'warning.main' : 'error.main';
  const isMock = checkResult?._source === 'mock';

  const severityIcon = (s: string) => {
    if (s === 'pass') return <CheckCircle color="success" fontSize="small" />;
    if (s === 'must_fix') return <Cancel color="error" fontSize="small" />;
    return <Warning color="warning" fontSize="small" />;
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/insights`)}>返回</Button>
        <Typography variant="h4" fontWeight={700}>发布前质检</Typography>
        {checkResult && <Chip label={isMock ? '示例数据' : 'AI 分析'} size="small" color={isMock ? 'warning' : 'success'} variant="outlined" />}
      </Box>

      {isMock && <Alert severity="warning" sx={{ mb: 2 }}>当前展示示例数据。输入脚本内容后点击质检将生成真实评估。</Alert>}

      <Grid container spacing={3}>
        {/* 提交草稿 */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>脚本/笔记草稿</Typography>
              <Grid container spacing={2} mb={2}>
                <Grid size={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>平台</InputLabel>
                    <Select value={platform} label="平台" onChange={(e) => setPlatform(e.target.value)}>
                      <MenuItem value="douyin">抖音</MenuItem>
                      <MenuItem value="xiaohongshu">小红书</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <TextField
                fullWidth multiline rows={6} label="粘贴脚本内容"
                value={draft} onChange={(e) => setDraft(e.target.value)}
                placeholder={platform === 'douyin' ? '粘贴口播脚本...' : '粘贴笔记正文...'}
              />
              <Button variant="contained" startIcon={<AutoAwesome />} onClick={handleCheck} disabled={loading || !draft.trim()} sx={{ mt: 2 }}>
                {loading ? '质检中...' : 'AI 发布前质检'}
              </Button>
            </CardContent>
          </Card>

          {/* 修改建议（仅 must_fix 项） */}
          {checkResult && items.filter((i: any) => i.severity === 'must_fix').length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error.main">必改项</Typography>
                {items.filter((i: any) => i.severity === 'must_fix').map((item: any, i: number) => (
                  <Alert key={i} severity="error" sx={{ mb: 1 }}>{item.comment}</Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* 质检结果 */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              {!checkResult ? (
                <Box textAlign="center" py={4}>
                  <AutoAwesome sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">粘贴脚本后点击质检查看结果</Typography>
                </Box>
              ) : (
                <>
                  <Box textAlign="center" mb={2}>
                    <Typography variant="h2" fontWeight={700} color={scoreColor}>{score}<Typography component="span" variant="h5" color="text.secondary">/100</Typography></Typography>
                    <Chip label={checkResult.conclusion || (score >= 80 ? '可以发布' : score >= 60 ? '建议修改后发布' : '不建议发布')} color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>{passedCount}/{totalCount} 项通过</Typography>
                  <LinearProgress variant="determinate" value={(passedCount/totalCount)*100} sx={{ height: 6, borderRadius: 3, mb: 2 }} />

                  <List dense disablePadding>
                    {items.map((item: any, i: number) => (
                      <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>{severityIcon(item.severity || (item.passed ? 'pass' : 'must_fix'))}</ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          secondary={item.comment}
                          primaryTypographyProps={{ variant: 'body2', color: item.passed ? 'text.primary' : 'error.main' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
