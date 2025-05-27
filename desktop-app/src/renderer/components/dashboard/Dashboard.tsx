import React, { useState, useEffect } from 'react';
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
  TimerOff
} from '@mui/icons-material';
import { useTradingContext } from '../../contexts/TradingContext';
import { StatCard } from '../common/StatCard';
import { AnalysisCard } from '../trading/AnalysisCard';
import { formatCurrency } from '../../utils/formatters';

interface DashboardProps {
  onTabChange: (tab: number) => void;
  onAnalysisClick: (analysis: any) => void;
}

interface CooldownInfo {
  [market: string]: {
    buyRemaining: number;
    sellRemaining: number;
    buyTotal: number;
    sellTotal: number;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({
  onTabChange,
  onAnalysisClick
}) => {
  const { 
    accounts, 
    portfolio, 
    analyses, 
    tradingState 
  } = useTradingContext();
  
  const [cooldowns, setCooldowns] = useState<CooldownInfo>({});

  // 쿨타임 정보 업데이트
  useEffect(() => {
    const updateCooldowns = async () => {
      const newCooldowns: CooldownInfo = {};
      
      const enabledCoins = portfolio && Array.isArray(portfolio) ? portfolio.filter(p => p.enabled) : [];
      for (const coin of enabledCoins) {
        const market = `KRW-${coin.symbol}`;
        try {
          if (window.electronAPI && window.electronAPI.getCooldownInfo) {
            const cooldownInfo = await window.electronAPI.getCooldownInfo(market);
            newCooldowns[market] = cooldownInfo;
          }
        } catch (error) {
          console.error(`Failed to get cooldown info for ${market}:`, error);
          // 기본값 설정
          newCooldowns[market] = {
            buyRemaining: 0,
            sellRemaining: 0,
            buyTotal: 30,
            sellTotal: 20
          };
        }
      }
      
      setCooldowns(newCooldowns);
    };

    // 초기 로드
    updateCooldowns();
    
    // 5초마다 업데이트
    const interval = setInterval(updateCooldowns, 1000);
    
    return () => clearInterval(interval);
  }, [portfolio]);

  // 계산된 통계
  const krwBalance = accounts.find(acc => acc.currency === 'KRW')?.balance || '0';
  const totalAssets = accounts.reduce((sum, acc) => {
    if (acc.currency === 'KRW') {
      return sum + parseFloat(acc.balance);
    }
    // TODO: 다른 자산의 KRW 환산 가치 계산
    return sum;
  }, 0);
  
  const activeCoins = portfolio && Array.isArray(portfolio) ? portfolio.filter(c => c.enabled).length : 0;
  const recentAnalyses = analyses.slice(0, 6);
  

  return (
    <Box sx={{ bgcolor: 'transparent' }}>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        대시보드
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        AI 기반 자동매매 시스템 현황을 한눈에 확인하세요
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<AttachMoney />}
            title="KRW 잔액"
            value={formatCurrency(krwBalance)}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<AccountBalance />}
            title="활성 코인"
            value={activeCoins}
            subtitle={`총 ${portfolio.length}개 중`}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Timeline />}
            title="분석 완료"
            value={analyses.length}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Psychology />}
            title="AI 상태"
            value={tradingState.aiEnabled ? '활성' : '비활성'}
            color={tradingState.aiEnabled ? 'primary' : 'grey'}
          />
        </Grid>
      </Grid>

      {/* Recent Analyses */}
      <Box mb={4} sx={{ bgcolor: 'transparent' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
          <Alert severity="info">
            아직 분석 결과가 없습니다. 자동매매를 시작하면 분석 결과가 표시됩니다.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {recentAnalyses.map((analysis, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <AnalysisCard
                  analysis={analysis}
                  onClick={() => onAnalysisClick(analysis)}
                  showAI={tradingState.aiEnabled}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Portfolio Summary */}
      <Box sx={{ bgcolor: 'transparent' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
          <Grid container spacing={2}>
            {portfolio && Array.isArray(portfolio) && portfolio
              .filter(p => p.enabled)
              .map((coin) => {
                const account = accounts.find(acc => acc.currency === coin.symbol);
                const hasHoldings = account && parseFloat(account.balance) > 0;
                const market = `KRW-${coin.symbol}`;
                const cooldownInfo = cooldowns[market];
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={coin.symbol}>
                    <Card>
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
                            <TrendingUp color="success" />
                          )}
                        </Box>
                        
                        {/* 쿨타임 정보 */}
                        {cooldownInfo && (
                          <Box sx={{ mt: 2 }}>
                            {/* 매수 쿨타임 */}
                            <Box sx={{ mb: 1 }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Timer sx={{ fontSize: 16 }} />
                                  <Typography variant="caption">매수 쿨타임</Typography>
                                </Box>
                                {cooldownInfo.buyRemaining > 0 ? (
                                  <Chip 
                                    size="small" 
                                    label={`${cooldownInfo.buyRemaining}분`} 
                                    color="warning"
                                  />
                                ) : (
                                  <Chip 
                                    size="small" 
                                    label="대기 중" 
                                    color="success"
                                    icon={<TimerOff sx={{ fontSize: 14 }} />}
                                  />
                                )}
                              </Box>
                              {cooldownInfo.buyRemaining > 0 && (
                                <LinearProgress 
                                  variant="determinate" 
                                  value={((cooldownInfo.buyTotal - cooldownInfo.buyRemaining) / cooldownInfo.buyTotal) * 100}
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                              )}
                            </Box>
                            
                            {/* 매도 쿨타임 */}
                            <Box>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Timer sx={{ fontSize: 16 }} />
                                  <Typography variant="caption">매도 쿨타임</Typography>
                                </Box>
                                {cooldownInfo.sellRemaining > 0 ? (
                                  <Chip 
                                    size="small" 
                                    label={`${cooldownInfo.sellRemaining}분`} 
                                    color="warning"
                                  />
                                ) : (
                                  <Chip 
                                    size="small" 
                                    label="대기 중" 
                                    color="success"
                                    icon={<TimerOff sx={{ fontSize: 14 }} />}
                                  />
                                )}
                              </Box>
                              {cooldownInfo.sellRemaining > 0 && (
                                <LinearProgress 
                                  variant="determinate" 
                                  value={((cooldownInfo.sellTotal - cooldownInfo.sellRemaining) / cooldownInfo.sellTotal) * 100}
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                              )}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        )}
      </Box>
    </Box>
  );
};