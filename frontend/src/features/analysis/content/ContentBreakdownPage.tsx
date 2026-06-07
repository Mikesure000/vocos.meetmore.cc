import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip,
  CircularProgress, LinearProgress, Table, TableBody, TableCell, TableRow,
  List, ListItem, ListItemIcon, ListItemText, Alert,
} from '@mui/material';
import { ArrowBack, Check, Close, Warning, Star, StarBorder } from '@mui/icons-material';
import { apiClient } from '../../../shared/api/client';

export default function ContentBreakdownPage() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/api/tasks/${taskId}/content-analysis`).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!data) return <Typography>暂无数据</Typography>;

  const isMock = data._source === 'mock';

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/insights`)}>返回</Button>
        <Typography variant="h4" fontWeight={700}>内容拆解</Typography>
        <Chip label={data.taskInfo?.platform === 'douyin' ? '抖音' : '小红书'} size="small" variant="outlined" />
        <Chip
          label={isMock ? '示例数据' : 'AI 分析'}
          size="small"
          color={isMock ? 'warning' : 'success'}
          variant="outlined"
        />
      </Box>

      {isMock && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          当前展示的是示例数据。启动分析任务后，AI Pipeline 将基于真实内容生成拆解分析。
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 标题结构 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>标题结构</Typography>
              <Box mb={1}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">综合评分</Typography>
                  <Typography fontWeight={600}>{data.titleStructure.score}/100</Typography>
                </Box>
                <LinearProgress variant="determinate" value={data.titleStructure.score} sx={{ height: 8, borderRadius: 4 }}
                  color={data.titleStructure.score >= 70 ? 'success' : 'warning'} />
              </Box>
              <Table size="small">
                <TableBody>
                  {['hasPainPoint','hasKeyword','hasBenefit','hasConflict'].map((k) => (
                    <TableRow key={k}>
                      <TableCell>{k==='hasPainPoint'?'痛点':k==='hasKeyword'?'关键词':k==='hasBenefit'?'利益点':k==='hasConflict'?'冲突感':k}</TableCell>
                      <TableCell>{data.titleStructure[k] ? <Check color="success" fontSize="small" /> : <Close color="error" fontSize="small" />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.titleStructure.suggestion && (
                <Alert severity="info" sx={{ mt: 1, py: 0 }}>{data.titleStructure.suggestion}</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 内容主题与钩子 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>内容主题</Typography>
              <Chip label={data.contentTheme} color="primary" />
              {data.hook && (
                <Box mt={1}>
                  <Typography variant="body2" color="text.secondary">开头钩子: {data.hook.type}（{data.hook.effectiveness}）</Typography>
                  <Typography variant="caption" color="text.disabled">{data.hook.comment}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>平台适配</Typography>
              <Table size="small">
                <TableBody>
                  <TableRow><TableCell>抖音</TableCell><TableCell>{data.platformFit?.douyin?.score}/100</TableCell><TableCell>{data.platformFit?.douyin?.issues?.join('、')}</TableCell></TableRow>
                  <TableRow><TableCell>小红书</TableCell><TableCell>{data.platformFit?.xiaohongshu?.score}/100</TableCell><TableCell>{data.platformFit?.xiaohongshu?.issues?.join('、')}</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* 内容结构 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>内容结构</Typography>
              {data.structure?.map((s: any) => (
                <Box key={s.order} display="flex" alignItems="center" gap={1} py={1} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Chip label={s.order} size="small" />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.content}</Typography>
                  </Box>
                  <Chip label={s.effectiveness === 'good' ? '好' : s.effectiveness === 'medium' ? '中' : '弱'}
                    size="small" color={s.effectiveness === 'good' ? 'success' : s.effectiveness === 'medium' ? 'warning' : 'error'} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* 卖点表达 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>卖点表达</Typography>
              {data.sellingPoints?.map((sp: any, i: number) => (
                <Box key={i} mb={1} p={1} bgcolor="action.hover" borderRadius={1}>
                  <Typography variant="body2" fontWeight={600}>{sp.point}</Typography>
                  <Typography variant="caption" color="text.secondary">清晰度: {sp.clarity} | 证据: {sp.evidence}</Typography>
                  <Typography variant="caption" display="block" color="text.disabled">{sp.comment}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>证明机制</Typography>
              {data.proofMechanism?.map((pm: any, i: number) => (
                <Box key={i} display="flex" alignItems="center" gap={1} mb={0.5}>
                  {pm.present ? <Check color="success" fontSize="small" /> : <Close color="error" fontSize="small" />}
                  <Typography variant="body2">{pm.type}</Typography>
                  <Chip label={pm.quality} size="small" variant="outlined" />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* CTA + 触发点 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>CTA 与触发点</Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">CTA类型: {data.cta?.type}</Typography>
                <Chip label={data.cta?.effectiveness} size="small" color={data.cta?.effectiveness === 'good' ? 'success' : 'warning'} />
                <Typography variant="caption" display="block" color="text.disabled">{data.cta?.comment}</Typography>
              </Box>
              <Typography variant="subtitle2" gutterBottom>潜在触发评论点</Typography>
              {data.triggerPoints?.map((tp: any, i: number) => (
                <Chip key={i} label={`${tp.expression} → ${tp.expectedReaction} (${tp.intensity})`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* 问题 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error.main">内容问题</Typography>
              {data.problems?.map((p: any, i: number) => (
                <Alert key={i} severity={p.severity === 'high' ? 'error' : p.severity === 'medium' ? 'warning' : 'info'} sx={{ mb: 1, py: 0 }}>
                  <Typography variant="body2" fontWeight={600}>{p.problem}</Typography>
                  <Typography variant="caption">{p.suggestion}</Typography>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
