import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  Delete,
  DeleteSweep
} from '@mui/icons-material';

interface NotificationSettings {
  enabled: boolean;
  tradeNotifications: boolean;
  systemNotifications: boolean;
  analysisNotifications: boolean;
  soundEnabled: boolean;
  minimumProfitAlert: number;
  minimumLossAlert: number;
}

interface NotificationHistoryItem {
  title: string;
  body: string;
  type: 'trade' | 'system' | 'analysis' | 'error';
  timestamp: number;
}

export const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    tradeNotifications: true,
    systemNotifications: true,
    analysisNotifications: true,
    soundEnabled: true,
    minimumProfitAlert: 5,
    minimumLossAlert: -3,
  });
  
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // 설정 불러오기
  useEffect(() => {
    loadSettings();
    loadHistory();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await (window as any).electronAPI.getNotificationSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const notificationHistory = await (window as any).electronAPI.getNotificationHistory(20);
      setHistory(notificationHistory || []);
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  };

  const handleSettingChange = (name: keyof NotificationSettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : Number(event.target.value);
    setSettings({
      ...settings,
      [name]: value,
    });
  };

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      const success = await (window as any).electronAPI.saveNotificationSettings(settings);
      if (success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
    }
  };

  const clearHistory = async () => {
    try {
      const success = await (window as any).electronAPI.clearNotificationHistory();
      if (success) {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trade':
        return 'primary';
      case 'system':
        return 'info';
      case 'analysis':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return '💰';
      case 'system':
        return '⚙️';
      case 'analysis':
        return '📊';
      case 'error':
        return '❌';
      default:
        return '📢';
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            {settings.enabled ? (
              <NotificationsActive color="primary" sx={{ mr: 2 }} />
            ) : (
              <NotificationsOff color="disabled" sx={{ mr: 2 }} />
            )}
            <Typography variant="h6">알림 설정</Typography>
          </Box>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled}
                  onChange={handleSettingChange('enabled')}
                  color="primary"
                />
              }
              label="알림 활성화"
            />

            <Box sx={{ ml: 4, mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.tradeNotifications}
                    onChange={handleSettingChange('tradeNotifications')}
                    disabled={!settings.enabled}
                  />
                }
                label="거래 체결 알림"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.systemNotifications}
                    onChange={handleSettingChange('systemNotifications')}
                    disabled={!settings.enabled}
                  />
                }
                label="시스템 상태 알림"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.analysisNotifications}
                    onChange={handleSettingChange('analysisNotifications')}
                    disabled={!settings.enabled}
                  />
                }
                label="분석 신호 알림"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.soundEnabled}
                    onChange={handleSettingChange('soundEnabled')}
                    disabled={!settings.enabled}
                  />
                }
                label="알림음 사용"
              />
            </Box>
          </FormGroup>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" gutterBottom>
            거래 알림 임계값
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <TextField
              label="수익 알림 기준"
              type="number"
              value={settings.minimumProfitAlert}
              onChange={handleSettingChange('minimumProfitAlert')}
              disabled={!settings.enabled || !settings.tradeNotifications}
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              helperText="이상 수익 시 알림"
            />
            <TextField
              label="손실 알림 기준"
              type="number"
              value={settings.minimumLossAlert}
              onChange={handleSettingChange('minimumLossAlert')}
              disabled={!settings.enabled || !settings.tradeNotifications}
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              helperText="이상 손실 시 알림"
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={saveSettings}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? '저장 중...' : '설정 저장'}
            </Button>
          </Box>

          {saveStatus === 'saved' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              설정이 저장되었습니다.
            </Alert>
          )}
          {saveStatus === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              설정 저장에 실패했습니다.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">최근 알림</Typography>
            <Button
              size="small"
              startIcon={<DeleteSweep />}
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              전체 삭제
            </Button>
          </Box>

          {history.length === 0 ? (
            <Alert severity="info">
              최근 알림이 없습니다.
            </Alert>
          ) : (
            <List>
              {history.map((item, index) => (
                <ListItem key={index} divider={index < history.length - 1}>
                  <ListItemText
                    primary={
                      <React.Fragment>
                        <Box component="span" sx={{ mr: 1 }}>
                          {getTypeIcon(item.type)}
                        </Box>
                        {item.title}
                        <Chip
                          label={item.type}
                          size="small"
                          color={getTypeColor(item.type) as any}
                          sx={{ ml: 1 }}
                        />
                      </React.Fragment>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" display="block">
                          {item.body}
                        </Typography>
                        <Typography component="span" variant="caption" display="block" sx={{ mt: 0.5 }}>
                          {new Date(item.timestamp).toLocaleString()}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};