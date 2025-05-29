import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  TextField,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  LinearProgress,
  FormControlLabel,
  Slider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper
} from '@mui/material';
import {
  PowerSettingsNew,
  Warning,
  Security,
  History,
  Settings,
  CheckCircle,
  Error,
  Info,
  Timer,
  TrendingDown,
  NetworkCheck,
  BugReport,
  Shield
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface KillSwitchConfig {
  enabled: boolean;
  maxDailyLoss: number;
  maxDrawdown: number;
  emergencyMarketSell: boolean;
  notifyBeforeAction: boolean;
  cooldownMinutes: number;
  autoRestart: boolean;
  whitelistAddresses: string[];
}

interface KillSwitchEvent {
  timestamp: number;
  reason: string;
  details: string;
  portfolio: any[];
  actions: string[];
  success: boolean;
}

const KillSwitchPanel: React.FC = () => {
  const [config, setConfig] = useState<KillSwitchConfig>({
    enabled: true,
    maxDailyLoss: 10,
    maxDrawdown: 15,
    emergencyMarketSell: true,
    notifyBeforeAction: true,
    cooldownMinutes: 60,
    autoRestart: false,
    whitelistAddresses: []
  });

  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState<KillSwitchEvent[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [activateReason, setActivateReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [systemStatus, setSystemStatus] = useState({
    dailyLoss: 0,
    currentDrawdown: 0,
    apiHealth: true,
    lastCheck: Date.now()
  });

  // 상태 및 이력 로드
  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000); // 5초마다 상태 업데이트
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const status = await window.electronAPI.getKillSwitchStatus();
      setIsActive(status.isActive);
      setConfig(status.config);
      setHistory(status.history || []);
      setSystemStatus(status.systemStatus || {
        dailyLoss: 0,
        currentDrawdown: 0,
        apiHealth: true,
        lastCheck: Date.now()
      });
    } catch (error) {
      console.error('Failed to load kill switch status:', error);
    }
  };

  const handleActivate = async () => {
    if (!activateReason.trim()) {
      alert('활성화 사유를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await window.electronAPI.activateKillSwitch(activateReason);
      setShowActivateDialog(false);
      setActivateReason('');
      await loadStatus();
    } catch (error) {
      console.error('Failed to activate kill switch:', error);
      alert('Kill Switch 활성화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Kill Switch를 비활성화하시겠습니까? 자동매매가 재개됩니다.')) {
      return;
    }

    setLoading(true);
    try {
      await window.electronAPI.deactivateKillSwitch();
      await loadStatus();
    } catch (error) {
      console.error('Failed to deactivate kill switch:', error);
      alert('Kill Switch 비활성화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = async () => {
    setLoading(true);
    try {
      await window.electronAPI.updateKillSwitchConfig(config);
      setSaveMessage('설정이 저장되었습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update config:', error);
      setSaveMessage('설정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'MANUAL': return <PowerSettingsNew />;
      case 'MAX_LOSS': return <TrendingDown />;
      case 'API_ERROR': return <NetworkCheck />;
      case 'SYSTEM_ERROR': return <BugReport />;
      case 'ABNORMAL_MARKET': return <Warning />;
      case 'SECURITY_BREACH': return <Security />;
      default: return <Info />;
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'MANUAL': return 'primary';
      case 'MAX_LOSS': return 'error';
      case 'API_ERROR': return 'warning';
      case 'SYSTEM_ERROR': return 'error';
      case 'ABNORMAL_MARKET': return 'warning';
      case 'SECURITY_BREACH': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 메인 상태 카드 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Shield sx={{ fontSize: 40, color: isActive ? '#f44336' : '#4caf50' }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Kill Switch (긴급 정지)
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  위급 상황 시 모든 거래를 즉시 중단하고 포지션을 정리합니다
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="설정">
                <IconButton onClick={() => setShowSettings(!showSettings)}>
                  <Settings />
                </IconButton>
              </Tooltip>
              {isActive ? (
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  onClick={handleDeactivate}
                  disabled={loading}
                  startIcon={<PowerSettingsNew />}
                >
                  시스템 재개
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  onClick={() => setShowActivateDialog(true)}
                  disabled={loading || !config.enabled}
                  startIcon={<PowerSettingsNew />}
                >
                  긴급 정지
                </Button>
              )}
            </Box>
          </Box>

          {/* 시스템 상태 */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Kill Switch 상태
                </Typography>
                <Chip
                  label={isActive ? 'ACTIVE' : 'STANDBY'}
                  color={isActive ? 'error' : 'success'}
                  sx={{ fontWeight: 'bold' }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  일일 손실률
                </Typography>
                <Typography variant="h6" color={systemStatus.dailyLoss > 5 ? 'error' : 'inherit'}>
                  {systemStatus.dailyLoss.toFixed(2)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(systemStatus.dailyLoss / config.maxDailyLoss) * 100}
                  color={systemStatus.dailyLoss > config.maxDailyLoss * 0.8 ? 'error' : 'primary'}
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  현재 낙폭
                </Typography>
                <Typography variant="h6" color={systemStatus.currentDrawdown > 10 ? 'error' : 'inherit'}>
                  {systemStatus.currentDrawdown.toFixed(2)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(systemStatus.currentDrawdown / config.maxDrawdown) * 100}
                  color={systemStatus.currentDrawdown > config.maxDrawdown * 0.8 ? 'error' : 'primary'}
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  API 상태
                </Typography>
                <Chip
                  icon={systemStatus.apiHealth ? <CheckCircle /> : <Error />}
                  label={systemStatus.apiHealth ? '정상' : '오류'}
                  color={systemStatus.apiHealth ? 'success' : 'error'}
                />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {formatDistanceToNow(systemStatus.lastCheck, { addSuffix: true, locale: ko })}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 설정 패널 */}
      {showSettings && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Kill Switch 설정
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enabled}
                      onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    />
                  }
                  label="Kill Switch 모니터링 활성화"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>
                  일일 최대 손실률: {config.maxDailyLoss}%
                </Typography>
                <Slider
                  value={config.maxDailyLoss}
                  onChange={(e, value) => setConfig({ ...config, maxDailyLoss: value as number })}
                  min={5}
                  max={30}
                  marks
                  valueLabelDisplay="auto"
                  disabled={!config.enabled}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>
                  최대 낙폭: {config.maxDrawdown}%
                </Typography>
                <Slider
                  value={config.maxDrawdown}
                  onChange={(e, value) => setConfig({ ...config, maxDrawdown: value as number })}
                  min={10}
                  max={50}
                  marks
                  valueLabelDisplay="auto"
                  disabled={!config.enabled}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.emergencyMarketSell}
                      onChange={(e) => setConfig({ ...config, emergencyMarketSell: e.target.checked })}
                    />
                  }
                  label="긴급 시장가 매도 실행"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notifyBeforeAction}
                      onChange={(e) => setConfig({ ...config, notifyBeforeAction: e.target.checked })}
                    />
                  }
                  label="실행 전 알림 발송"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="재시작 대기 시간 (분)"
                  type="number"
                  value={config.cooldownMinutes}
                  onChange={(e) => setConfig({ ...config, cooldownMinutes: parseInt(e.target.value) || 60 })}
                  disabled={!config.enabled}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.autoRestart}
                      onChange={(e) => setConfig({ ...config, autoRestart: e.target.checked })}
                    />
                  }
                  label="자동 재시작"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleConfigUpdate}
                  disabled={loading}
                  startIcon={<Settings />}
                >
                  설정 저장
                </Button>
                {saveMessage && (
                  <Typography
                    variant="body2"
                    color={saveMessage.includes('실패') ? 'error' : 'success'}
                    sx={{ mt: 1 }}
                  >
                    {saveMessage}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 실행 이력 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Kill Switch 실행 이력
          </Typography>
          {history.length === 0 ? (
            <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
              실행 이력이 없습니다
            </Typography>
          ) : (
            <List>
              {history.slice(-5).reverse().map((event, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {getReasonIcon(event.reason)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {event.details}
                          </Typography>
                          <Chip
                            size="small"
                            label={event.reason}
                            color={getReasonColor(event.reason) as any}
                          />
                          {event.success ? (
                            <Chip size="small" icon={<CheckCircle />} label="성공" color="success" />
                          ) : (
                            <Chip size="small" icon={<Error />} label="실패" color="error" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(event.timestamp).toLocaleString('ko-KR')} 
                            ({formatDistanceToNow(event.timestamp, { addSuffix: true, locale: ko })})
                          </Typography>
                          <Typography variant="caption" display="block">
                            실행된 작업: {event.actions.join(', ')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < history.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* 활성화 다이얼로그 */}
      <Dialog
        open={showActivateDialog}
        onClose={() => setShowActivateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="error" />
            Kill Switch 활성화
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Kill Switch를 활성화하면 다음 작업이 즉시 실행됩니다:
            <ul>
              <li>모든 자동매매 중지</li>
              <li>미체결 주문 취소</li>
              {config.emergencyMarketSell && <li>모든 보유 코인 시장가 매도</li>}
              <li>시스템 잠금</li>
            </ul>
          </Alert>
          <TextField
            fullWidth
            label="활성화 사유"
            multiline
            rows={3}
            value={activateReason}
            onChange={(e) => setActivateReason(e.target.value)}
            placeholder="Kill Switch를 활성화하는 이유를 입력하세요"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActivateDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleActivate}
            color="error"
            variant="contained"
            disabled={loading || !activateReason.trim()}
          >
            활성화
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KillSwitchPanel;