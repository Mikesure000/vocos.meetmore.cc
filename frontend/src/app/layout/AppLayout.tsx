import { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, matchPath } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Folder as ProjectIcon,
  Settings as SettingsIcon,
  Store as BrandIcon,
  AdminPanelSettings as AdminIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
  Category as CategoryIcon,
  CleaningServices as CleaningIcon,
  Star as StarIcon,
  Link as LinkIcon,
  Replay as ReviewIcon,
  ContentPaste as CardIcon,
  Analytics as AnalyticsIcon,
  Psychology as AttributionIcon,
  Map as MapIcon,
  TrendingUp as StrategyIcon,
  Comment as CommentIcon,
  AdUnits as AdFitIcon,
  VerifiedUser as QaIcon,
  TaskAlt as TaskIcon,
  Group as CollaborateIcon,
} from '@mui/icons-material';
import Topbar from './Topbar';
import { useAuthStore } from '../../shared/stores/authStore';
import { useAnalysisNotifier } from '../../shared/components/AnalysisNotification';
import { QuickActions } from '../../shared/components/QuickActions';
import { BreadcrumbNav } from '../../shared/components/BreadcrumbNav';
import { useConnectionMonitor } from '../../shared/components/ConnectionStatus';

const DRAWER_WIDTH = 260;

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: { label: string; path: string }[];
}

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    '工作空间': true,
    '品类与品牌': true,
    '设置': false,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { NotificationBar } = useAnalysisNotifier();
  const { StatusBar } = useConnectionMonitor();

  // 从 URL 提取当前任务上下文
  const taskContext = useMemo(() => {
    const match = matchPath('/projects/:projectId/tasks/:taskId/*', location.pathname);
    if (match) {
      return { projectId: match.params.projectId!, taskId: match.params.taskId! };
    }
    return null;
  }, [location.pathname]);

  // 动态构建导航组：任务上下文出现时展示分析链路 + 策略生产 + 质检复盘
  const navGroups = useMemo((): NavGroup[] => {
    const base = taskContext ? taskContext : { projectId: ':id', taskId: ':taskId' };
    const groups: NavGroup[] = [
      {
        label: '工作空间',
        items: [
          { label: '工作台', icon: <DashboardIcon />, path: '/workspace' },
          { label: '项目管理', icon: <ProjectIcon />, path: '/projects' },
        ],
      },
    ];

    if (taskContext) {
      groups.push({
        label: '分析链路',
        items: [
          { label: '内容拆解', icon: <AnalyticsIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/content` },
          { label: '评论清洗', icon: <CleaningIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/comments/cleaning` },
          { label: '高价值评论', icon: <StarIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/high-value` },
          { label: '归因分析', icon: <AttributionIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/attribution` },
          { label: '需求地图', icon: <MapIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/demand-map` },
          { label: '障碍地图', icon: <MapIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/barrier-map` },
        ],
      });
      groups.push({
        label: '策略与生产',
        items: [
          { label: '策略卡片', icon: <StrategyIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/strategy` },
          { label: '抖音生产卡', icon: <CardIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/production/douyin` },
          { label: '小红书生产卡', icon: <CardIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/production/xiaohongshu` },
          { label: '评论区运营', icon: <CommentIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/comment-ops` },
          { label: '投流适配', icon: <AdFitIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/ad-fit` },
        ],
      });
      groups.push({
        label: '质检与复盘',
        items: [
          { label: '发布前质检', icon: <QaIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/pre-publish-check` },
          { label: '发布后复盘', icon: <ReviewIcon />, path: `/projects/${base.projectId}/tasks/${base.taskId}/post-review` },
        ],
      });
    }

    groups.push({
      label: '品类与品牌',
      items: [
        { label: '品类知识库', icon: <CategoryIcon />, path: '/category' },
        { label: '品牌管理', icon: <BrandIcon />, path: '/brands' },
      ],
    });

    groups.push({
      label: '设置',
      items: [
        { label: '个人设置', icon: <SettingsIcon />, path: '/settings' },
        { label: '团队设置', icon: <CollaborateIcon />, path: '/settings/team' },
      ],
    });

    return groups;
  }, [taskContext]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // 当进入任务上下文时自动展开分析链路组
  useMemo(() => {
    if (taskContext) {
      setOpenGroups((prev) => ({
        ...prev,
        '分析链路': prev['分析链路'] ?? true,
        '策略与生产': prev['策略与生产'] ?? true,
        '质检与复盘': prev['质检与复盘'] ?? false,
      }));
    }
  }, [taskContext?.projectId, taskContext?.taskId]);

  // 判断当前页是否匹配某导航项
  const isNavActive = (path: string) => {
    if (path === location.pathname) return true;
    if (path !== '/workspace' && path !== '/projects' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          minHeight: 56,
        }}
      >
        <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ cursor: 'pointer' }} onClick={() => navigate('/workspace')}>
          VocosAI
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />

      {/* 任务上下文指示器 */}
      {taskContext && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" display="block">当前分析任务</Typography>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: DRAWER_WIDTH - 32 }}>
            {taskContext.taskId.slice(0, 8)}...
          </Typography>
        </Box>
      )}

      <List sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {navGroups.map((group) => (
          <Box key={group.label}>
            <ListItemButton onClick={() => toggleGroup(group.label)} sx={{ borderRadius: 1, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {group.items[0]?.icon}
              </ListItemIcon>
              <ListItemText primary={group.label} primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
              {openGroups[group.label] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </ListItemButton>
            <Collapse in={openGroups[group.label] ?? true}>
              {group.items.map((item) => (
                <ListItemButton
                  key={item.label + (item.path || '')}
                  selected={!!(item.path && isNavActive(item.path))}
                  onClick={() => {
                    if (item.path) navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{ borderRadius: 1, mb: 0.25, pl: 4 }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 13,
                      fontWeight: item.path && isNavActive(item.path) ? 600 : 400,
                      color: item.path && isNavActive(item.path) ? 'primary.main' : 'text.secondary',
                    }}
                  />
                </ListItemButton>
              ))}
            </Collapse>
          </Box>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar onMenuClick={() => setMobileOpen(!mobileOpen)} isMobile={isMobile} />
        <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          <BreadcrumbNav />
          <Outlet />
        </Box>
      </Box>
      {NotificationBar}
      {StatusBar}
      <QuickActions />
    </Box>
  );
}
