import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Button,
  CircularProgress,
  LinearProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Slider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  GridOn,
  TrendingUp,
  TrendingDown,
  PlayArrow,
  Stop,
  ExpandMore,
  Add,
  Edit,
  Delete,
  Settings,
  Timeline,
  BarChart,
  MonetizationOn,
  Warning,
  CheckCircle,
  Info,
  Refresh
} from '@mui/icons-material';
// import removed - not using electronAPI

interface GridConfig {
  symbol: string;
  enabled: boolean;
  centerPrice: number;
  gridSpacing: number;
  gridLevels: number;
  orderAmount: number;
  maxInvestment: number;
  takeProfitRatio: number;
  stopLossRatio: number;
  rebalanceInterval: number;
}

interface GridLevel {
  level: number;
  price: number;
  type: 'BUY' | 'SELL';
  isActive: boolean;
  orderId?: string;
  filledAt?: number;
  amount: number;
}

interface GridPosition {
  symbol: string;
  totalInvestment: number;
  totalValue: number;
  profitLoss: number;
  profitRate: number;
  coinBalance: number;
  avgBuyPrice: number;
  gridLevels: GridLevel[];
  activeOrders: number;
  completedTrades: number;
  lastRebalance: number;
}

interface GridTradingStatus {
  isEnabled: boolean;
  activeGrids: number;
  totalInvestment: number;
  totalValue: number;
  totalProfitLoss: number;
  positions: GridPosition[];
  performance: {
    totalTrades: number;
    successfulTrades: number;
    avgProfit: number;
    maxDrawdown: number;
    winRate: number;
  };
}

