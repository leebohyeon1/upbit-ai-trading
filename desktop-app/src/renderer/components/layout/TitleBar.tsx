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
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Minimize,
  CropSquare,
  Close,
  FilterNone,
  Menu as MenuIcon,
  Settings,
  Info,
  BugReport,
  Update
} from '@mui/icons-material';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import { TAB_INDEX } from '../../constants';
import iconImage from '../../../main/icon.png';

interface TitleBarProps {
  title?: string;
  onTabChange?: (tab: number) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ title = 'Upbit AI Trading', onTabChange }) => {
  const theme = useTheme();
  const electronAPI = useElectronAPI();
  const [isMaximized, setIsMaximized] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('Loading...');
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    // 초기 상태 확인
    electronAPI.isMaximized().then(setIsMaximized);

    // 최대화 상태 변경 리스너
    electronAPI.onMaximizeChange((maximized) => {
      setIsMaximized(maximized);
    });
    
    // 앱 버전 가져오기
    window.electronAPI.getAppVersion().then(version => {
      setAppVersion(version);
    }).catch(error => {
      console.error('Failed to get app version:', error);
      setAppVersion('Unknown');
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

  const handleMenuItemClick = async (action: string) => {
    handleMenuClose();
    
    switch (action) {
      case 'settings':
        // 설정 화면으로 이동
        if (onTabChange) {
          onTabChange(TAB_INDEX.SETTINGS);
        }
        break;
      case 'about':
        // 정보 다이얼로그 표시
        setAboutDialogOpen(true);
        break;
      case 'checkUpdate':
        // 업데이트 확인
        try {
          const result = await window.electronAPI.checkForUpdates();
          if (result.updateAvailable) {
            window.electronAPI.showNotification('업데이트 확인', `새 버전 ${result.version}이 사용 가능합니다.`);
          } else {
            window.electronAPI.showNotification('업데이트 확인', '현재 최신 버전을 사용 중입니다.');
          }
        } catch (error) {
          console.error('Update check failed:', error);
          window.electronAPI.showNotification('업데이트 확인 실패', '업데이트를 확인할 수 없습니다.');
        }
        break;
      case 'reportBug':
        // 버그 리포트 - 이메일로 변경
        window.location.href = 'mailto:debug.bohyeon@gmail.com?subject=Upbit AI Trading 버그 리포트';
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

        {/* 아이콘 - icon.png 사용 */}
        <img 
          src={iconImage}
          alt="App Icon"
          style={{ 
            width: 20, 
            height: 20,
            marginRight: 8
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
      </Menu>

      {/* 정보 다이얼로그 */}
      <Dialog
        open={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upbit AI Trading</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <img 
              src={iconImage}
              alt="App Icon"
              style={{ 
                width: 80, 
                height: 80,
                marginBottom: 16
              }}
            />
            <Typography variant="h6" gutterBottom>
              버전 {appVersion}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upbit 암호화폐 자동매매 AI 트레이딩 봇
            </Typography>
            <Typography variant="body2" color="text.secondary">
              © 2025 Upbit AI Trading. All rights reserved.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Made with Electron + React + TypeScript
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAboutDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

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