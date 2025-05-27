import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  IconButton,
  Switch,
  Chip,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Dashboard,
  AccountBalance,
  BarChart,
  Settings,
  School,
  PowerSettingsNew,
  Psychology,
  ChevronLeft,
  Menu as MenuIcon,
  ShowChart
} from '@mui/icons-material';
import { useTradingContext } from '../../contexts/TradingContext';
import { TAB_INDEX } from '../../constants';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: number;
  onTabChange: (tab: number) => void;
}

const DRAWER_WIDTH = 280;

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeTab,
  onTabChange
}) => {
  const theme = useTheme();
  const { tradingState, tradingConfig, toggleTrading } = useTradingContext();
  const [drawerOpen, setDrawerOpen] = useState(true);

  const menuItems = [
    { text: '대시보드', icon: <Dashboard />, value: TAB_INDEX.OVERVIEW },
    { text: '포트폴리오', icon: <AccountBalance />, value: TAB_INDEX.PORTFOLIO },
    { text: '분석 설정', icon: <BarChart />, value: TAB_INDEX.ANALYSIS },
    { text: '거래 설정', icon: <Settings />, value: TAB_INDEX.SETTINGS },
    { text: '학습 상태', icon: <School />, value: TAB_INDEX.LEARNING },
    { text: '백테스트', icon: <ShowChart />, value: TAB_INDEX.BACKTEST },
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : theme.spacing(9),
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? DRAWER_WIDTH : theme.spacing(9),
            boxSizing: 'border-box',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {drawerOpen && (
            <Typography variant="h6" fontWeight="bold">
              Upbit AI Trading
            </Typography>
          )}
          <IconButton onClick={handleDrawerToggle} size="small">
            {drawerOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>
        </Box>
        
        <Divider />
        
        {/* Trading Control */}
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: drawerOpen ? 2 : 0,
              justifyContent: drawerOpen ? 'space-between' : 'center',
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: tradingState.isRunning ? alpha(theme.palette.success.main, 0.1) : 'grey.100',
              border: 1,
              borderColor: tradingState.isRunning ? 'success.main' : 'grey.300'
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: tradingState.isRunning ? 'success.main' : 'grey.500'
                }}
              >
                <PowerSettingsNew sx={{ fontSize: 20 }} />
              </Avatar>
              {drawerOpen && (
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    자동매매
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tradingState.isRunning ? '실행중' : '중지됨'}
                  </Typography>
                </Box>
              )}
            </Box>
            {drawerOpen && (
              <Switch
                checked={tradingState.isRunning}
                onChange={toggleTrading}
                color="success"
              />
            )}
          </Box>

          {/* AI Status */}
          {drawerOpen && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: tradingConfig.useAI ? alpha(theme.palette.primary.main, 0.1) : 'grey.100'
              }}
            >
              <Psychology color={tradingConfig.useAI ? "primary" : "disabled"} />
              <Box flex={1}>
                <Typography variant="body2" fontWeight="medium">
                  AI 분석
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tradingConfig.useAI ? '활성' : '비활성'}
                </Typography>
              </Box>
              <Chip
                label={tradingConfig.useAI ? 'ON' : 'OFF'}
                size="small"
                color={tradingConfig.useAI ? 'primary' : 'default'}
              />
            </Box>
          )}
        </Box>

        <Divider />

        {/* Navigation Menu */}
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.value} disablePadding>
              <ListItemButton
                selected={activeTab === item.value}
                onClick={() => onTabChange(item.value)}
                sx={{
                  minHeight: 48,
                  justifyContent: drawerOpen ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: drawerOpen ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {drawerOpen && <ListItemText primary={item.text} />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'grey.50',
          p: 3,
          overflow: 'auto',
          height: '100vh'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};