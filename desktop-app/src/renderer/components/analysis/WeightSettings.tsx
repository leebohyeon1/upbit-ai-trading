import React, { useState } from 'react';
import {
  Box,
  Typography,
  Slider,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  ButtonGroup,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Paper,
  Alert
} from '@mui/material';
import {
  ExpandMore,
  Info,
  RestartAlt,
  Psychology,
  ShowChart,
  TrendingUp,
  VolumeUp
} from '@mui/icons-material';
import { IndicatorWeights, WeightLearning } from '../../types';
import { DEFAULT_INDICATOR_WEIGHTS, WEIGHT_PRESETS } from '../../constants';

interface WeightSettingsProps {
  weights: IndicatorWeights;
  onChange: (weights: IndicatorWeights) => void;
  learning?: WeightLearning;
  onLearningChange?: (learning: WeightLearning) => void;
}

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  learningAdjustment?: number;
  icon?: React.ReactNode;
  description?: string;
}

const WeightSlider: React.FC<WeightSliderProps> = ({
  label,
  value,
  onChange,
  learningAdjustment = 1.0,
  icon,
  description
}) => {
  const finalValue = value * learningAdjustment;
  const percentChange = ((learningAdjustment - 1) * 100).toFixed(0);
  
  return (
    <Box sx={{ mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          {icon}
          <Typography variant="body2" fontWeight="medium">
            {label}
          </Typography>
          {description && (
            <Tooltip title={description}>
              <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          )}
        </Box>
        <Box display="flex" gap={1}>
          <Chip
            label={`설정: ${value.toFixed(1)}`}
            size="small"
            variant="outlined"
          />
          {learningAdjustment !== 1.0 && (
            <Chip
              label={`학습: ${parseInt(percentChange) > 0 ? '+' : ''}${percentChange}%`}
              size="small"
              color={learningAdjustment > 1 ? 'success' : 'error'}
              variant="outlined"
            />
          )}
          <Chip
            label={`최종: ${finalValue.toFixed(2)}`}
            size="small"
            color="primary"
          />
        </Box>
      </Box>
      <Slider
        value={value}
        onChange={(_, newValue) => onChange(newValue as number)}
        min={0}
        max={2}
        step={0.1}
        marks={[
          { value: 0, label: '0' },
          { value: 1, label: '1' },
          { value: 2, label: '2' }
        ]}
        valueLabelDisplay="auto"
        sx={{
          '& .MuiSlider-thumb': {
            width: 16,
            height: 16
          }
        }}
      />
    </Box>
  );
};

export const WeightSettings: React.FC<WeightSettingsProps> = ({
  weights,
  onChange,
  learning,
  onLearningChange
}) => {
  const [expanded, setExpanded] = useState<string | false>('technical');

  const handlePresetSelect = (presetKey: keyof typeof WEIGHT_PRESETS) => {
    const preset = WEIGHT_PRESETS[presetKey];
    onChange(preset.weights);
  };

  const handleReset = () => {
    onChange(DEFAULT_INDICATOR_WEIGHTS);
  };

  const handleWeightChange = (key: keyof IndicatorWeights, value: number) => {
    onChange({
      ...weights,
      [key]: value
    });
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">지표 가중치 설정</Typography>
          <Box display="flex" gap={1}>
            <ButtonGroup size="small" variant="outlined">
              {Object.entries(WEIGHT_PRESETS).map(([key, preset]) => (
                <Tooltip key={key} title={preset.description}>
                  <Button
                    onClick={() => handlePresetSelect(key as keyof typeof WEIGHT_PRESETS)}
                  >
                    {preset.name}
                  </Button>
                </Tooltip>
              ))}
            </ButtonGroup>
            <IconButton
              size="small"
              onClick={handleReset}
              color="default"
            >
              <RestartAlt />
            </IconButton>
          </Box>
        </Box>

        {learning && onLearningChange && (
          <Box mb={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={learning.enabled}
                  onChange={(e) => onLearningChange({
                    ...learning,
                    enabled: e.target.checked
                  })}
                />
              }
              label="가중치 자동 조정 활성화"
            />
            {learning.enabled && learning.performance && (
              <Box mt={1}>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      거래 횟수
                    </Typography>
                    <Typography variant="body2">
                      {learning.performance.trades}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      승률
                    </Typography>
                    <Typography variant="body2">
                      {(learning.performance.winRate * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      평균 수익
                    </Typography>
                    <Typography variant="body2">
                      {learning.performance.avgProfit.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      학습 모드
                    </Typography>
                    <Typography variant="body2">
                      {learning.mode === 'individual' ? '개별' :
                       learning.mode === 'category' ? '카테고리' : '전체'}
                    </Typography>
                  </Grid>
                </Grid>
                {learning.performance.trades < learning.minTrades && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    최소 {learning.minTrades}번의 거래가 필요합니다. 
                    현재 {learning.performance.trades}번 거래 완료.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </Paper>

      <Accordion
        expanded={expanded === 'technical'}
        onChange={handleAccordionChange('technical')}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <ShowChart color="primary" />
            <Typography>기술적 지표</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <WeightSlider
            label="RSI"
            value={weights.rsi}
            onChange={(v) => handleWeightChange('rsi', v)}
            learningAdjustment={learning?.adjustments?.rsi || 1.0}
            description="상대강도지수 - 과매수/과매도 판단"
          />
          <WeightSlider
            label="MACD"
            value={weights.macd}
            onChange={(v) => handleWeightChange('macd', v)}
            learningAdjustment={learning?.adjustments?.macd || 1.0}
            description="이동평균수렴확산 - 추세 전환 신호"
          />
          <WeightSlider
            label="볼린저 밴드"
            value={weights.bollinger}
            onChange={(v) => handleWeightChange('bollinger', v)}
            learningAdjustment={learning?.adjustments?.bollinger || 1.0}
            description="가격 변동성과 지지/저항 수준"
          />
          <WeightSlider
            label="스토캐스틱"
            value={weights.stochastic}
            onChange={(v) => handleWeightChange('stochastic', v)}
            learningAdjustment={learning?.adjustments?.stochastic || 1.0}
            description="단기 과매수/과매도 지표"
          />
          <WeightSlider
            label="ATR"
            value={weights.atr}
            onChange={(v) => handleWeightChange('atr', v)}
            learningAdjustment={learning?.adjustments?.atr || 1.0}
            description="평균진폭 - 변동성 측정"
          />
          <WeightSlider
            label="ADX"
            value={weights.adx}
            onChange={(v) => handleWeightChange('adx', v)}
            learningAdjustment={learning?.adjustments?.adx || 1.0}
            description="추세 강도 지표"
          />
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'market'}
        onChange={handleAccordionChange('market')}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUp color="primary" />
            <Typography>시장 지표</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <WeightSlider
            label="거래량"
            value={weights.volume}
            onChange={(v) => handleWeightChange('volume', v)}
            learningAdjustment={learning?.adjustments?.volume || 1.0}
            icon={<VolumeUp sx={{ fontSize: 20 }} />}
            description="거래량 변화 - 관심도 지표"
          />
          <WeightSlider
            label="OBV"
            value={weights.obv}
            onChange={(v) => handleWeightChange('obv', v)}
            learningAdjustment={learning?.adjustments?.obv || 1.0}
            description="누적거래량 - 매집/분산 판단"
          />
          <WeightSlider
            label="변동성"
            value={weights.volatility}
            onChange={(v) => handleWeightChange('volatility', v)}
            learningAdjustment={learning?.adjustments?.volatility || 1.0}
            description="가격 변동성 수준"
          />
          <WeightSlider
            label="추세 강도"
            value={weights.trendStrength}
            onChange={(v) => handleWeightChange('trendStrength', v)}
            learningAdjustment={learning?.adjustments?.trendStrength || 1.0}
            description="현재 추세의 강도"
          />
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'external'}
        onChange={handleAccordionChange('external')}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <Psychology color="primary" />
            <Typography>외부 요인</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <WeightSlider
            label="AI 분석"
            value={weights.aiAnalysis}
            onChange={(v) => handleWeightChange('aiAnalysis', v)}
            learningAdjustment={learning?.adjustments?.aiAnalysis || 1.0}
            description="Claude AI의 종합 분석"
          />
          <WeightSlider
            label="뉴스 영향"
            value={weights.newsImpact}
            onChange={(v) => handleWeightChange('newsImpact', v)}
            learningAdjustment={learning?.adjustments?.newsImpact || 1.0}
            description="뉴스 감정 분석 결과"
          />
          <WeightSlider
            label="고래 활동"
            value={weights.whaleActivity}
            onChange={(v) => handleWeightChange('whaleActivity', v)}
            learningAdjustment={learning?.adjustments?.whaleActivity || 1.0}
            description="대량 거래 감지"
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};