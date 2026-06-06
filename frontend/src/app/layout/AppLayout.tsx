import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Folder as ProjectIcon,
  Assessment as TaskIcon,
  Lightbulb as InsightIcon,
  Map as MapIcon,
  TrendingUp as StrategyIcon,
  Comment as CommentIcon,
  AdUnits as AdFitIcon,
  VerifiedUser as QaIcon,
  Description as ReportIcon,
  Compare as CompareIcon,
  Group as CollaborateIcon,
  Settings as SettingsIcon,
  Store as BrandIcon,
  AdminPanelSettings as AdminIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
  FileDownload as ExportIcon,
  Category as CategoryIcon,
  CleaningServices as CleaningIcon,
  Star as StarIcon,
  Link as LinkIcon,
  Replay as ReviewIcon,
  ContentPaste as CardIcon,
  Analytics as AnalyticsIcon,
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

const navGroups: NavGroup[] = [
  {
    label: '工作空间',
    items: [
      { label: '工作台', icon: <DashboardIcon />, path: '/workspace' },
      { label: '项目管理', icon: <ProjectIcon />, path: '/projects' },
      { label: '发布后复盘', icon: <ReviewIcon />, path: '/post-publish-review' },
    ],
  },
  {
    label: '品类与品牌',
    items: [
      { label: '品类知识库', icon: <CategoryIcon />, path: '/category' },
      { label: '品牌管理', icon: <BrandIcon />, path: '/brands' },
    ],
  },
  {
    label: '设置',
    items: [
      { label: '个人设置', icon: <SettingsIcon />, path: '/settings' },
      { label: '团队设置', icon: <CollaborateIcon />, path: '/settings/team' },
    ],
  },
];

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { NotificationBar } = useAnalysisNotifier();
  const { StatusBar } = useConnectionMonitor();

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
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
                  key={item.path}
                  selected={location.pathname === item.path}
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
                      color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
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