export const GridTradingPanel: React.FC = () => {
  // electronAPI removed - using mock data
  const [status, setStatus] = useState<GridTradingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<GridConfig | null>(null);
  const [newConfig, setNewConfig] = useState<Partial<GridConfig>>({
    symbol: 'KRW-BTC',
    enabled: false,
    centerPrice: 0,
    gridSpacing: 2,
    gridLevels: 5,
    orderAmount: 10000,
    maxInvestment: 100000,
    takeProfitRatio: 5,
    stopLossRatio: 10,
    rebalanceInterval: 60
  });

  const symbols = [
    'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOT',
    'KRW-LINK', 'KRW-LTC', 'KRW-BCH', 'KRW-SOL', 'KRW-AVAX'
  ];

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      // Grid Trading API가 없으므로 시뮬레이션 데이터 사용
      const mockStatus: GridTradingStatus = {
        isEnabled: false,
        activeGrids: 2,
        totalInvestment: 200000,
        totalValue: 215000,
        totalProfitLoss: 15000,
        positions: [
          {
            symbol: 'KRW-BTC',
            totalInvestment: 100000,
            totalValue: 110000,
            profitLoss: 10000,
            profitRate: 0.1,
            coinBalance: 0.0012,
            avgBuyPrice: 45000000,
            gridLevels: [],
            activeOrders: 3,
            completedTrades: 8,
            lastRebalance: Date.now() - 1800000
          },
          {
            symbol: 'KRW-ETH',
            totalInvestment: 100000,
            totalValue: 105000,
            profitLoss: 5000,
            profitRate: 0.05,
            coinBalance: 0.05,
            avgBuyPrice: 2800000,
            gridLevels: [],
            activeOrders: 2,
            completedTrades: 5,
            lastRebalance: Date.now() - 3600000
          }
        ],
        performance: {
          totalTrades: 13,
          successfulTrades: 11,
          avgProfit: 0.078,
          maxDrawdown: 0.03,
          winRate: 0.846
        }
      };
      setStatus(mockStatus);
    } catch (error) {
      console.error('Failed to load grid trading status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartStop = async () => {
    try {
      if (status?.isEnabled) {
        // Stop grid trading
        console.log('Grid trading stopped');
      } else {
        // Start grid trading
        console.log('Grid trading started');
      }
      await loadStatus();
    } catch (error) {
      console.error('Failed to toggle grid trading:', error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      console.log('Saving grid config:', newConfig);
      setConfigDialogOpen(false);
      await loadStatus();
    } catch (error) {
      console.error('Failed to save grid config:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  return (
    <Box>
      {/* 헤더 */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <GridOn color="primary" />
          <Typography variant="h5" fontWeight="bold">
            그리드 트레이딩
          </Typography>
          {status && (
            <Chip
              label={status.isEnabled ? '실행중' : '중지됨'}
              color={status.isEnabled ? 'success' : 'default'}
              icon={status.isEnabled ? <PlayArrow /> : <Stop />}
            />
          )}
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => {
              setSelectedConfig(null);
              setNewConfig({
                symbol: 'KRW-BTC',
                enabled: false,
                centerPrice: 0,
                gridSpacing: 2,
                gridLevels: 5,
                orderAmount: 10000,
                maxInvestment: 100000,
                takeProfitRatio: 5,
                stopLossRatio: 10,
                rebalanceInterval: 60
              });
              setConfigDialogOpen(true);
            }}
          >
            그리드 추가
          </Button>
          
          <Button
            variant="contained"
            startIcon={status?.isEnabled ? <Stop /> : <PlayArrow />}
            onClick={handleStartStop}
            color={status?.isEnabled ? 'error' : 'success'}
          >
            {status?.isEnabled ? '중지' : '시작'}
          </Button>
          
          <IconButton onClick={loadStatus} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {loading && (
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <CircularProgress size={24} />
          <Typography>그리드 트레이딩 상태 로딩 중...</Typography>
        </Box>
      )}

      {status && (
        <Grid container spacing={3}>
          {/* 전체 성과 카드 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  전체 성과
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        {status.activeGrids}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        활성 그리드
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="bold">
                        {formatPrice(status.totalInvestment)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        총 투자금액
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="bold">
                        {formatPrice(status.totalValue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        현재 가치
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Box textAlign="center">
                      <Typography 
                        variant="h4" 
                        fontWeight="bold"
                        color={status.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                      >
                        {status.totalProfitLoss >= 0 ? '+' : ''}{formatPrice(status.totalProfitLoss)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        손익
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">총 거래 수</Typography>
                    <Typography variant="h6">{status.performance.totalTrades}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">승률</Typography>
                    <Typography variant="h6" color="success.main">
                      {(status.performance.winRate * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">평균 수익률</Typography>
                    <Typography variant="h6" color="primary">
                      {(status.performance.avgProfit * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">최대 낙폭</Typography>
                    <Typography variant="h6" color="error">
                      -{(status.performance.maxDrawdown * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 포지션 목록 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  활성 포지션
                </Typography>
                
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>심볼</TableCell>
                        <TableCell align="right">투자금액</TableCell>
                        <TableCell align="right">현재가치</TableCell>
                        <TableCell align="right">손익</TableCell>
                        <TableCell align="right">수익률</TableCell>
                        <TableCell align="right">보유수량</TableCell>
                        <TableCell align="right">활성주문</TableCell>
                        <TableCell align="right">완료거래</TableCell>
                        <TableCell align="center">액션</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {status.positions.map((position) => (
                        <TableRow key={position.symbol}>
                          <TableCell>
                            <Chip 
                              label={position.symbol.replace('KRW-', '')} 
                              color="primary" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatPrice(position.totalInvestment)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPrice(position.totalValue)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              color={position.profitLoss >= 0 ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {position.profitLoss >= 0 ? '+' : ''}{formatPrice(position.profitLoss)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              color={position.profitRate >= 0 ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {position.profitRate >= 0 ? '+' : ''}{(position.profitRate * 100).toFixed(2)}%
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {position.coinBalance.toFixed(6)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={position.activeOrders} 
                              color={position.activeOrders > 0 ? 'success' : 'default'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell align="right">
                            {position.completedTrades}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="설정 편집">
                              <IconButton size="small">
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="그리드 제거">
                              <IconButton size="small" color="error">
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* 그리드 설정 가이드 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Info color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    그리드 트레이딩 가이드
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                      그리드 트레이딩이란?
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><GridOn fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="가격 구간을 격자로 나누어 자동 매매" 
                          secondary="정해진 간격으로 매수/매도 주문을 배치"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><TrendingUp fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="가격 하락 시 매수, 상승 시 매도" 
                          secondary="변동성을 이용한 수익 창출"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><MonetizationOn fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="소액 다수 거래로 안정적 수익" 
                          secondary="큰 상승/하락 없이도 수익 가능"
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="secondary">
                      주요 설정 가이드
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><BarChart fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="그리드 간격: 1-5%" 
                          secondary="변동성이 클수록 넓은 간격 추천"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Timeline fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="그리드 레벨: 3-10개" 
                          secondary="투자 금액과 리스크에 따라 조절"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Warning fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="리스크 관리 필수" 
                          secondary="손절선과 최대 투자 금액 설정"
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      )}

      {/* 그리드 설정 다이얼로그 */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedConfig ? '그리드 설정 편집' : '새 그리드 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="거래 심볼"
                value={newConfig.symbol || ''}
                onChange={(e) => setNewConfig({ ...newConfig, symbol: e.target.value })}
              >
                {symbols.map((symbol) => (
                  <MenuItem key={symbol} value={symbol}>
                    {symbol}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newConfig.enabled || false}
                    onChange={(e) => setNewConfig({ ...newConfig, enabled: e.target.checked })}
                  />
                }
                label="그리드 활성화"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="중심 가격 (0=현재가)"
                value={newConfig.centerPrice || 0}
                onChange={(e) => setNewConfig({ ...newConfig, centerPrice: Number(e.target.value) })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="주문 금액 (KRW)"
                value={newConfig.orderAmount || 10000}
                onChange={(e) => setNewConfig({ ...newConfig, orderAmount: Number(e.target.value) })}
                inputProps={{ min: 5000 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>
                그리드 간격: {newConfig.gridSpacing}%
              </Typography>
              <Slider
                value={newConfig.gridSpacing || 2}
                onChange={(e, value) => setNewConfig({ ...newConfig, gridSpacing: value as number })}
                min={0.1}
                max={10}
                step={0.1}
                marks={[
                  { value: 0.5, label: '0.5%' },
                  { value: 2, label: '2%' },
                  { value: 5, label: '5%' },
                  { value: 10, label: '10%' }
                ]}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>
                그리드 레벨: {newConfig.gridLevels}개 (위아래 각각)
              </Typography>
              <Slider
                value={newConfig.gridLevels || 5}
                onChange={(e, value) => setNewConfig({ ...newConfig, gridLevels: value as number })}
                min={1}
                max={20}
                step={1}
                marks={[
                  { value: 3, label: '3' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                  { value: 20, label: '20' }
                ]}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="최대 투자 금액 (KRW)"
                value={newConfig.maxInvestment || 100000}
                onChange={(e) => setNewConfig({ ...newConfig, maxInvestment: Number(e.target.value) })}
                inputProps={{ min: 10000 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="리밸런스 간격 (분)"
                value={newConfig.rebalanceInterval || 60}
                onChange={(e) => setNewConfig({ ...newConfig, rebalanceInterval: Number(e.target.value) })}
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSaveConfig} variant="contained">
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};