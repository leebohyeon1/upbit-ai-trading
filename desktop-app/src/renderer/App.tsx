import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Grid
} from '@mui/material';
import { TradingProvider, useTradingContext } from './contexts/TradingContext';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './components/dashboard/Dashboard';
import { PortfolioManager } from './components/portfolio/PortfolioManager';
import { ApiKeySettings } from './components/settings/ApiKeySettings';
import { TradingSettings } from './components/settings/TradingSettings';
import { BacktestPanel } from './components/backtest/BacktestPanel';
import { MarketCorrelationPanel } from './components/market/MarketCorrelationPanel';
import { NewsAnalysisPanel } from './components/news/NewsAnalysisPanel';
import { AnalysisSettings } from './components/analysis/AnalysisSettings';
import { LearningStatus } from './components/learning/LearningStatus';
import { Analysis } from './types';
import { TAB_INDEX } from './constants';
import { formatAIReason, getDecisionText, getDecisionColor } from './utils/formatters';

// Material-UI 테마 설정
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Pretendard", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

const AppContent: React.FC = () => {
  const context = useTradingContext();
  const [activeTab, setActiveTab] = useState(TAB_INDEX.OVERVIEW);
  const [analysisDetailOpen, setAnalysisDetailOpen] = useState(false);
  const [selectedAnalysisDetail, setSelectedAnalysisDetail] = useState<Analysis | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      await context.fetchMarkets();
      await context.fetchAccounts();
      
      // 포트폴리오의 활성 코인들의 티커 정보 가져오기
      const enabledSymbols = context.portfolio
        .filter(coin => coin.enabled)
        .map(coin => `KRW-${coin.symbol}`);
      
      if (enabledSymbols.length > 0) {
        await context.fetchTickers(enabledSymbols);
      }
    };

    loadInitialData();
  }, []);

  // 주기적으로 티커 정보 업데이트
  useEffect(() => {
    const interval = setInterval(async () => {
      const enabledSymbols = context.portfolio
        .filter(coin => coin.enabled)
        .map(coin => `KRW-${coin.symbol}`);
      
      if (enabledSymbols.length > 0) {
        await context.fetchTickers(enabledSymbols);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [context.portfolio]);

  const handleAnalysisClick = (analysis: Analysis) => {
    setSelectedAnalysisDetail(analysis);
    setAnalysisDetailOpen(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case TAB_INDEX.OVERVIEW:
        return (
          <Dashboard 
            onTabChange={setActiveTab}
            onAnalysisClick={handleAnalysisClick}
          />
        );
      
      case TAB_INDEX.PORTFOLIO:
        return (
          <PortfolioManager
            portfolio={context.portfolio}
            accounts={context.accounts}
            tickers={context.tickers}
            onUpdatePortfolio={context.updatePortfolio}
          />
        );
      
      case TAB_INDEX.ANALYSIS:
        return <AnalysisSettings />;
      
      case TAB_INDEX.SETTINGS:
        return (
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              거래 설정
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ApiKeySettings
                  apiKeyStatus={context.apiKeyStatus}
                  onValidate={context.validateApiKey}
                />
              </Grid>
              <Grid item xs={12}>
                <TradingSettings
                  config={context.tradingConfig}
                  onChange={context.updateTradingConfig}
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      case TAB_INDEX.LEARNING:
        return <LearningStatus />;

      case TAB_INDEX.BACKTEST:
        return <BacktestPanel />;

      case TAB_INDEX.MARKET_CORRELATION:
        return <MarketCorrelationPanel />;

      case TAB_INDEX.NEWS:
        return <NewsAnalysisPanel />;
      
      default:
        return null;
    }
  };

  return (
    <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}

      {/* 분석 상세 정보 모달 */}
      <Dialog
        open={analysisDetailOpen}
        onClose={() => setAnalysisDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAnalysisDetail && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6">
                    {selectedAnalysisDetail.ticker?.replace('KRW-', '') || 'Unknown'} 분석 상세 정보
                  </Typography>
                  <Chip
                    label={getDecisionText(selectedAnalysisDetail.decision)}
                    color={getDecisionColor(selectedAnalysisDetail.decision) as any}
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {new Date(selectedAnalysisDetail.timestamp).toLocaleString('ko-KR')}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  신뢰도
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress
                    variant="determinate"
                    value={selectedAnalysisDetail.confidence * 100}
                    sx={{ flex: 1, height: 8, borderRadius: 1 }}
                  />
                  <Typography variant="body2" fontWeight="bold">
                    {(selectedAnalysisDetail.confidence * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Box>
              
              {context.tradingState.aiEnabled && selectedAnalysisDetail.reason && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    AI 분석 의견
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Typography 
                      variant="body1" 
                      component="div"
                      sx={{ 
                        lineHeight: 1.8,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {formatAIReason(selectedAnalysisDetail.reason, selectedAnalysisDetail.decision)}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  분석 기준
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">결정 유형</Typography>
                    <Typography variant="body2">{getDecisionText(selectedAnalysisDetail.decision)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">AI 모드</Typography>
                    <Typography variant="body2">{context.tradingState.aiEnabled ? '활성' : '비활성'}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setActiveTab(TAB_INDEX.ANALYSIS);
                setAnalysisDetailOpen(false);
              }}>
                분석 설정으로 이동
              </Button>
              <Button onClick={() => setAnalysisDetailOpen(false)} variant="contained">
                닫기
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </MainLayout>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TradingProvider>
        <AppContent />
      </TradingProvider>
    </ThemeProvider>
  );
}

export default App;