import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useElectronAPI } from '../../hooks/useElectronAPI';

interface TargetWeight {
  symbol: string;
  weight: number;
}

interface RebalancingConfig {
  enabled: boolean;
  interval: number; // hours
  threshold: number; // percentage
  minTradeAmount: number;
  targetWeights: TargetWeight[];
  useVaRConstraints: boolean;
  maxVaR: number;
}

interface PortfolioPosition {
  symbol: string;
  currentWeight: number;
  targetWeight: number;
  difference: number;
  value: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  amount?: number;
}

interface RebalancingHistory {
  timestamp: number;
  positions: PortfolioPosition[];
  totalValue: number;
  success: boolean;
}

export const AutoRebalancingPanel: React.FC = () => {
  const electronAPI = useElectronAPI();
  const [config, setConfig] = useState<RebalancingConfig>({
    enabled: false,
    interval: 24,
    threshold: 5,
    minTradeAmount: 50000,
    targetWeights: [],
    useVaRConstraints: true,
    maxVaR: 10
  });
  
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [lastRebalance, setLastRebalance] = useState<Date | null>(null);
  const [nextRebalance, setNextRebalance] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // 설정 불러오기
  useEffect(() => {
    loadRebalancingConfig();
    loadCurrentPositions();
  }, []);

  const loadRebalancingConfig = async () => {
    try {
      const savedConfig = await electronAPI.getRebalancingConfig();
      if (savedConfig) {
        setConfig(savedConfig);
      }
    } catch (error) {
      console.error('Failed to load rebalancing config:', error);
    }
  };

  const loadCurrentPositions = async () => {
    try {
      const portfolio = await electronAPI.getPortfolio();
      const totalValue = portfolio.reduce((sum, p) => sum + p.value, 0);
      
      const positionsWithWeights = portfolio.map(p => {
        const currentWeight = p.value / totalValue;
        const targetWeight = config.targetWeights.find(t => t.symbol === p.symbol)?.weight || 0;
        
        return {
          symbol: p.symbol,
          currentWeight,
          targetWeight,
          difference: currentWeight - targetWeight,
          value: p.value,
          action: currentWeight > targetWeight + config.threshold / 100 ? 'SELL' :
                  currentWeight < targetWeight - config.threshold / 100 ? 'BUY' : 'HOLD'
        } as PortfolioPosition;
      });
      
      setPositions(positionsWithWeights);
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  };

  // 설정 저장
  const saveConfig = async (newConfig: RebalancingConfig) => {
    try {
      await electronAPI.saveRebalancingConfig(newConfig);
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  // 수동 리밸런싱 실행
  const executeManualRebalancing = async () => {
    setLoading(true);
    try {
      const result = await electronAPI.executeRebalancing();
      if (result.success) {
        setLastRebalance(new Date());
        loadCurrentPositions();
      }
    } catch (error) {
      console.error('Rebalancing failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 리밸런싱 시뮬레이션
  const simulateRebalancing = async () => {
    setLoading(true);
    try {
      const simulation = await electronAPI.simulateRebalancing();
      setSimulationResult(simulation);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 목표 비중 편집
  const handleWeightEdit = (symbol: string, newWeight: number) => {
    const newWeights = [...config.targetWeights];
    const index = newWeights.findIndex(w => w.symbol === symbol);
    
    if (index >= 0) {
      newWeights[index].weight = newWeight / 100;
    } else {
      newWeights.push({ symbol, weight: newWeight / 100 });
    }
    
    const newConfig = { ...config, targetWeights: newWeights };
    saveConfig(newConfig);
  };

  // 리밸런싱 필요 여부 확인
  const needsRebalancing = positions.some(p => 
    Math.abs(p.difference) > config.threshold / 100
  );

  // 다음 리밸런싱 시간 계산
  useEffect(() => {
    if (lastRebalance && config.enabled) {
      const next = new Date(lastRebalance.getTime() + config.interval * 60 * 60 * 1000);
      setNextRebalance(next);
    }
  }, [lastRebalance, config.interval, config.enabled]);

  return (
    <Box>
      <Grid container spacing={3}>
        {/* 리밸런싱 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <AccountBalanceIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    포트폴리오 자동 리밸런싱
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enabled}
                        onChange={(e) => saveConfig({ ...config, enabled: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="자동 실행"
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditDialogOpen(true)}
                  >
                    설정
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="리밸런싱 주기"
                    type="number"
                    value={config.interval}
                    onChange={(e) => saveConfig({ ...config, interval: parseInt(e.target.value) || 24 })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">시간</InputAdornment>,
                      inputProps: { min: 1, max: 168 }
                    }}
                    disabled={!config.enabled}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="임계값"
                    type="number"
                    value={config.threshold}
                    onChange={(e) => saveConfig({ ...config, threshold: parseFloat(e.target.value) || 5 })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 1, max: 20, step: 0.5 }
                    }}
                    helperText="목표 대비 차이가 이 값을 초과하면 리밸런싱"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="최소 거래 금액"
                    type="number"
                    value={config.minTradeAmount}
                    onChange={(e) => saveConfig({ ...config, minTradeAmount: parseInt(e.target.value) || 50000 })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                      inputProps: { min: 10000, step: 10000 }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.useVaRConstraints}
                        onChange={(e) => saveConfig({ ...config, useVaRConstraints: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>VaR 제약 사용</Typography>
                        <Typography variant="caption" color="text.secondary">
                          리스크 한도 적용
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
              </Grid>

              {config.enabled && (
                <Box mt={2}>
                  <Alert severity="info" icon={<InfoIcon />}>
                    {nextRebalance ? (
                      <>다음 리밸런싱: {new Date(nextRebalance).toLocaleString()}</>
                    ) : (
                      <>리밸런싱 스케줄이 설정되지 않았습니다.</>
                    )}
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 현재 포트폴리오 상태 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  포트폴리오 현황
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={loadCurrentPositions}
                  >
                    새로고침
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={simulateRebalancing}
                    disabled={loading}
                  >
                    시뮬레이션
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PlayArrowIcon />}
                    onClick={executeManualRebalancing}
                    disabled={loading || !needsRebalancing}
                    color={needsRebalancing ? "primary" : "inherit"}
                  >
                    지금 리밸런싱
                  </Button>
                </Box>
              </Box>

              {needsRebalancing && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  리밸런싱이 필요합니다. 목표 비중과 {config.threshold}% 이상 차이가 있는 자산이 있습니다.
                </Alert>
              )}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>자산</TableCell>
                      <TableCell align="right">현재 비중</TableCell>
                      <TableCell align="right">목표 비중</TableCell>
                      <TableCell align="right">차이</TableCell>
                      <TableCell align="right">보유 금액</TableCell>
                      <TableCell align="center">필요 조치</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow key={position.symbol}>
                        <TableCell>{position.symbol.replace('KRW-', '')}</TableCell>
                        <TableCell align="right">
                          {(position.currentWeight * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end">
                            {(position.targetWeight * 100).toFixed(1)}%
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                // 목표 비중 편집
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            color={
                              Math.abs(position.difference) > config.threshold / 100 
                                ? 'error' 
                                : 'text.secondary'
                            }
                          >
                            {position.difference > 0 ? '+' : ''}
                            {(position.difference * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          ₩{position.value?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={position.action}
                            size="small"
                            color={
                              position.action === 'BUY' ? 'success' :
                              position.action === 'SELL' ? 'error' :
                              'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 리밸런싱 진행 상태 */}
              {loading && (
                <Box mt={2}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" mt={1}>
                    리밸런싱 진행 중...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 시뮬레이션 결과 */}
        {simulationResult && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  리밸런싱 시뮬레이션 결과
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Alert severity="info">
                      <Typography variant="subtitle2">예상 거래</Typography>
                      <Typography variant="body2">
                        매도: {simulationResult.sellOrders?.length || 0}건<br />
                        매수: {simulationResult.buyOrders?.length || 0}건
                      </Typography>
                    </Alert>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Alert severity="warning">
                      <Typography variant="subtitle2">예상 수수료</Typography>
                      <Typography variant="body2">
                        ₩{simulationResult.estimatedFees?.toLocaleString() || 0}
                      </Typography>
                    </Alert>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Alert severity="success">
                      <Typography variant="subtitle2">리밸런싱 후 VaR</Typography>
                      <Typography variant="body2">
                        {simulationResult.newVaR?.toFixed(2) || 0}%
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* 목표 비중 편집 다이얼로그 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>목표 포트폴리오 설정</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              각 자산의 목표 비중을 설정하세요. 총합은 100%가 되어야 합니다.
            </Typography>
            {/* 목표 비중 편집 UI */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={() => setEditDialogOpen(false)}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};