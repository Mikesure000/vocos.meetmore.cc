import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, CircularProgress, Table, TableBody, TableCell, TableRow, TableHead, IconButton } from '@mui/material';
import { Add, ArrowBack, PlayArrow } from '@mui/icons-material';
import { apiClient } from '../../shared/api/client';
import type { Project } from '../../shared/types/project';
import type { AnalysisTask } from '../../shared/types/task';
import { TASK_STATUS_MAP } from '../../shared/constants/platforms';
import { TaskStatusBadge } from '../../shared/components/TaskStatusBadge';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<AnalysisTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/api/projects/${id}`).then((r) => setProject(r.data)),
      apiClient.get(`/api/tasks?projectId=${id}`).then((r) => setTasks(r.data)),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!project) return <Typography>项目不存在</Typography>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <IconButton onClick={() => navigate('/projects')}><ArrowBack /></IconButton>
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography variant="h4" fontWeight={700}>
              {project.category?.icon && <Box component="span" mr={0.5}>{project.category.icon}</Box>}
              {project.projectName}
            </Typography>
            {project.category && (
              <Chip
                label={project.category.name}
                size="small"
                color="primary"
                variant="filled"
                onClick={() => navigate(`/category/${project.category!.id}/knowledge`)}
                sx={{ cursor: 'pointer' }}
              />
            )}
          </Box>
          {project.brandName && <Typography variant="body2" color="text.secondary">{project.brandName} · {project.industry}</Typography>}
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate(`/projects/${id}/tasks/new`)}>
          创建分析任务
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>分析任务</Typography>
          {tasks.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">暂无分析任务</Typography>
              <Button sx={{ mt: 1 }} onClick={() => navigate(`/projects/${id}/tasks/new`)}>创建第一个任务</Button>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>任务名称</TableCell>
                  <TableCell>平台</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.taskName}</TableCell>
                    <TableCell>{task.platform === 'douyin' ? '抖音' : '小红书'}</TableCell>
                    <TableCell>
                      <TaskStatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>{new Date(task.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {task.status === 'ready' && (
                        <IconButton size="small" color="primary" onClick={() => navigate(`/projects/${id}/tasks/${task.id}/progress`)}>
                          <PlayArrow />
                        </IconButton>
                      )}
                      {task.status === 'completed' && (
                        <Button size="small" onClick={() => navigate(`/projects/${id}/tasks/${task.id}/insights`)}>
                          查看结果
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
