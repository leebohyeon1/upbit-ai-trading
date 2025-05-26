import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert
} from '@mui/material';
import {
  AttachMoney,
  AccountBalance,
  Timeline,
  Psychology,
  TrendingUp,
  ShowChart
} from '@mui/icons-material';
import { useTradingContext } from '../../contexts/TradingContext';
import { StatCard } from '../common/StatCard';
import { AnalysisCard } from '../trading/AnalysisCard';
import { formatCurrency } from '../../utils/formatters';

interface DashboardProps {
  onTabChange: (tab: number) => void;
  onAnalysisClick: (analysis: any) => void;
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

  // 계산된 통계
  const krwBalance = accounts.find(acc => acc.currency === 'KRW')?.balance || '0';
  const totalAssets = accounts.reduce((sum, acc) => {
    if (acc.currency === 'KRW') {
      return sum + parseFloat(acc.balance);
    }
    // TODO: 다른 자산의 KRW 환산 가치 계산
    return sum;
  }, 0);
  
  const activeCoins = portfolio.filter(c => c.enabled).length;
  const recentAnalyses = analyses.slice(0, 6);

  return (
    <Box>
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
      <Box mb={4}>
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
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            포트폴리오 요약
          </Typography>
          <Button 
            size="small" 
            startIcon={<AccountBalance />}
            onClick={() => onTabChange(1)}
          >
            포트폴리오 관리
          </Button>
        </Box>

        {portfolio.filter(p => p.enabled).length === 0 ? (
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
            {portfolio
              .filter(p => p.enabled)
              .map((coin) => {
                const account = accounts.find(acc => acc.currency === coin.symbol);
                const hasHoldings = account && parseFloat(account.balance) > 0;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={coin.symbol}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
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