import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Chip
} from '@mui/material';
import {
  Key as KeyIcon,
  Visibility,
  VisibilityOff,
  CheckCircle
} from '@mui/icons-material';
import { ApiKeyStatus } from '../../types';
import { useTradingContext } from '../../contexts/TradingContext';

interface ApiKeySettingsProps {
  apiKeyStatus: ApiKeyStatus;
  onValidate: (accessKey: string, secretKey: string, claudeApiKey?: string) => Promise<ApiKeyStatus>;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
  apiKeyStatus,
  onValidate
}) => {
  const { fetchAccounts } = useTradingContext();
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [alphaVantageApiKey, setAlphaVantageApiKey] = useState('');
  const [exchangeRateApiKey, setExchangeRateApiKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showAlphaVantageKey, setShowAlphaVantageKey] = useState(false);
  const [showExchangeRateKey, setShowExchangeRateKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // 컴포넌트 마운트 시 저장된 API 키 불러오기 및 자동 검증
  React.useEffect(() => {
    const loadSavedKeys = async () => {
      try {
        const savedKeys = await (window as any).electronAPI.getApiKeys();
        if (savedKeys) {
          if (savedKeys.upbitAccessKey) setAccessKey(savedKeys.upbitAccessKey);
          if (savedKeys.upbitSecretKey) setSecretKey(savedKeys.upbitSecretKey);
          if (savedKeys.anthropicApiKey) setClaudeApiKey(savedKeys.anthropicApiKey);
          if (savedKeys.alphaVantageApiKey) setAlphaVantageApiKey(savedKeys.alphaVantageApiKey);
          if (savedKeys.exchangeRateApiKey) setExchangeRateApiKey(savedKeys.exchangeRateApiKey);
          
          // 저장된 키가 있고 아직 검증되지 않았다면 자동 검증
          if (savedKeys.upbitAccessKey && savedKeys.upbitSecretKey && !apiKeyStatus.isValid) {
            console.log('Auto-validating saved API keys...');
            setIsValidating(true);
            try {
              const result = await onValidate(
                savedKeys.upbitAccessKey, 
                savedKeys.upbitSecretKey, 
                savedKeys.anthropicApiKey
              );
              if (!result.isValid) {
                setValidationError('저장된 API 키가 유효하지 않습니다.');
              }
            } catch (error) {
              console.error('Auto-validation failed:', error);
              setValidationError('API 키 자동 검증 실패');
            } finally {
              setIsValidating(false);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load saved API keys:', error);
      }
    };
    loadSavedKeys();
  }, []);

  // API 키가 유효한 경우 계좌 정보 불러오기
  React.useEffect(() => {
    if (apiKeyStatus.isValid) {
      fetchAccounts();
    }
  }, [apiKeyStatus.isValid]);

  const handleValidate = async () => {
    if (!accessKey || !secretKey) {
      setValidationError('Access Key와 Secret Key를 모두 입력해주세요.');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await onValidate(accessKey, secretKey, claudeApiKey);
      if (!result.isValid) {
        setValidationError('API 키가 유효하지 않습니다. 키를 확인해주세요.');
      } else {
        // API 키가 유효하면 저장
        await (window as any).electronAPI.saveApiKeys({
          upbitAccessKey: accessKey,
          upbitSecretKey: secretKey,
          anthropicApiKey: claudeApiKey,
          alphaVantageApiKey: alphaVantageApiKey,
          exchangeRateApiKey: exchangeRateApiKey
        });
        
        // 계좌 정보 다시 불러오기
        try {
          await fetchAccounts();
        } catch (err) {
          console.error('Failed to fetch accounts after API key validation:', err);
        }
      }
    } catch (error) {
      setValidationError('API 키 검증 중 오류가 발생했습니다.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <KeyIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            API 키 설정
          </Typography>
          {apiKeyStatus.isValid && (
            <Chip
              icon={<CheckCircle />}
              label="인증됨"
              color="success"
              size="small"
            />
          )}
        </Box>

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            fullWidth
            label="Access Key"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="Upbit API Access Key를 입력하세요"
            disabled={false}
          />
          
          <TextField
            fullWidth
            label="Secret Key"
            type={showSecretKey ? 'text' : 'password'}
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Upbit API Secret Key를 입력하세요"
            disabled={false}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    edge="end"
                  >
                    {showSecretKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Claude API Key (선택)"
            type={showClaudeKey ? 'text' : 'password'}
            value={claudeApiKey}
            onChange={(e) => setClaudeApiKey(e.target.value)}
            placeholder="Claude API Key를 입력하세요 (AI 분석 사용시 필요)"
            disabled={false}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowClaudeKey(!showClaudeKey)}
                    edge="end"
                  >
                    {showClaudeKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Alpha Vantage API Key (선택)"
            type={showAlphaVantageKey ? 'text' : 'password'}
            value={alphaVantageApiKey}
            onChange={(e) => setAlphaVantageApiKey(e.target.value)}
            placeholder="Alpha Vantage API Key를 입력하세요 (주식시장 상관관계 분석시 필요)"
            disabled={false}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowAlphaVantageKey(!showAlphaVantageKey)}
                    edge="end"
                  >
                    {showAlphaVantageKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Exchange Rate API Key (선택)"
            type={showExchangeRateKey ? 'text' : 'password'}
            value={exchangeRateApiKey}
            onChange={(e) => setExchangeRateApiKey(e.target.value)}
            placeholder="Exchange Rate API Key를 입력하세요 (달러 인덱스 분석시 필요)"
            disabled={false}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowExchangeRateKey(!showExchangeRateKey)}
                    edge="end"
                  >
                    {showExchangeRateKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {validationError && (
            <Alert severity="error">{validationError}</Alert>
          )}

          {apiKeyStatus.isValid && apiKeyStatus.balance && (
            <Alert severity="success">
              API 키가 성공적으로 인증되었습니다. 
              현재 잔액: ₩{parseInt(apiKeyStatus.balance).toLocaleString()}
            </Alert>
          )}

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              onClick={handleValidate}
              disabled={isValidating || !accessKey || !secretKey}
              startIcon={isValidating ? <CircularProgress size={20} /> : <KeyIcon />}
            >
              {isValidating ? '검증 중...' : apiKeyStatus.isValid ? '키 재검증' : '키 검증'}
            </Button>
            
            {apiKeyStatus.isValid && (
              <Button
                variant="outlined"
                onClick={() => {
                  setAccessKey('');
                  setSecretKey('');
                  setClaudeApiKey('');
                  setAlphaVantageApiKey('');
                  setExchangeRateApiKey('');
                  setValidationError(null);
                }}
                color="secondary"
              >
                키 변경
              </Button>
            )}
          </Box>

          <Typography variant="caption" color="text.secondary">
            * Upbit 거래소에서 발급받은 API 키를 입력하세요.
            <br />
            * Claude API 키는 AI 기반 분석을 사용할 때 필요합니다.
            <br />
            * Alpha Vantage API는 주식시장 상관관계 분석에 사용됩니다. (무료: https://www.alphavantage.co)
            <br />
            * Exchange Rate API는 달러 인덱스 계산에 사용됩니다. (무료: https://app.exchangerate-api.com)
            <br />
            * API 키는 안전하게 로컬에 저장되며, 외부로 전송되지 않습니다.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};