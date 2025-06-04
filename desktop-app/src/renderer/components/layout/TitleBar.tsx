import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha
} from '@mui/material';
import {
  Minimize,
  CropSquare,
  Close,
  FilterNone,
  Menu as MenuIcon,
  ShowChart,
  Settings,
  Info,
  GitHub,
  BugReport,
  Update
} from '@mui/icons-material';
import { useElectronAPI } from '../../hooks/useElectronAPI';

interface TitleBarProps {
  title?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ title = 'Upbit AI Trading' }) => {
  const theme = useTheme();
  const electronAPI = useElectronAPI();
  const [isMaximized, setIsMaximized] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    // 초기 상태 확인
    electronAPI.isMaximized().then(setIsMaximized);

    // 최대화 상태 변경 리스너
    electronAPI.onMaximizeChange((maximized) => {
      setIsMaximized(maximized);
    });
  }, [electronAPI]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMinimize = () => {
    electronAPI.minimizeWindow();
  };

  const handleMaximize = () => {
    electronAPI.maximizeWindow();
  };

  const handleClose = () => {
    electronAPI.closeWindow();
  };

  const handleMenuItemClick = (action: string) => {
    handleMenuClose();
    
    switch (action) {
      case 'settings':
        // 설정 화면으로 이동
        console.log('Open settings');
        break;
      case 'about':
        // 정보 표시
        console.log('Show about');
        break;
      case 'checkUpdate':
        // 업데이트 확인
        console.log('Check for updates');
        break;
      case 'reportBug':
        // 버그 리포트
        window.open('https://github.com/your-username/upbit-ai-trading/issues', '_blank');
        break;
      case 'github':
        // GitHub 저장소 열기
        window.open('https://github.com/your-username/upbit-ai-trading', '_blank');
        break;
    }
  };

  return (
    <Box
      sx={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.9)
          : theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        WebkitAppRegion: 'drag', // 드래그 가능 영역
        userSelect: 'none',
        position: 'relative',
        zIndex: 1400 // Drawer보다 위에 표시
      }}
    >
      {/* 왼쪽: 메뉴 버튼과 타이틀 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        px: 1,
        height: '100%'
      }}>
        {/* 메뉴 버튼 */}
        <IconButton
          size="small"
          onClick={handleMenuClick}
          sx={{
            WebkitAppRegion: 'no-drag',
            width: 32,
            height: 28,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        {/* 아이콘 - ShowChart 아이콘 사용 */}
        <ShowChart 
          sx={{ 
            width: 20, 
            height: 20,
            color: theme.palette.primary.main
          }} 
        />

        {/* 타이틀 */}
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 500,
            color: theme.palette.text.primary
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 200,
            mt: 0.5
          }
        }}
      >
        <MenuItem onClick={() => handleMenuItemClick('settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>설정</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleMenuItemClick('checkUpdate')}>
          <ListItemIcon>
            <Update fontSize="small" />
          </ListItemIcon>
          <ListItemText>업데이트 확인</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuItemClick('about')}>
          <ListItemIcon>
            <Info fontSize="small" />
          </ListItemIcon>
          <ListItemText>정보</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleMenuItemClick('reportBug')}>
          <ListItemIcon>
            <BugReport fontSize="small" />
          </ListItemIcon>
          <ListItemText>버그 신고</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuItemClick('github')}>
          <ListItemIcon>
            <GitHub fontSize="small" />
          </ListItemIcon>
          <ListItemText>GitHub</ListItemText>
        </MenuItem>
      </Menu>

      {/* 창 컨트롤 버튼 */}
      <Box 
        sx={{ 
          display: 'flex',
          WebkitAppRegion: 'no-drag' // 버튼은 드래그 불가
        }}
      >
        <IconButton
          size="small"
          onClick={handleMinimize}
          sx={{
            borderRadius: 0,
            width: 46,
            height: 32,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          <Minimize fontSize="small" />
        </IconButton>
        
        <IconButton
          size="small"
          onClick={handleMaximize}
          sx={{
            borderRadius: 0,
            width: 46,
            height: 32,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          {isMaximized ? <FilterNone fontSize="small" /> : <CropSquare fontSize="small" />}
        </IconButton>
        
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            borderRadius: 0,
            width: 46,
            height: 32,
            '&:hover': {
              backgroundColor: theme.palette.error.main,
              color: 'white'
            }
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};