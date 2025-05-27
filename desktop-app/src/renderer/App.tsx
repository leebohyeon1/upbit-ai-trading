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
  Grid,
  CircularProgress
} from '@mui/material';
import { TradingProvider, useTradingContext } from './contexts/TradingContext';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './components/dashboard/Dashboard';
import { PortfolioManager } from './components/portfolio/PortfolioManager';
import { ApiKeySettings } from './components/settings/ApiKeySettings';
import { TradingSettings } from './components/settings/TradingSettings';
import { AnalysisSettings } from './components/analysis/AnalysisSettings';
import { LearningStatus } from './components/learning/LearningStatus';
import { BacktestPanel } from './components/backtest/BacktestPanel';
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
  
  // 탭 변경 시 스크롤 초기화
  const handleTabChange = (newTab: number) => {
    setActiveTab(newTab);
    // 탭 변경 후 스크롤 초기화
    setTimeout(() => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.scrollTop = 0;
      }
    }, 0);
  };

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      await context.fetchMarkets();
      await context.fetchAccounts();
    };

    loadInitialData();
  }, []);
  
  // 포트폴리오가 변경될 때마다 티커 정보 업데이트
  useEffect(() => {
    const updateTickers = async () => {
      // 모든 코인의 티커 정보 가져오기 (보유 여부와 관계없이)
      const allSymbols = context.portfolio
        .filter(coin => coin && coin.symbol)
        .map(coin => `KRW-${coin.symbol}`);
      
      // 보유 중인 코인도 포함
      const heldSymbols = context.accounts
        .filter(acc => acc.currency !== 'KRW' && parseFloat(acc.balance) > 0)
        .map(acc => `KRW-${acc.currency}`);
      
      // 중복 제거
      const uniqueSymbols = Array.from(new Set([...allSymbols, ...heldSymbols]));
      
      if (uniqueSymbols.length > 0) {
        await context.fetchTickers(uniqueSymbols);
      }
    };

    const interval = setInterval(updateTickers, 5000); // 5초마다 업데이트
    updateTickers(); // 즉시 실행

    return () => clearInterval(interval);
  }, [context.portfolio, context.accounts]);


  const handleAnalysisClick = (analysis: Analysis) => {
    setSelectedAnalysisDetail(analysis);
    setAnalysisDetailOpen(true);
  };

  const renderContent = () => {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: activeTab === TAB_INDEX.OVERVIEW ? 'block' : 'none' }}>
          <Dashboard 
            onTabChange={handleTabChange}
            onAnalysisClick={handleAnalysisClick}
          />
        </Box>
        
        <Box sx={{ display: activeTab === TAB_INDEX.PORTFOLIO ? 'block' : 'none' }}>
          <PortfolioManager
            portfolio={context.portfolio}
            accounts={context.accounts}
            tickers={context.tickers}
            onUpdatePortfolio={context.updatePortfolio}
          />
        </Box>
        
        <Box sx={{ display: activeTab === TAB_INDEX.ANALYSIS ? 'block' : 'none' }}>
          <AnalysisSettings />
        </Box>
        
        <Box sx={{ display: activeTab === TAB_INDEX.SETTINGS ? 'block' : 'none' }}>
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
        
        <Box sx={{ display: activeTab === TAB_INDEX.LEARNING ? 'block' : 'none' }}>
          <LearningStatus />
        </Box>
        
        <Box sx={{ display: activeTab === TAB_INDEX.BACKTEST ? 'block' : 'none' }}>
          <BacktestPanel />
        </Box>
      </Box>
    );
  };

  return (
    <MainLayout activeTab={activeTab} onTabChange={handleTabChange}>
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
                handleTabChange(TAB_INDEX.ANALYSIS);
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
        <React.Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>}>
          <AppContent />
        </React.Suspense>
      </TradingProvider>
    </ThemeProvider>
  );
}

export default App;