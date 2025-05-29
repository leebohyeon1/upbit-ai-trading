import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Chip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Security,
  QrCode,
  ContentCopy,
  CheckCircle,
  Warning,
  Refresh,
  Download,
  VerifiedUser,
  Key,
  PhoneAndroid
} from '@mui/icons-material';
import { useTradingContext } from '../../contexts/TradingContext';

interface TwoFactorStatus {
  isEnabled: boolean;
  setupComplete: boolean;
  backupCodesRemaining: number;
}

interface SetupData {
  secret: string;
  qrUri: string;
  backupCodes: string[];
}

export const TwoFactorAuthSettings: React.FC = () => {
  const {
    get2FAStatus,
    setup2FA,
    enable2FA,
    disable2FA,
    verify2FA,
    regenerateBackupCodes
  } = useTradingContext();
  const [status, setStatus] = useState<TwoFactorStatus>({
    isEnabled: false,
    setupComplete: false,
    backupCodesRemaining: 0
  });
  const [setupDialog, setSetupDialog] = useState(false);
  const [disableDialog, setDisableDialog] = useState(false);
  const [backupCodesDialog, setBackupCodesDialog] = useState(false);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const result = await get2FAStatus();
      setStatus(result);
    } catch (error) {
      console.error('2FA 상태 로드 실패:', error);
      setError('2FA 상태를 불러올 수 없습니다.');
    }
  };

  const handleSetupStart = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await setup2FA();
      setSetupData(result);
      setSetupDialog(true);
      setCurrentStep(0);
    } catch (error) {
      setError('2FA 설정을 시작할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('6자리 인증 코드를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const success = await enable2FA(verificationCode);
      
      if (success) {
        setSuccess('2단계 인증이 성공적으로 활성화되었습니다!');
        setSetupDialog(false);
        setCurrentStep(0);
        setVerificationCode('');
        await loadStatus();
      } else {
        setError('잘못된 인증 코드입니다. 다시 시도해주세요.');
      }
    } catch (error) {
      setError('2FA 활성화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setError('6자리 인증 코드 또는 백업 코드를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const success = await disable2FA(disableCode);
      
      if (success) {
        setSuccess('2단계 인증이 비활성화되었습니다.');
        setDisableDialog(false);
        setDisableCode('');
        await loadStatus();
      } else {
        setError('잘못된 인증 코드입니다.');
      }
    } catch (error) {
      setError('2FA 비활성화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('6자리 인증 코드를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const codes = await regenerateBackupCodes(verificationCode);
      setNewBackupCodes(codes);
      setBackupCodesDialog(true);
      setVerificationCode('');
      await loadStatus();
    } catch (error) {
      setError('백업 코드 재생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('클립보드에 복사되었습니다.');
  };

  const downloadBackupCodes = (codes: string[]) => {
    const content = `Upbit AI Trading 백업 코드\n생성일: ${new Date().toLocaleString()}\n\n${codes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\n중요: 이 코드들을 안전한 곳에 보관하세요. 각 코드는 한 번만 사용할 수 있습니다.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upbit-ai-trading-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const steps = ['앱 설치', 'QR 코드 스캔', '인증 코드 확인'];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Security color={status.isEnabled ? "primary" : "disabled"} />
            <Typography variant="h6" fontWeight="bold">
              2단계 인증 (2FA)
            </Typography>
            {status.isEnabled && (
              <Chip 
                icon={<VerifiedUser />} 
                label="활성화됨" 
                color="success" 
                size="small"
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            2단계 인증을 활성화하면 로그인 시 스마트폰의 인증 앱에서 생성된 6자리 코드가 추가로 필요합니다.
            이는 계정 보안을 크게 향상시킵니다.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: status.isEnabled ? 'success.50' : 'grey.50' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Security color={status.isEnabled ? "success" : "disabled"} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    상태: {status.isEnabled ? '활성화됨' : '비활성화됨'}
                  </Typography>
                </Box>
                
                {status.isEnabled && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      남은 백업 코드: {status.backupCodesRemaining}개
                    </Typography>
                    
                    {status.backupCodesRemaining < 5 && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        백업 코드가 부족합니다. 새로 생성해주세요.
                      </Alert>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box display="flex" flexDirection="column" gap={2}>
                {!status.isEnabled ? (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Security />}
                    onClick={handleSetupStart}
                    disabled={loading}
                    fullWidth
                  >
                    2단계 인증 설정
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Warning />}
                      onClick={() => setDisableDialog(true)}
                      disabled={loading}
                      fullWidth
                    >
                      2단계 인증 비활성화
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => setBackupCodesDialog(true)}
                      disabled={loading}
                      fullWidth
                    >
                      백업 코드 재생성
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>

          {status.isEnabled && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                백업 코드란?
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Key fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="휴대폰을 분실했을 때 계정에 접근할 수 있는 일회용 코드입니다."
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Warning fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="각 코드는 한 번만 사용할 수 있으므로 안전한 곳에 보관하세요."
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 2FA 설정 다이얼로그 */}
      <Dialog 
        open={setupDialog} 
        onClose={() => setSetupDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>2단계 인증 설정</DialogTitle>
        <DialogContent>
          <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {currentStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                1단계: 인증 앱 설치
              </Typography>
              <Typography paragraph>
                스마트폰에 다음 중 하나의 앱을 설치해주세요:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PhoneAndroid />
                  </ListItemIcon>
                  <ListItemText primary="Google Authenticator" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneAndroid />
                  </ListItemIcon>
                  <ListItemText primary="Microsoft Authenticator" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneAndroid />
                  </ListItemIcon>
                  <ListItemText primary="Authy" />
                </ListItem>
              </List>
              <Button 
                variant="contained" 
                onClick={() => setCurrentStep(1)}
                sx={{ mt: 2 }}
              >
                다음 단계
              </Button>
            </Box>
          )}

          {currentStep === 1 && setupData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                2단계: QR 코드 스캔
              </Typography>
              <Typography paragraph>
                인증 앱에서 아래 QR 코드를 스캔하거나, 수동으로 키를 입력하세요:
              </Typography>
              
              <Box display="flex" justifyContent="center" mb={2}>
                <Box textAlign="center">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: `<div id="qrcode"></div>` 
                    }} 
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    QR 코드를 스캔할 수 없다면 아래 키를 수동으로 입력하세요
                  </Typography>
                </Box>
              </Box>

              <Paper sx={{ p: 2, backgroundColor: 'grey.100' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {setupData.secret}
                  </Typography>
                  <Tooltip title="복사">
                    <IconButton onClick={() => copyToClipboard(setupData.secret)}>
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>

              <Box display="flex" gap={2} mt={3}>
                <Button onClick={() => setCurrentStep(0)}>
                  이전
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => setCurrentStep(2)}
                >
                  다음 단계
                </Button>
              </Box>
            </Box>
          )}

          {currentStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                3단계: 인증 코드 확인
              </Typography>
              <Typography paragraph>
                인증 앱에서 생성된 6자리 코드를 입력하여 설정을 완료하세요:
              </Typography>
              
              <TextField
                fullWidth
                label="인증 코드"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                inputProps={{ 
                  maxLength: 6,
                  style: { fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5rem' }
                }}
                sx={{ mb: 2 }}
              />

              {setupData && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    백업 코드
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    다음 백업 코드들을 안전한 곳에 저장하세요. 휴대폰을 분실했을 때 사용할 수 있습니다.
                  </Alert>
                  
                  <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Grid container spacing={1}>
                      {setupData.backupCodes.map((code, index) => (
                        <Grid item xs={6} sm={4} key={index}>
                          <Typography 
                            variant="body2" 
                            sx={{ fontFamily: 'monospace', textAlign: 'center' }}
                          >
                            {code}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                    
                    <Box display="flex" gap={1} mt={2}>
                      <Button
                        size="small"
                        startIcon={<ContentCopy />}
                        onClick={() => copyToClipboard(setupData.backupCodes.join('\n'))}
                      >
                        복사
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Download />}
                        onClick={() => downloadBackupCodes(setupData.backupCodes)}
                      >
                        다운로드
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              )}

              <Box display="flex" gap={2} mt={3}>
                <Button onClick={() => setCurrentStep(1)}>
                  이전
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleVerifyAndEnable}
                  disabled={loading || verificationCode.length !== 6}
                >
                  설정 완료
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 2FA 비활성화 다이얼로그 */}
      <Dialog open={disableDialog} onClose={() => setDisableDialog(false)}>
        <DialogTitle>2단계 인증 비활성화</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            2단계 인증을 비활성화하면 계정 보안이 약화됩니다.
          </Alert>
          
          <TextField
            fullWidth
            label="인증 코드 또는 백업 코드"
            type="text"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            placeholder="123456 또는 ABCD-1234"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableDialog(false)}>
            취소
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDisable}
            disabled={loading || !disableCode}
          >
            비활성화
          </Button>
        </DialogActions>
      </Dialog>

      {/* 백업 코드 재생성 다이얼로그 */}
      <Dialog open={backupCodesDialog} onClose={() => setBackupCodesDialog(false)}>
        <DialogTitle>백업 코드 재생성</DialogTitle>
        <DialogContent>
          {newBackupCodes.length === 0 ? (
            <Box>
              <Typography paragraph>
                현재 백업 코드를 새로 생성합니다. 기존 백업 코드는 모두 무효화됩니다.
              </Typography>
              
              <TextField
                fullWidth
                label="인증 코드"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                sx={{ mt: 2 }}
              />
            </Box>
          ) : (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                새로운 백업 코드가 생성되었습니다!
              </Alert>
              
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Grid container spacing={1}>
                  {newBackupCodes.map((code, index) => (
                    <Grid item xs={6} sm={4} key={index}>
                      <Typography 
                        variant="body2" 
                        sx={{ fontFamily: 'monospace', textAlign: 'center' }}
                      >
                        {code}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
                
                <Box display="flex" gap={1} mt={2}>
                  <Button
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={() => copyToClipboard(newBackupCodes.join('\n'))}
                  >
                    복사
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Download />}
                    onClick={() => downloadBackupCodes(newBackupCodes)}
                  >
                    다운로드
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setBackupCodesDialog(false);
            setNewBackupCodes([]);
            setVerificationCode('');
          }}>
            {newBackupCodes.length === 0 ? '취소' : '닫기'}
          </Button>
          {newBackupCodes.length === 0 && (
            <Button 
              variant="contained"
              onClick={handleRegenerateBackupCodes}
              disabled={loading || verificationCode.length !== 6}
            >
              재생성
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};