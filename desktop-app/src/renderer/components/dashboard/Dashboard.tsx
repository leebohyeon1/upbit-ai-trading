import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  AttachMoney,
  AccountBalance,
  Timeline,
  Psychology,
  TrendingUp,
  ShowChart,
  Timer,
  TimerOff,
  RestartAlt,
  AutoMode
} from '@mui/icons-material';
import { useTradingContext } from '../../contexts/TradingContext';
import { StatCard } from '../common/StatCard';
import { AnalysisCard } from '../trading/AnalysisCard';
import { formatCurrency } from '../../utils/formatters';
import { ProfitChart } from '../charts/ProfitChart';
import { PortfolioPieChart } from '../charts/PortfolioPieChart';
import { AnimatedCard } from '../common/AnimatedCard';
import { LoadingAnimation } from '../common/LoadingAnimation';
import { RiskManagementPanel } from '../risk/RiskManagementPanel';
import PatternRecognitionPanel from '../analysis/PatternRecognitionPanel';

interface DashboardProps {
  onTabChange: (tab: number) => void;
  onAnalysisClick: (analysis: any) => void;
}

interface CooldownInfo {
  learningEnabled: boolean;
  dynamicBuyCooldown: number;
  dynamicSellCooldown: number;
  cooldownPerformance?: {
    consecutiveLosses: number;
    recentVolatility: number;
    lastUpdated: number;
  };
  buyRemaining: number;
  sellRemaining: number;
  buyTotal: number;
  sellTotal: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onTabChange,
  onAnalysisClick
}) => {
  const { 
    accounts, 
    portfolio, 
    analyses, 
    tradingState,
    tradingConfig,
    tickers,
    profitHistory,
    portfolioChartData
  } = useTradingContext();
  
  // 간소화 모드 사용 여부
  const useSimplifiedMode = tradingConfig?.simplifiedConfig?.enabled ?? true;
  
  const [tradeStats, setTradeStats] = useState<{
    totalTrades: number;
    winRate: number;
    totalProfit: number;
    todayProfit: number;
  }>({
    totalTrades: 0,
    winRate: 0,
    totalProfit: 0,
    todayProfit: 0
  });
  
  // 디버깅용 로그
  useEffect(() => {
    console.log('[Dashboard] profitHistory:', profitHistory);
    console.log('[Dashboard] profitHistory details:', JSON.stringify(profitHistory, null, 2));
    console.log('[Dashboard] portfolioChartData:', portfolioChartData);
  }, [profitHistory, portfolioChartData]);
  
  const [cooldowns, setCooldowns] = useState<Map<string, CooldownInfo>>(new Map());
  
  // 거래 통계 가져오기
  useEffect(() => {
    const fetchTradeStats = async () => {
      try {
        // 전체 통계 가져오기
        const stats = await window.electronAPI.getPerformanceStats(30); // 30일 통계
        
        // 오늘 통계 가져오기 (1일)
        const todayStats = await window.electronAPI.getPerformanceStats(1);
        
        setTradeStats({
          totalTrades: stats.totalTrades,
          winRate: stats.winRate,
          totalProfit: stats.totalProfit,
          todayProfit: todayStats.totalProfit
        });
      } catch (error) {
        console.error('Failed to fetch trade statistics:', error);
      }
    };
    
    fetchTradeStats();
    // 30초마다 업데이트
    const interval = setInterval(fetchTradeStats, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // 컴포넌트 마운트 시 스크롤 위치 초기화
  useEffect(() => {
    // MainLayout의 main 요소 찾기
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTop = 0;
    }
  }, []);

  // 쿨타임 정보 업데이트
  useEffect(() => {
    const updateCooldowns = async () => {
      const newCooldowns = new Map<string, CooldownInfo>();
      const enabledCoins = portfolio && Array.isArray(portfolio) ? portfolio.filter(p => p.enabled) : [];
      
      for (const coin of enabledCoins) {
        const market = `KRW-${coin.symbol}`;
        try {
          const cooldownInfo = await window.electronAPI.getCooldownInfo(market);
          console.log(`[Dashboard] Cooldown info for ${market}:`, cooldownInfo);
          newCooldowns.set(market, cooldownInfo);
        } catch (error) {
          console.error(`Failed to get cooldown info for ${market}:`, error);
        }
      }
      
      setCooldowns(newCooldowns);
    };
    
    // 초기 로드
    updateCooldowns();
    
    // 5초마다 업데이트
    const interval = setInterval(updateCooldowns, 5000);
    
    return () => clearInterval(interval);
  }, [portfolio]);

  // 계산된 통계
  const krwBalance = accounts.find(acc => acc.currency === 'KRW')?.balance || '0';
  
  // 총 자산 계산 (KRW + 코인 평가액)
  const totalAssets = useMemo(() => {
    let total = 0;
    
    // 디버깅 로그
    console.log('[Dashboard] Calculating totalAssets...');
    console.log('[Dashboard] accounts:', accounts);
    console.log('[Dashboard] tickers type:', Array.isArray(tickers) ? 'array' : typeof tickers);
    console.log('[Dashboard] tickers:', tickers);
    
    accounts.forEach(acc => {
      if (acc.currency === 'KRW') {
        const krwBalance = parseFloat(acc.balance);
        total += krwBalance;
        console.log(`[Dashboard] KRW balance: ${krwBalance}`);
      } else {
        // 코인의 현재가로 평가
        const market = `KRW-${acc.currency}`;
        // tickers가 배열인지 객체인지 확인하여 처리
        const ticker = Array.isArray(tickers) 
          ? tickers.find((t: any) => t.market === market)
          : Object.values(tickers).find((t: any) => t.market === market);
          
        if (ticker && parseFloat(acc.balance) > 0) {
          const coinValue = parseFloat(acc.balance) * (ticker as any).trade_price;
          total += coinValue;
          console.log(`[Dashboard] ${acc.currency}: balance=${acc.balance}, price=${(ticker as any).trade_price}, value=${coinValue}`);
        } else {
          console.log(`[Dashboard] No ticker found for ${market} or zero balance`);
        }
      }
    });
    
    console.log(`[Dashboard] Total assets: ${total}`);
    return total;
  }, [accounts, tickers]);
  
  const activeCoins = portfolio && Array.isArray(portfolio) ? portfolio.filter(c => c.enabled).length : 0;
  const recentAnalyses = analyses.slice(0, 6);
  
  // 차트 데이터는 이제 TradingContext에서 관리됨

  return (
    <Box sx={{ 
      flex: 1,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: { xs: 1, sm: 2, md: 3, lg: 4 },
      boxSizing: 'border-box',
      overflow: 'auto',
      '& > *': {
        width: '100%'
      }
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} sx={{ width: '100%' }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            대시보드
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI 기반 자동매매 시스템 현황을 한눈에 확인하세요
          </Typography>
        </Box>
        {!tradingConfig?.enableRealTrading && (
          <Button
            variant="outlined"
            startIcon={<RestartAlt />}
            onClick={async () => {
              if (window.confirm('시뮬레이션을 초기화하시겠습니까?\n모든 가상 거래 기록이 삭제되고 초기 자본 1천만원으로 리셋됩니다.')) {
                const success = await window.electronAPI.resetSimulation();
                if (success) {
                  window.location.reload(); // 페이지 새로고침으로 상태 업데이트
                }
              }
            }}
            sx={{ ml: 2 }}
          >
            시뮬레이션 초기화
          </Button>
        )}
        <Box textAlign="right">
          <Typography variant="caption" color="text.secondary">
            총 자산
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {formatCurrency(totalAssets)}
          </Typography>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<AttachMoney />}
            title="총 수익"
            value={formatCurrency(tradeStats.totalProfit)}
            subtitle={`오늘: ${formatCurrency(tradeStats.todayProfit)}`}
            color={tradeStats.totalProfit >= 0 ? 'success' : 'error'}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<ShowChart />}
            title="승률"
            value={`${tradeStats.winRate.toFixed(1)}%`}
            subtitle={`총 ${tradeStats.totalTrades}건`}
            color={tradeStats.winRate >= 50 ? 'success' : 'warning'}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<AccountBalance />}
            title="활성 코인"
            value={activeCoins}
            subtitle={`총 ${portfolio.length}개 중`}
            color="info"
          />
        </Grid>
        {!useSimplifiedMode && (
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              icon={<Psychology />}
              title="AI 상태"
              value={tradingConfig.useAI ? '활성' : '비활성'}
              color={tradingConfig.useAI ? 'primary' : 'grey'}
            />
          </Grid>
        )}
      </Grid>

      {/* Recent Analyses */}
      <Box mb={4} sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ width: '100%' }}>
          <Typography variant="h6" fontWeight="bold">
            최근 분석 결과
          </Typography>
          <Button 
            size="small" 
            startIcon={<ShowChart />}
            onClick={() => onTabChange(2)}
          >
            전체 보기
          </Button>
        </Box>

        {recentAnalyses.length === 0 ? (
          <Alert severity="info" sx={{ width: '100%' }}>
            아직 분석 결과가 없습니다. 자동매매를 시작하면 분석 결과가 표시됩니다.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ width: '100%' }}>
            {recentAnalyses.map((analysis, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <AnalysisCard
                  analysis={analysis}
                  onClick={() => onAnalysisClick(analysis)}
                  showAI={tradingConfig.useAI}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Portfolio Summary */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ width: '100%' }}>
          <Typography variant="h6" fontWeight="bold">
            포트폴리오 요약 (활성 코인: {activeCoins}개)
          </Typography>
          <Button 
            size="small" 
            startIcon={<AccountBalance />}
            onClick={() => onTabChange(1)}
          >
            포트폴리오 관리
          </Button>
        </Box>

        {activeCoins === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <AccountBalance sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                포트폴리오가 비어있습니다
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                포트폴리오 탭에서 코인을 추가하여 시작하세요
              </Typography>
              <Button variant="contained" onClick={() => onTabChange(1)}>
                코인 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2} sx={{ width: '100%' }}>
            {portfolio && Array.isArray(portfolio) && portfolio
              .filter(p => p.enabled)
              .map((coin) => {
                const account = accounts.find(acc => acc.currency === coin.symbol);
                const hasHoldings = account && parseFloat(account.balance) > 0;
                const market = `KRW-${coin.symbol}`;
                const cooldownInfo = cooldowns.get(market);
                console.log(`[Dashboard] Rendering cooldown for ${market}:`, cooldownInfo);
                const ticker = Object.values(tickers).find(t => t.market === market);
                
                // 수익률 계산
                let profitRate = 0;
                let profitAmount = 0;
                if (hasHoldings && account && ticker) {
                  const avgPrice = parseFloat(account.avg_buy_price || '0');
                  const currentPrice = ticker.trade_price;
                  const balance = parseFloat(account.balance);
                  
                  if (avgPrice > 0) {
                    profitRate = ((currentPrice - avgPrice) / avgPrice) * 100;
                    profitAmount = (currentPrice - avgPrice) * balance;
                  }
                }
                
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={coin.symbol}>
                    <AnimatedCard delay={portfolio.filter(p => p.enabled).indexOf(coin) * 0.1}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {coin.symbol}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {coin.name}
                            </Typography>
                          </Box>
                          {hasHoldings && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <TrendingUp color={profitRate >= 0 ? "success" : "error"} />
                              <Typography 
                                variant="body2" 
                                color={profitRate >= 0 ? "success.main" : "error.main"}
                                fontWeight="bold"
                              >
                                {profitRate.toFixed(2)}%
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        
                        {/* 보유 정보 */}
                        {hasHoldings && account && ticker && (
                          <Box sx={{ mb: 2 }}>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                평균 매수가
                              </Typography>
                              <Typography variant="caption">
                                {formatCurrency(account.avg_buy_price || '0')}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                현재가
                              </Typography>
                              <Typography variant="caption">
                                {formatCurrency(ticker.trade_price)}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="caption" color="text.secondary">
                                평가손익
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color={profitAmount >= 0 ? "success.main" : "error.main"}
                                fontWeight="bold"
                              >
                                {formatCurrency(profitAmount)}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        
                        
                        {/* 쿨타임 정보 */}
                        {cooldownInfo && (
                          <Box sx={{ mt: 2 }}>
                            {/* 학습된 쿨타임 적용 중 표시 */}
                            {cooldownInfo.learningEnabled && (
                              <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                                <AutoMode sx={{ fontSize: 16, color: 'info.main' }} />
                                <Typography variant="caption" color="info.main">
                                  학습된 쿨타임 적용중
                                </Typography>
                              </Box>
                            )}
                            
                            {/* 매수 쿨타임 */}
                            <Box sx={{ mb: 1 }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Timer sx={{ fontSize: 16 }} />
                                  <Typography variant="caption">
                                    매수 쿨타임
                                    {cooldownInfo.learningEnabled && cooldownInfo.dynamicBuyCooldown && (
                                      <Typography component="span" variant="caption" color="info.main" sx={{ ml: 0.5 }}>
                                        ({cooldownInfo.dynamicBuyCooldown}분)
                                      </Typography>
                                    )}
                                  </Typography>
                                </Box>
                                <Chip 
                                  size="small" 
                                  label={cooldownInfo.buyRemaining > 0 ? `${cooldownInfo.buyRemaining}분` : "대기 중"} 
                                  color={cooldownInfo.buyRemaining > 0 ? "warning" : "success"}
                                  icon={cooldownInfo.buyRemaining > 0 ? <Timer sx={{ fontSize: 14 }} /> : <TimerOff sx={{ fontSize: 14 }} />}
                                />
                              </Box>
                            </Box>
                            
                            {/* 매도 쿨타임 */}
                            <Box>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Timer sx={{ fontSize: 16 }} />
                                  <Typography variant="caption">
                                    매도 쿨타임
                                    {cooldownInfo.learningEnabled && cooldownInfo.dynamicSellCooldown && (
                                      <Typography component="span" variant="caption" color="info.main" sx={{ ml: 0.5 }}>
                                        ({cooldownInfo.dynamicSellCooldown}분)
                                      </Typography>
                                    )}
                                  </Typography>
                                </Box>
                                <Chip 
                                  size="small" 
                                  label={cooldownInfo.sellRemaining > 0 ? `${cooldownInfo.sellRemaining}분` : "대기 중"} 
                                  color={cooldownInfo.sellRemaining > 0 ? "warning" : "success"}
                                  icon={cooldownInfo.sellRemaining > 0 ? <Timer sx={{ fontSize: 14 }} /> : <TimerOff sx={{ fontSize: 14 }} />}
                                />
                              </Box>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </AnimatedCard>
                  </Grid>
                );
              })}
          </Grid>
        )}
      </Box>

      {/* 차트 섹션 */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          성과 분석
        </Typography>
        <Grid container spacing={3}>
          {/* 수익률 차트 */}
          <Grid item xs={12} md={8}>
            <ProfitChart data={profitHistory} />
          </Grid>
          
          {/* 포트폴리오 구성 차트 */}
          <Grid item xs={12} md={4}>
            {portfolioChartData.length > 0 ? (
              <PortfolioPieChart data={portfolioChartData} />
            ) : (
              <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    포트폴리오 데이터가 없습니다
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* 리스크 관리 섹션 - 간소화 모드에서는 숨김 */}
      {!useSimplifiedMode && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            리스크 관리
          </Typography>
          <RiskManagementPanel />
        </Box>
      )}

      {/* 패턴 인식 섹션 - 간소화 모드에서는 숨김 */}
      {!useSimplifiedMode && (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            패턴 분석
          </Typography>
          <Grid container spacing={3}>
            {analyses && analyses.length > 0 ? (
              analyses
                .filter(analysis => analysis.ticker && analysis.patterns && 
                        (analysis.patterns.candlePatterns.length > 0 || analysis.patterns.chartPatterns.length > 0))
                .slice(0, 3) // 상위 3개만 표시
                .map((analysis, index) => (
                  <Grid item xs={12} md={4} key={analysis.ticker}>
                    <AnimatedCard delay={index * 0.1}>
                      <PatternRecognitionPanel 
                        patterns={analysis.patterns} 
                        currentPrice={analysis.currentPrice}
                      />
                    </AnimatedCard>
                  </Grid>
                ))
            ) : (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" align="center">
                      패턴 분석 데이터가 없습니다
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Box>
  );
};