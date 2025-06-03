import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Chip,
  Divider,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Save,
  RestartAlt,
  Info,
  TrendingUp,
  Psychology,
  Settings
} from '@mui/icons-material';
import { useTradingContext } from '../../contexts/TradingContext';
import { AVAILABLE_COINS, DEFAULT_INDICATOR_WEIGHTS } from '../../constants';
import { WeightSettings } from './WeightSettings';
import { IndicatorWeights, WeightLearning } from '../../types';

interface CoinSettingsPanelProps {
  coin: string;
  symbol: string;
  settings: any;
  onSettingsChange: (coin: string, settings: any) => void;
}

const CoinSettingsPanel: React.FC<CoinSettingsPanelProps> = ({
  coin,
  symbol,
  settings,
  onSettingsChange
}) => {
  const [expanded, setExpanded] = useState(false);
  const [learningInfo, setLearningInfo] = useState<any>(null);
  const [localSettings, setLocalSettings] = useState({
    rsiOverbought: 70,
    rsiOversold: 30,
    minVolume: 0,
    minConfidenceForBuy: 60,
    minConfidenceForSell: 70,
    maxPositionSize: 100000,
    defaultBuyRatio: 0.1,
    defaultSellRatio: 0.5,
    buyCooldown: 60,
    sellCooldown: 30,
    stopLossPercent: 5,
    takeProfitPercent: 10,
    useKellyOptimization: false,
    volatilityAdjustment: false,
    newsImpactMultiplier: 1.0,
    usePythonStyle: false,
    indicatorWeights: DEFAULT_INDICATOR_WEIGHTS,
    weightLearning: {
      enabled: false,
      mode: 'individual' as const,
      minTrades: 50,
      adjustments: {},
      performance: {
        trades: 0,
        winRate: 0,
        avgProfit: 0,
        lastUpdated: Date.now()
      }
    },
    cooldownLearning: {
      enabled: false,
      minTrades: 30,
      winRateThreshold: 0.6,
      lastUpdate: null
    },
    ...settings
  });

  // 학습 정보 가져오기
  useEffect(() => {
    const fetchLearningInfo = async () => {
      try {
        const info = await (window as any).electronAPI.getWeightLearningInfo(`KRW-${coin}`);
        if (info) {
          setLearningInfo(info);
        }
      } catch (error) {
        console.error('Failed to fetch learning info:', error);
      }
    };

    if (expanded) {
      fetchLearningInfo();
      // 5초마다 업데이트
      const interval = setInterval(fetchLearningInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [expanded, coin]);

  // settings prop이 변경될 때 localSettings 업데이트
  useEffect(() => {
    setLocalSettings({
      rsiOverbought: settings.rsiOverbought || 70,
      rsiOversold: settings.rsiOversold || 30,
      minVolume: settings.minVolume || 0,
      minConfidenceForBuy: settings.minConfidenceForBuy || 60,
      minConfidenceForSell: settings.minConfidenceForSell || 70,
      maxPositionSize: settings.maxPositionSize || 100000,
      defaultBuyRatio: settings.defaultBuyRatio || 0.1,
      defaultSellRatio: settings.defaultSellRatio || 0.5,
      buyCooldown: settings.buyCooldown || 60,
      sellCooldown: settings.sellCooldown || 30,
      stopLossPercent: settings.stopLossPercent || 5,
      takeProfitPercent: settings.takeProfitPercent || 10,
      useKellyOptimization: settings.useKellyOptimization || false,
      volatilityAdjustment: settings.volatilityAdjustment || false,
      newsImpactMultiplier: settings.newsImpactMultiplier || 1.0,
      usePythonStyle: settings.usePythonStyle || false,
      indicatorWeights: settings.indicatorWeights || DEFAULT_INDICATOR_WEIGHTS,
      weightLearning: settings.weightLearning || {
        enabled: false,
        mode: 'individual',
        minTrades: 50,
        adjustments: {},
        performance: {
          trades: 0,
          winRate: 0,
          avgProfit: 0,
          lastUpdated: Date.now()
        }
      },
      cooldownLearning: settings.cooldownLearning || {
        enabled: false,
        minTrades: 30,
        winRateThreshold: 0.6,
        lastUpdate: null
      }
    });
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    const newSettings = { ...localSettings, [field]: value };
    setLocalSettings(newSettings);
    onSettingsChange(symbol, newSettings);
    console.log(`[${symbol}] Settings changed:`, field, value);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">{coin}</Typography>
            <Chip label={symbol} size="small" />
          </Box>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box mt={3}>
            <Grid container spacing={3}>
              {/* RSI 설정 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  RSI 설정
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    과매수 기준: {localSettings.rsiOverbought}
                  </Typography>
                  <Slider
                    value={localSettings.rsiOverbought || 70}
                    onChange={(e, value) => handleChange('rsiOverbought', value)}
                    min={60}
                    max={90}
                    marks
                    valueLabelDisplay="auto"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    과매도 기준: {localSettings.rsiOversold}
                  </Typography>
                  <Slider
                    value={localSettings.rsiOversold || 30}
                    onChange={(e, value) => handleChange('rsiOversold', value)}
                    min={10}
                    max={40}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Grid>

              {/* 신뢰도 설정 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  신뢰도 임계값
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    매수 최소 신뢰도: {localSettings.minConfidenceForBuy}%
                  </Typography>
                  <Slider
                    value={localSettings.minConfidenceForBuy || 60}
                    onChange={(e, value) => handleChange('minConfidenceForBuy', value)}
                    min={50}
                    max={95}
                    marks
                    valueLabelDisplay="auto"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    매도 최소 신뢰도: {localSettings.minConfidenceForSell}%
                  </Typography>
                  <Slider
                    value={localSettings.minConfidenceForSell || 70}
                    onChange={(e, value) => handleChange('minConfidenceForSell', value)}
                    min={50}
                    max={95}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Grid>

              {/* 포지션 크기 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  포지션 크기
                </Typography>
                <TextField
                  fullWidth
                  label="최대 투자 금액 (KRW)"
                  type="number"
                  value={localSettings.maxPositionSize || 100000}
                  onChange={(e) => handleChange('maxPositionSize', parseInt(e.target.value) || 0)}
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ px: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    기본 매수 비율: {((localSettings.defaultBuyRatio || 0.1) * 100).toFixed(0)}%
                    <Tooltip title="최대 투자 금액의 몇 %를 사용할지 설정합니다">
                      <Info sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />
                    </Tooltip>
                  </Typography>
                  <Slider
                    value={(localSettings.defaultBuyRatio || 0.1) * 100}
                    onChange={(e, value) => handleChange('defaultBuyRatio', value as number / 100)}
                    min={5}
                    max={100}
                    marks
                    valueLabelDisplay="auto"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    기본 매도 비율: {((localSettings.defaultSellRatio || 0.5) * 100).toFixed(0)}%
                    <Tooltip title="현재 보유 코인의 몇 %를 매도할지 설정합니다">
                      <Info sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />
                    </Tooltip>
                  </Typography>
                  <Slider
                    value={(localSettings.defaultSellRatio || 0.5) * 100}
                    onChange={(e, value) => handleChange('defaultSellRatio', value as number / 100)}
                    min={10}
                    max={100}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Grid>

              {/* 손익 설정 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  손익 설정
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    손절 기준: -{localSettings.stopLossPercent || 5}%
                  </Typography>
                  <Slider
                    value={localSettings.stopLossPercent || 5}
                    onChange={(e, value) => handleChange('stopLossPercent', value)}
                    min={1}
                    max={20}
                    marks
                    valueLabelDisplay="auto"
                    color="error"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    익절 기준: +{localSettings.takeProfitPercent || 10}%
                  </Typography>
                  <Slider
                    value={localSettings.takeProfitPercent || 10}
                    onChange={(e, value) => handleChange('takeProfitPercent', value)}
                    min={2}
                    max={30}
                    marks
                    valueLabelDisplay="auto"
                    color="success"
                  />
                </Box>
              </Grid>

              {/* 쿨다운 설정 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  쿨다운 설정 (분)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="매수 쿨다운"
                      type="number"
                      value={localSettings.buyCooldown || 60}
                      onChange={(e) => handleChange('buyCooldown', parseInt(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="매도 쿨다운"
                      type="number"
                      value={localSettings.sellCooldown || 30}
                      onChange={(e) => handleChange('sellCooldown', parseInt(e.target.value) || 0)}
                    />
                  </Grid>
                  {/* 쿨타임 학습 토글 */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.cooldownLearning?.enabled || false}
                          onChange={(e) => handleChange('cooldownLearning', {
                            ...(localSettings.cooldownLearning || {}),
                            enabled: e.target.checked
                          })}
                        />
                      }
                      label="쿨타임 자동 학습"
                    />
                    {localSettings.cooldownLearning?.enabled && (
                      <Box sx={{ mt: 1, pl: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          거래 성과에 따라 쿨타임을 자동으로 조정합니다.
                        </Typography>
                        {localSettings.cooldownLearning?.lastUpdate && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            마지막 업데이트: {new Date(localSettings.cooldownLearning.lastUpdate).toLocaleString('ko-KR')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Grid>

              {/* 특별 설정 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  특별 설정
                </Typography>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.useKellyOptimization || false}
                        onChange={(e) => handleChange('useKellyOptimization', e.target.checked)}
                      />
                    }
                    label="Kelly Criterion 사용"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.volatilityAdjustment || false}
                        onChange={(e) => handleChange('volatilityAdjustment', e.target.checked)}
                      />
                    }
                    label="변동성 자동 조정"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.enablePatternRecognition !== false}
                        onChange={(e) => handleChange('enablePatternRecognition', e.target.checked)}
                      />
                    }
                    label="패턴 인식 사용"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.usePythonStyle || false}
                        onChange={(e) => handleChange('usePythonStyle', e.target.checked)}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={0.5}>
                        Python 스타일 분석
                        <Tooltip title="이전 Python 프로젝트와 동일한 방식으로 기술적 지표를 분석합니다. 지표별 가중치와 신호 강도를 사용하여 매매 결정을 내립니다.">
                          <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                        </Tooltip>
                      </Box>
                    }
                  />
                </Box>
                {localSettings.enablePatternRecognition !== false && (
                  <Box sx={{ mt: 2, px: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      패턴 가중치: {((localSettings.patternWeight || 0.15) * 100).toFixed(0)}%
                    </Typography>
                    <Slider
                      value={(localSettings.patternWeight || 0.15) * 100}
                      onChange={(e, value) => handleChange('patternWeight', value as number / 100)}
                      min={0}
                      max={30}
                      marks
                      valueLabelDisplay="auto"
                    />
                    <Typography variant="caption" color="text.secondary">
                      캔들 패턴과 차트 패턴이 전체 신호에 미치는 영향도
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>

            {/* 지표 가중치 설정 */}
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <WeightSettings
                weights={localSettings.indicatorWeights || DEFAULT_INDICATOR_WEIGHTS}
                onChange={(weights) => handleChange('indicatorWeights', weights)}
                learning={learningInfo || localSettings.weightLearning || {
                  enabled: false,
                  mode: 'individual',
                  minTrades: 50,
                  adjustments: {},
                  performance: {
                    trades: 0,
                    winRate: 0,
                    avgProfit: 0,
                    lastUpdated: Date.now()
                  }
                }}
                onLearningChange={(learning) => {
                  console.log(`[${symbol}] Weight learning changed:`, learning);
                  handleChange('weightLearning', { ...learning, enabled: learning.enabled });
                }}
              />
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export const AnalysisSettings: React.FC = () => {
  const { portfolio, analysisConfigs, updateAnalysisConfigs } = useTradingContext();
  const [localConfigs, setLocalConfigs] = useState<any>({});
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [isInitialized, setIsInitialized] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  // 프리셋 정의
  const presets = {
    conservative: {
      name: '보수적',
      description: '낮은 리스크, 안정적인 수익 추구',
      settings: {
        rsiOverbought: 80,
        rsiOversold: 20,
        minConfidenceForBuy: 80,
        minConfidenceForSell: 70,
        defaultBuyRatio: 0.1,
        defaultSellRatio: 0.3,
        stopLossPercent: 3,
        takeProfitPercent: 5,
        buyCooldown: 60,
        sellCooldown: 40,
        maxPositionSize: 100000,
        minVolume: 200000000,
        volatilityAdjustment: true,
        useKellyOptimization: false,
        usePythonStyle: false,
        indicatorWeights: {
          ...DEFAULT_INDICATOR_WEIGHTS,
          rsi: 1.2,
          macd: 1.2,
          bollinger: 1.1,
          aiAnalysis: 0.8,
          newsImpact: 0.6
        },
        cooldownLearning: {
          enabled: false,
          minTrades: 30,
          winRateThreshold: 0.6,
          lastUpdate: null
        }
      }
    },
    balanced: {
      name: '균형',
      description: '리스크와 수익의 균형',
      settings: {
        rsiOverbought: 75,
        rsiOversold: 25,
        minConfidenceForBuy: 65,
        minConfidenceForSell: 60,
        defaultBuyRatio: 0.25,
        defaultSellRatio: 0.5,
        stopLossPercent: 5,
        takeProfitPercent: 10,
        buyCooldown: 35,
        sellCooldown: 25,
        maxPositionSize: 150000,
        minVolume: 100000000,
        volatilityAdjustment: true,
        useKellyOptimization: false,
        usePythonStyle: false,
        indicatorWeights: DEFAULT_INDICATOR_WEIGHTS,
        cooldownLearning: {
          enabled: false,
          minTrades: 30,
          winRateThreshold: 0.6,
          lastUpdate: null
        }
      }
    },
    aggressive: {
      name: '공격적',
      description: '높은 리스크, 높은 수익 추구',
      settings: {
        rsiOverbought: 70,
        rsiOversold: 30,
        minConfidenceForBuy: 55,
        minConfidenceForSell: 50,
        defaultBuyRatio: 0.4,
        defaultSellRatio: 0.7,
        stopLossPercent: 7,
        takeProfitPercent: 15,
        buyCooldown: 20,
        sellCooldown: 15,
        maxPositionSize: 200000,
        minVolume: 50000000,
        volatilityAdjustment: false,
        useKellyOptimization: true,
        usePythonStyle: true,
        indicatorWeights: {
          ...DEFAULT_INDICATOR_WEIGHTS,
          rsi: 0.8,
          macd: 0.8,
          volume: 1.5,
          aiAnalysis: 1.5,
          newsImpact: 1.3,
          whaleActivity: 1.2
        },
        cooldownLearning: {
          enabled: false,
          minTrades: 30,
          winRateThreshold: 0.6,
          lastUpdate: null
        }
      }
    }
  };

  // 초기 로드 시에만 실행
  useEffect(() => {
    if (!isInitialized && portfolio.length > 0) {
      const loadDefaultConfigs = async () => {
        try {
          // 저장된 설정 먼저 로드 시도
          console.log('[AnalysisSettings] Loading saved configs...');
          const savedConfigs = await (window as any).electronAPI.getAnalysisConfigs();
          console.log('[AnalysisSettings] Saved configs:', savedConfigs);
          
          if (savedConfigs && savedConfigs.length > 0) {
            const configMap: any = {};
            savedConfigs.forEach((config: any) => {
              const symbol = config.ticker.startsWith('KRW-') ? config.ticker.split('-')[1] : config.ticker;
              configMap[symbol] = config;
            });
            console.log('[AnalysisSettings] Config map:', configMap);
            setLocalConfigs(configMap);
            
            // Context에도 업데이트
            updateAnalysisConfigs(savedConfigs);
          } else if (analysisConfigs && analysisConfigs.length > 0) {
            // Context의 analysisConfigs가 있으면 사용
            const configMap: any = {};
            analysisConfigs.forEach((config: any) => {
              const symbol = config.ticker.startsWith('KRW-') ? config.ticker.split('-')[1] : config.ticker;
              configMap[symbol] = config;
            });
            setLocalConfigs(configMap);
          } else {
            // 기본값 설정
            const defaultConfigs: any = {};
            portfolio.filter(p => p.enabled).forEach(coin => {
              defaultConfigs[coin.symbol] = {
                ticker: `KRW-${coin.symbol}`,
                rsiOverbought: 75,
                rsiOversold: 25,
                minVolume: 100000000,
                minConfidenceForBuy: 65,
                minConfidenceForSell: 60,
                maxPositionSize: 150000,
                defaultBuyRatio: 0.25,
                defaultSellRatio: 0.5,
                buyCooldown: 35,
                sellCooldown: 25,
                stopLossPercent: 7,
                takeProfitPercent: 12,
                volatilityAdjustment: true,
                useKellyOptimization: false,
                newsImpactMultiplier: 1.0,
                usePythonStyle: false,
                indicatorWeights: DEFAULT_INDICATOR_WEIGHTS,
                weightLearning: {
                  enabled: false,
                  mode: 'individual' as const,
                  minTrades: 50,
                  adjustments: {},
                  performance: {
                    trades: 0,
                    winRate: 0,
                    avgProfit: 0,
                    lastUpdated: Date.now()
                  }
                },
                cooldownLearning: {
                  enabled: false,
                  minTrades: 30,
                  winRateThreshold: 0.6,
                  lastUpdate: null
                }
              };
            });
            setLocalConfigs(defaultConfigs);
          }
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to load analysis configs:', error);
        }
      };

      loadDefaultConfigs();
    }
  }, [isInitialized, portfolio.length]);

  // analysisConfigs가 변경될 때 localConfigs 업데이트 (외부에서 변경된 경우)
  useEffect(() => {
    if (isInitialized && analysisConfigs && analysisConfigs.length > 0) {
      const configMap: any = {};
      analysisConfigs.forEach((config: any) => {
        const symbol = config.ticker.startsWith('KRW-') ? config.ticker.split('-')[1] : config.ticker;
        configMap[symbol] = config;
      });
      
      // 현재 localConfigs와 다른 경우에만 업데이트
      const currentKeys = Object.keys(localConfigs);
      const newKeys = Object.keys(configMap);
      const isDifferent = currentKeys.length !== newKeys.length || 
        currentKeys.some(key => JSON.stringify(localConfigs[key]) !== JSON.stringify(configMap[key]));
      
      if (isDifferent) {
        setLocalConfigs(configMap);
      }
    }
  }, [analysisConfigs, isInitialized]);

  const handleSettingsChange = (coin: string, settings: any) => {
    const updatedConfigs = {
      ...localConfigs,
      [coin]: { 
        ...settings, 
        ticker: `KRW-${coin}`
      }
    };
    setLocalConfigs(updatedConfigs);
    
    // 자동 저장 (디바운스 처리를 위해 setTimeout 사용)
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const configArray = Object.values(updatedConfigs).map((config: any) => {
          // buying/selling 객체 제거하고 평탄화
          const { buying, selling, ...cleanConfig } = config;
          return cleanConfig;
        });
        console.log('[AnalysisSettings] Auto-saving configs:', configArray);
        await updateAnalysisConfigs(configArray);
        const saveResult = await (window as any).electronAPI.saveAnalysisConfigs(configArray);
        console.log('[AnalysisSettings] Save result:', saveResult);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 1000); // 1초 후 자동 저장
  };

  const handleApplyPreset = async () => {
    const preset = presets[selectedPreset as keyof typeof presets];
    const updatedConfigs = { ...localConfigs };
    
    Object.keys(updatedConfigs).forEach(coin => {
      updatedConfigs[coin] = {
        ...updatedConfigs[coin],
        ...preset.settings,
        ticker: updatedConfigs[coin].ticker // ticker는 유지
      };
    });
    
    setLocalConfigs(updatedConfigs);
    
    // 즉시 저장
    try {
      const configArray = Object.values(updatedConfigs).map((config: any) => {
        // buying/selling 객체 제거하고 평탄화
        const { buying, selling, ...cleanConfig } = config;
        return cleanConfig;
      });
      await updateAnalysisConfigs(configArray);
      await (window as any).electronAPI.saveAnalysisConfigs(configArray);
      
      setSaveMessage(`${preset.name} 프리셋이 적용되었습니다.`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to apply preset:', error);
      setSaveMessage('프리셋 적용에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    try {
      const configArray = Object.values(localConfigs).map((config: any) => {
        // buying/selling 객체 제거하고 평탄화
        const { buying, selling, ...cleanConfig } = config;
        return cleanConfig;
      });
      await updateAnalysisConfigs(configArray);
      await (window as any).electronAPI.saveAnalysisConfigs(configArray);
      
      setSaveMessage('설정이 저장되었습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save configs:', error);
      setSaveMessage('설정 저장에 실패했습니다.');
    }
  };

  const handleReset = async () => {
    // trading-config.ts의 기본값으로 리셋
    const defaultConfigs: any = {};
    portfolio.filter(p => p.enabled).forEach(coin => {
      defaultConfigs[coin.symbol] = {
        ticker: `KRW-${coin.symbol}`,
        rsiOverbought: 75,
        rsiOversold: 25,
        minVolume: 100000000,
        minConfidenceForBuy: 65,
        minConfidenceForSell: 60,
        maxPositionSize: 150000,
        defaultBuyRatio: 0.25,
        defaultSellRatio: 0.5,
        buyCooldown: 35,
        sellCooldown: 25,
        stopLossPercent: 7,
        takeProfitPercent: 12,
        volatilityAdjustment: true,
        useKellyOptimization: false,
        newsImpactMultiplier: 1.0,
        usePythonStyle: false,
        indicatorWeights: DEFAULT_INDICATOR_WEIGHTS,
        weightLearning: {
          enabled: false,
          mode: 'individual' as const,
          minTrades: 50,
          adjustments: {},
          performance: {
            trades: 0,
            winRate: 0,
            avgProfit: 0,
            lastUpdated: Date.now()
          }
        },
        cooldownLearning: {
          enabled: false,
          minTrades: 30,
          winRateThreshold: 0.6,
          lastUpdate: null
        }
      };
    });
    setLocalConfigs(defaultConfigs);
    
    // 즉시 저장
    try {
      const configArray = Object.values(defaultConfigs).map((config: any) => {
        // buying/selling 객체 제거하고 평탄화
        const { buying, selling, ...cleanConfig } = config;
        return cleanConfig;
      });
      await updateAnalysisConfigs(configArray);
      await (window as any).electronAPI.saveAnalysisConfigs(configArray);
      
      setSaveMessage('설정이 기본값으로 초기화되었습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to reset configs:', error);
      setSaveMessage('설정 초기화에 실패했습니다.');
    }
  };

  const enabledCoins = portfolio.filter(p => p.enabled);

  return (
    <Box sx={{ 
      flex: 1,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: { xs: 1, sm: 2, md: 3, lg: 4 },
      boxSizing: 'border-box',
      overflow: 'auto'
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          분석 설정
        </Typography>
      </Box>

      {/* 프리셋 선택 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            전략 프리셋
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>프리셋 선택</InputLabel>
                <Select
                  value={selectedPreset}
                  label="프리셋 선택"
                  onChange={(e) => setSelectedPreset(e.target.value)}
                >
                  {Object.entries(presets).map(([key, preset]) => (
                    <MenuItem key={key} value={key}>
                      {preset.name} - {preset.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleApplyPreset}
                startIcon={<Psychology />}
              >
                프리셋 적용
              </Button>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            프리셋을 적용한 후에도 각 코인별로 세부 설정을 조정할 수 있습니다.
          </Alert>
        </CardContent>
      </Card>

      {/* 코인별 설정 */}
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          코인별 상세 설정
        </Typography>
        
        {enabledCoins.length === 0 ? (
          <Alert severity="warning">
            포트폴리오에서 코인을 활성화해주세요.
          </Alert>
        ) : (
          enabledCoins.map(coin => (
            <CoinSettingsPanel
              key={coin.symbol}
              coin={coin.name}
              symbol={coin.symbol}
              settings={localConfigs[coin.symbol] || {}}
              onSettingsChange={handleSettingsChange}
            />
          ))
        )}
      </Box>

      {/* 저장 버튼 */}
      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<RestartAlt />}
          onClick={handleReset}
        >
          기본값으로 리셋
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
        >
          설정 저장
        </Button>
      </Box>

      {saveMessage && (
        <Alert 
          severity={saveMessage.includes('실패') ? 'error' : 'success'} 
          sx={{ mt: 2 }}
        >
          {saveMessage}
        </Alert>
      )}
    </Box>
  );
};