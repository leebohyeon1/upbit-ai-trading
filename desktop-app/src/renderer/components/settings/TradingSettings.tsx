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
  AttachMoney
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
  const handleChange = (field: keyof TradingConfig | string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      onChange({
        ...config,
        [parent]: {
          ...(config as any)[parent],
          [child]: value
        }
      });
    } else {
      onChange({
        ...config,
        [field]: value
      });
    }
  };

  return (
    <Grid container spacing={3}>
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
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>기본 매도 비율: {(config.sellRatio * 100).toFixed(0)}%</Typography>
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
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* AI 설정 */}
      <Grid item xs={12} md={6}>
        <Card>
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
                      label="AI 제공자"
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
      <Grid item xs={12} md={6}>
        <Card>
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
                />
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

      {config.enableRealTrading && (
        <Grid item xs={12}>
          <Alert severity="warning">
            실제 거래가 활성화되어 있습니다. 실제 자금으로 거래가 진행되므로 주의하세요.
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};