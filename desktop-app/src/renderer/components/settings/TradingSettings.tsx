import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Settings as SettingsIcon,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Speed,
  ShowChart
} from '@mui/icons-material';
import { TradingConfig } from '../../types';
import { DEFAULT_CONFIG } from '../../constants';

interface TradingSettingsProps {
  config: TradingConfig;
  onChange: (config: TradingConfig) => void;
}

export const TradingSettings: React.FC<TradingSettingsProps> = ({
  config,
  onChange
}) => {
  // 컴포넌트 마운트 시 현재 설정 확인
  React.useEffect(() => {
    console.log('[TradingSettings] Current config on mount:', config);
    console.log('[TradingSettings] localStorage tradingConfig:', localStorage.getItem('tradingConfig'));
  }, []);
  
  // config 변경 시 로그
  React.useEffect(() => {
    console.log('[TradingSettings] Config updated:', config);
  }, [config]);
  const handleChange = (field: keyof TradingConfig | string, value: any) => {
    console.log(`[TradingSettings] Changing ${field} to:`, value);
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      const updatedConfig = {
        ...config,
        [parent]: {
          ...(config as any)[parent],
          [child]: value
        }
      };
      console.log('[TradingSettings] Updated config:', updatedConfig);
      onChange(updatedConfig);
    } else {
      const updatedConfig = {
        ...config,
        [field]: value
      };
      console.log('[TradingSettings] Updated config:', updatedConfig);
      onChange(updatedConfig);
    }
  };

  return (
    <Box sx={{ 
      width: '100%',
      minWidth: '100%',
      p: { xs: 1, sm: 2, md: 3, lg: 4 }
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          거래 설정
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* 간소화 거래 모드 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Speed color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  간소화 거래 모드 (이전 프로젝트 방식)
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                복잡한 분석을 단순화하여 더 나은 수익률을 목표로 합니다. 
                6개 핵심 지표만 사용하고 신뢰도/거래량 제한을 제거합니다.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.simplifiedConfig?.enabled ?? true}
                        onChange={(e) => handleChange('simplifiedConfig.enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>간소화 모드 사용</Typography>
                        <Typography variant="caption" color="text.secondary">
                          이전 프로젝트와 동일한 방식으로 거래 (권장)
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>

                {(config.simplifiedConfig?.enabled ?? true) && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>타임프레임</InputLabel>
                        <Select
                          value={config.simplifiedConfig?.timeframe || 'minute60'}
                          onChange={(e) => handleChange('simplifiedConfig.timeframe', e.target.value)}
                          label="타임프레임"
                        >
                          <MenuItem value="minute1">1분봉</MenuItem>
                          <MenuItem value="minute3">3분봉</MenuItem>
                          <MenuItem value="minute5">5분봉</MenuItem>
                          <MenuItem value="minute10">10분봉</MenuItem>
                          <MenuItem value="minute15">15분봉</MenuItem>
                          <MenuItem value="minute30">30분봉</MenuItem>
                          <MenuItem value="minute60">60분봉 (권장)</MenuItem>
                          <MenuItem value="minute240">4시간봉</MenuItem>
                          <MenuItem value="day">일봉</MenuItem>
                          <MenuItem value="week">주봉</MenuItem>
                          <MenuItem value="month">월봉</MenuItem>
                        </Select>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          더 긴 타임프레임이 더 안정적인 신호를 제공합니다
                        </Typography>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="분석 주기 (분)"
                        type="number"
                        value={config.simplifiedConfig?.analysisInterval || 60}
                        onChange={(e) => handleChange('simplifiedConfig.analysisInterval', parseInt(e.target.value))}
                        InputProps={{
                          inputProps: { min: 1, max: 1440, step: 1 },
                          endAdornment: <InputAdornment position="end">분</InputAdornment>
                        }}
                        helperText="매매 분석을 수행할 간격"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          사용할 지표 선택 (6개 핵심 지표)
                        </Typography>
                      </Divider>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.simplifiedConfig?.useIndicators?.movingAverage ?? true}
                            onChange={(e) => handleChange('simplifiedConfig.useIndicators.movingAverage', e.target.checked)}
                          />
                        }
                        label="이동평균선 (MA) - 골든/데드크로스"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.simplifiedConfig?.useIndicators?.rsi ?? true}
                            onChange={(e) => handleChange('simplifiedConfig.useIndicators.rsi', e.target.checked)}
                          />
                        }
                        label="RSI - 과매수/과매도"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.simplifiedConfig?.useIndicators?.macd ?? true}
                            onChange={(e) => handleChange('simplifiedConfig.useIndicators.macd', e.target.checked)}
                          />
                        }
                        label="MACD - 추세 전환"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.simplifiedConfig?.useIndicators?.bollingerBands ?? true}
                            onChange={(e) => handleChange('simplifiedConfig.useIndicators.bollingerBands', e.target.checked)}
                          />
                        }
                        label="볼린저 밴드 - 변동성"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.simplifiedConfig?.useIndicators?.stochastic ?? true}
                            onChange={(e) => handleChange('simplifiedConfig.useIndicators.stochastic', e.target.checked)}
                          />
                        }
                        label="스토캐스틱 - 모멘텀"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.simplifiedConfig?.useIndicators?.volume ?? true}
                            onChange={(e) => handleChange('simplifiedConfig.useIndicators.volume', e.target.checked)}
                          />
                        }
                        label="거래량 - 시장 참여도"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          매수/매도 임계값 (이전 프로젝트 방식)
                        </Typography>
                      </Divider>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>
                        매수 임계값: {config.simplifiedConfig?.tradingThresholds?.buyThreshold || 0.15}
                      </Typography>
                      <Box sx={{ px: 2, pb: 2 }}>
                        <Slider
                          value={config.simplifiedConfig?.tradingThresholds?.buyThreshold || 0.15}
                          onChange={(e, value) => handleChange('simplifiedConfig.tradingThresholds.buyThreshold', value as number)}
                          min={0.05}
                          max={0.3}
                          step={0.01}
                          marks={[
                            { value: 0.05, label: '0.05' },
                            { value: 0.15, label: '0.15 (기본)' },
                            { value: 0.3, label: '0.30' }
                          ]}
                          valueLabelDisplay="auto"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        이 값 이상일 때 매수 신호 발생
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>
                        매도 임계값: {config.simplifiedConfig?.tradingThresholds?.sellThreshold || -0.2}
                      </Typography>
                      <Box sx={{ px: 2, pb: 2 }}>
                        <Slider
                          value={config.simplifiedConfig?.tradingThresholds?.sellThreshold || -0.2}
                          onChange={(e, value) => handleChange('simplifiedConfig.tradingThresholds.sellThreshold', value as number)}
                          min={-0.3}
                          max={-0.05}
                          step={0.01}
                          marks={[
                            { value: -0.3, label: '-0.30' },
                            { value: -0.2, label: '-0.20 (기본)' },
                            { value: -0.05, label: '-0.05' }
                          ]}
                          valueLabelDisplay="auto"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        이 값 이하일 때 매도 신호 발생
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 기본 거래 설정 */}
        <Grid item xs={12}>
          <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <AttachMoney color="primary" />
              <Typography variant="h6" fontWeight="bold">
                기본 거래 설정
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="코인당 최대 투자금액"
                  type="number"
                  value={config.maxInvestmentPerCoin}
                  onChange={(e) => handleChange('maxInvestmentPerCoin', parseInt(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                    inputProps: { min: 10000, max: 10000000, step: 10000 }
                  }}
                  helperText="각 코인에 투자할 최대 금액"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableRealTrading}
                      onChange={(e) => handleChange('enableRealTrading', e.target.checked)}
                      color="warning"
                    />
                  }
                  label={
                    <Box>
                      <Typography>실제 거래 활성화</Typography>
                      <Typography variant="caption" color="text.secondary">
                        활성화시 실제 매매가 진행됩니다
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>기본 매수 비율: {(config.buyRatio * 100).toFixed(0)}%</Typography>
                <Box sx={{ px: 2, pb: 2 }}>
                  <Slider
                    value={config.buyRatio}
                    onChange={(e, value) => handleChange('buyRatio', value as number)}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    marks={[
                      { value: 0.1, label: '10%' },
                      { value: 0.5, label: '50%' },
                      { value: 1.0, label: '100%' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>기본 매도 비율: {(config.sellRatio * 100).toFixed(0)}%</Typography>
                <Box sx={{ px: 2, pb: 2 }}>
                  <Slider
                    value={config.sellRatio}
                    onChange={(e, value) => handleChange('sellRatio', value as number)}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    marks={[
                      { value: 0.1, label: '10%' },
                      { value: 0.5, label: '50%' },
                      { value: 1.0, label: '100%' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* 간소화 거래 모드 설정 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Speed color="primary" />
              <Typography variant="h6" fontWeight="bold">
                간소화 거래 모드
              </Typography>
              <FormControlLabel
                sx={{ ml: 'auto' }}
                control={
                  <Switch
                    checked={config.simplifiedConfig?.enabled ?? true}
                    onChange={(e) => handleChange('simplifiedConfig.enabled', e.target.checked)}
                    color="primary"
                  />
                }
                label="간소화 모드 사용"
              />
            </Box>

            {config.simplifiedConfig?.enabled && (
              <>
                <Divider sx={{ my: 2 }} />
                
                {/* 사용할 지표 선택 */}
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  사용할 지표 선택
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6} lg={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.simplifiedConfig?.useIndicators?.movingAverage ?? true}
                          onChange={(e) => handleChange('simplifiedConfig.useIndicators.movingAverage', e.target.checked)}
                        />
                      }
                      label="이동평균선 (MA)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.simplifiedConfig?.useIndicators?.rsi ?? true}
                          onChange={(e) => handleChange('simplifiedConfig.useIndicators.rsi', e.target.checked)}
                        />
                      }
                      label="RSI"
                    />
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.simplifiedConfig?.useIndicators?.macd ?? true}
                          onChange={(e) => handleChange('simplifiedConfig.useIndicators.macd', e.target.checked)}
                        />
                      }
                      label="MACD"
                    />
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.simplifiedConfig?.useIndicators?.bollingerBands ?? true}
                          onChange={(e) => handleChange('simplifiedConfig.useIndicators.bollingerBands', e.target.checked)}
                        />
                      }
                      label="볼린저 밴드"
                    />
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.simplifiedConfig?.useIndicators?.stochastic ?? true}
                          onChange={(e) => handleChange('simplifiedConfig.useIndicators.stochastic', e.target.checked)}
                        />
                      }
                      label="스토캐스틱"
                    />
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.simplifiedConfig?.useIndicators?.volume ?? true}
                          onChange={(e) => handleChange('simplifiedConfig.useIndicators.volume', e.target.checked)}
                        />
                      }
                      label="거래량"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* 매매 임계값 설정 */}
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  매매 임계값 설정
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="매수 임계값"
                      type="number"
                      value={config.simplifiedConfig?.tradingThresholds?.buyThreshold ?? 0.15}
                      onChange={(e) => handleChange('simplifiedConfig.tradingThresholds.buyThreshold', parseFloat(e.target.value))}
                      InputProps={{
                        inputProps: { min: -1, max: 1, step: 0.05 },
                        startAdornment: <InputAdornment position="start">+</InputAdornment>
                      }}
                      helperText="이 값 이상일 때 매수 신호 (기본: 0.15)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="매도 임계값"
                      type="number"
                      value={config.simplifiedConfig?.tradingThresholds?.sellThreshold ?? -0.2}
                      onChange={(e) => handleChange('simplifiedConfig.tradingThresholds.sellThreshold', parseFloat(e.target.value))}
                      InputProps={{
                        inputProps: { min: -1, max: 1, step: 0.05 }
                      }}
                      helperText="이 값 이하일 때 매도 신호 (기본: -0.2)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="RSI 과매수 수준"
                      type="number"
                      value={config.simplifiedConfig?.tradingThresholds?.rsiOverbought ?? 70}
                      onChange={(e) => handleChange('simplifiedConfig.tradingThresholds.rsiOverbought', parseInt(e.target.value))}
                      InputProps={{
                        inputProps: { min: 60, max: 90, step: 5 }
                      }}
                      helperText="RSI가 이 값 이상이면 과매수 (기본: 70)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="RSI 과매도 수준"
                      type="number"
                      value={config.simplifiedConfig?.tradingThresholds?.rsiOversold ?? 30}
                      onChange={(e) => handleChange('simplifiedConfig.tradingThresholds.rsiOversold', parseInt(e.target.value))}
                      InputProps={{
                        inputProps: { min: 10, max: 40, step: 5 }
                      }}
                      helperText="RSI가 이 값 이하면 과매도 (기본: 30)"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* 투자 설정 */}
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  투자 설정
                </Typography>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="투자 비율"
                      type="number"
                      value={(config.simplifiedConfig?.investmentSettings?.investmentRatio ?? 0.2) * 100}
                      onChange={(e) => handleChange('simplifiedConfig.investmentSettings.investmentRatio', parseFloat(e.target.value) / 100)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 5, max: 50, step: 5 }
                      }}
                      helperText="총 자산 대비 투자 비율 (기본: 20%)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="최대 투자 금액"
                      type="number"
                      value={config.simplifiedConfig?.investmentSettings?.maxPositionSize ?? 1000000}
                      onChange={(e) => handleChange('simplifiedConfig.investmentSettings.maxPositionSize', parseInt(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                        inputProps: { min: 50000, max: 10000000, step: 50000 }
                      }}
                      helperText="최대 투자 금액 (기본: 100만원)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="손절 비율"
                      type="number"
                      value={config.simplifiedConfig?.investmentSettings?.stopLossPercent ?? 5}
                      onChange={(e) => handleChange('simplifiedConfig.investmentSettings.stopLossPercent', parseFloat(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 2, max: 15, step: 0.5 }
                      }}
                      helperText="손절 기준 하락률 (기본: 5%)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="익절 비율"
                      type="number"
                      value={config.simplifiedConfig?.investmentSettings?.takeProfitPercent ?? 10}
                      onChange={(e) => handleChange('simplifiedConfig.investmentSettings.takeProfitPercent', parseFloat(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 3, max: 30, step: 0.5 }
                      }}
                      helperText="익절 기준 상승률 (기본: 10%)"
                    />
                  </Grid>
                </Grid>

                {/* 쿨다운 설정 */}
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  쿨다운 설정
                </Typography>
                <Grid container spacing={3} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.simplifiedConfig?.cooldownSettings?.enabled ?? true}
                          onChange={(e) => handleChange('simplifiedConfig.cooldownSettings.enabled', e.target.checked)}
                        />
                      }
                      label="쿨다운 사용"
                    />
                  </Grid>
                  {config.simplifiedConfig?.cooldownSettings?.enabled && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="거래 후 대기 시간"
                        type="number"
                        value={config.simplifiedConfig?.cooldownSettings?.tradeCooldown ?? 60}
                        onChange={(e) => handleChange('simplifiedConfig.cooldownSettings.tradeCooldown', parseInt(e.target.value))}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">분</InputAdornment>,
                          inputProps: { min: 10, max: 240, step: 10 }
                        }}
                        helperText="거래 후 다음 거래까지 대기 시간 (기본: 60분)"
                      />
                    </Grid>
                  )}
                </Grid>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  간소화 모드는 이전 프로젝트와 유사한 방식으로 작동합니다. 여러 지표의 신호를 종합하여 매매 결정을 내립니다.
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

        {/* AI 설정 */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <SettingsIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                AI 설정
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.useAI}
                      onChange={(e) => handleChange('useAI', e.target.checked)}
                    />
                  }
                  label="AI 분석 사용"
                />
              </Grid>

              {config.useAI && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>AI 제공자</InputLabel>
                    <Select
                      value={config.aiProvider}
                      onChange={(e) => handleChange('aiProvider', e.target.value)}
                      label="AI 모델"
                    >
                      <MenuItem value="claude">Claude (Anthropic)</MenuItem>
                      <MenuItem value="gpt" disabled>GPT (OpenAI) - 준비중</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

        {/* 리스크 관리 */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <TrendingDown color="error" />
              <Typography variant="h6" fontWeight="bold">
                리스크 관리
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography gutterBottom>
                  리스크 레벨: {config.riskLevel}
                </Typography>
                <Box sx={{ px: 2, pb: 2 }}>
                  <Slider
                    value={config.riskLevel}
                    onChange={(e, value) => handleChange('riskLevel', value as number)}
                    min={1}
                    max={5}
                    step={1}
                    marks={[
                      { value: 1, label: '매우 낮음' },
                      { value: 3, label: '보통' },
                      { value: 5, label: '매우 높음' }
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.dynamicConfidence}
                      onChange={(e) => handleChange('dynamicConfidence', e.target.checked)}
                    />
                  }
                  label="동적 신뢰도 조정"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.useKellyCriterion}
                      onChange={(e) => handleChange('useKellyCriterion', e.target.checked)}
                    />
                  }
                  label="Kelly Criterion 사용"
                />
                {config.useKellyCriterion && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Kelly Criterion은 과거 거래 성과를 기반으로 최적의 베팅 크기를 계산합니다.
                    </Typography>
                    <TextField
                      fullWidth
                      label="최대 Kelly 비율"
                      type="number"
                      value={(config.maxKellyFraction || 0.25) * 100}
                      onChange={(e) => handleChange('maxKellyFraction', parseFloat(e.target.value) / 100)}
                      InputProps={{ 
                        inputProps: { min: 5, max: 50, step: 5 },
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                      helperText="Kelly 계산값의 상한선 (권장: 10-25%)"
                      sx={{ mt: 2 }}
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* 최소 신뢰도 설정 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              최소 신뢰도 설정
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="매수 최소 신뢰도 (%)"
                  type="number"
                  value={config.minConfidenceForBuy}
                  onChange={(e) => handleChange('minConfidenceForBuy', parseInt(e.target.value))}
                  InputProps={{ 
                    inputProps: { min: 30, max: 95, step: 5 },
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                  helperText="이 신뢰도 이상일 때만 매수"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="매도 최소 신뢰도 (%)"
                  type="number"
                  value={config.minConfidenceForSell}
                  onChange={(e) => handleChange('minConfidenceForSell', parseInt(e.target.value))}
                  InputProps={{ 
                    inputProps: { min: 30, max: 95, step: 5 },
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                  helperText="이 신뢰도 이상일 때만 매도"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* 쿨다운 설정 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              쿨다운 설정
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="매수 쿨다운 (분)"
                  type="number"
                  value={config.buyingCooldown || 30}
                  onChange={(e) => handleChange('buyingCooldown', parseInt(e.target.value) || 0)}
                  InputProps={{ 
                    inputProps: { min: 0, max: 180, step: 5 },
                    endAdornment: <InputAdornment position="end">분</InputAdornment>
                  }}
                  helperText="매수 후 다음 매수까지 대기 시간"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="매도 쿨다운 (분)"
                  type="number"
                  value={config.sellingCooldown || 20}
                  onChange={(e) => handleChange('sellingCooldown', parseInt(e.target.value) || 0)}
                  InputProps={{ 
                    inputProps: { min: 0, max: 180, step: 5 },
                    endAdornment: <InputAdornment position="end">분</InputAdornment>
                  }}
                  helperText="매도 후 다음 매도까지 대기 시간"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* 스마트 주문 설정 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <TrendingUp color="primary" />
              <Typography variant="h6" fontWeight="bold">
                스마트 주문 설정
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  스마트 주문은 호가창 분석을 통해 시장가와 지정가를 자동으로 선택합니다.
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={(config as any).enableSmartOrder ?? true}
                      onChange={(e) => handleChange('enableSmartOrder' as any, e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography>스마트 주문 활성화</Typography>
                      <Typography variant="caption" color="text.secondary">
                        시장 상황에 따라 주문 타입 자동 선택
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* 트레일링 스톱 설정 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <TrendingDown color="error" />
              <Typography variant="h6" fontWeight="bold">
                트레일링 스톱 설정
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={(config as any).enableTrailingStop ?? false}
                      onChange={(e) => handleChange('enableTrailingStop' as any, e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography>트레일링 스톱 활성화</Typography>
                      <Typography variant="caption" color="text.secondary">
                        수익 보호를 위한 자동 손절선 조정
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              {(config as any).enableTrailingStop && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="트레일링 시작 수익률"
                      type="number"
                      value={(config as any).trailingStartPercent ?? 5}
                      onChange={(e) => handleChange('trailingStartPercent' as any, parseFloat(e.target.value) || 5)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 1, max: 20, step: 0.5 }
                      }}
                      helperText="트레일링 스톱이 활성화되는 수익률"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="트레일링 스톱 비율"
                      type="number"
                      value={(config as any).trailingStopPercent ?? 2}
                      onChange={(e) => handleChange('trailingStopPercent' as any, parseFloat(e.target.value) || 2)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0.5, max: 10, step: 0.5 }
                      }}
                      helperText="최고가 대비 하락 허용 비율"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

        {config.enableRealTrading && (
          <Grid item xs={12}>
            <Alert severity="warning">
              실제 거래가 활성화되어 있습니다. 실제 자금으로 거래가 진행되므로 주의하세요.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};