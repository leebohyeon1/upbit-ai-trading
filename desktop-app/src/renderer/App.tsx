import React, { useState, useEffect } from 'react';
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
import { ThemeContextProvider } from './contexts/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './components/dashboard/Dashboard';
import { PortfolioManager } from './components/portfolio/PortfolioManager';
import { ApiKeySettings } from './components/settings/ApiKeySettings';
import { TradingSettings } from './components/settings/TradingSettings';
import { NotificationSettings } from './components/settings/NotificationSettings';
import { TwoFactorAuthSettings } from './components/settings/TwoFactorAuthSettings';
import { AnalysisSettings } from './components/analysis/AnalysisSettings';
import { MultiTimeframePanel } from './components/analysis/MultiTimeframePanel';
import { AdvancedIndicatorsPanel } from './components/analysis/AdvancedIndicatorsPanel';
import PatternRecognitionPanel from './components/analysis/PatternRecognitionPanel';
import { LearningStatus } from './components/learning/LearningStatus';
import { BacktestPanel } from './components/backtest/BacktestPanel';
import { SimulationStatus } from './components/trading/SimulationStatus';
import Documentation from './components/documentation/Documentation';
import KillSwitchPanel from './components/emergency/KillSwitchPanel';
import { Analysis } from './types';
import { TAB_INDEX } from './constants';
import { formatAIReason, getDecisionText, getDecisionColor } from './utils/formatters';
import { PageTransition } from './components/common/PageTransition';


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

    // 초기 업데이트 간격을 30초로 늘리고, 거래 활성화 시에만 빠르게 업데이트
    const updateInterval = context.tradingState.isRunning ? 10000 : 30000; // 거래 중: 10초, 대기 중: 30초
    const interval = setInterval(updateTickers, updateInterval);
    updateTickers(); // 즉시 실행

    return () => clearInterval(interval);
  }, [context.portfolio, context.accounts, context.tradingState.isRunning]);


  const handleAnalysisClick = (analysis: Analysis) => {
    console.log('[App] Analysis clicked:', analysis);
    console.log('[App] Analysis technicalIndicators:', analysis.technicalIndicators);
    console.log('[App] All analyses from context:', context.analyses);
    setSelectedAnalysisDetail(analysis);
    setAnalysisDetailOpen(true);
  };

  const renderContent = () => {
    const renderPage = () => {
      // 간소화 모드 사용 여부
      const useSimplifiedMode = context.tradingConfig?.simplifiedConfig?.enabled ?? true;
      
      // 간소화 모드에서 숨겨진 탭 접근 시 대시보드로 리다이렉트
      if (useSimplifiedMode) {
        const hiddenTabs = [TAB_INDEX.ANALYSIS, TAB_INDEX.ADVANCED_ANALYSIS, TAB_INDEX.LEARNING, TAB_INDEX.BACKTEST];
        if (hiddenTabs.includes(activeTab)) {
          setActiveTab(TAB_INDEX.OVERVIEW);
          return null;
        }
      }
      
      switch (activeTab) {
        case TAB_INDEX.OVERVIEW:
          return (
            <Dashboard 
              onTabChange={handleTabChange}
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
          return (
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, height: '100%', overflow: 'auto' }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                분석 설정
              </Typography>
              <AnalysisSettings />
            </Box>
          );
        case TAB_INDEX.SETTINGS:
          return (
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, height: '100%', overflow: 'auto' }}>
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
                <Grid item xs={12}>
                  <NotificationSettings />
                </Grid>
                <Grid item xs={12}>
                  <TwoFactorAuthSettings />
                </Grid>
              </Grid>
            </Box>
          );
        case TAB_INDEX.LEARNING:
          return <LearningStatus />;
        case TAB_INDEX.BACKTEST:
          return <BacktestPanel />;
        case TAB_INDEX.SIMULATION:
          return (
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                시뮬레이션 성과
              </Typography>
              <SimulationStatus />
            </Box>
          );
        case TAB_INDEX.ADVANCED_ANALYSIS:
          return (
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, height: '100%', overflow: 'auto' }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                고급 분석
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <MultiTimeframePanel />
                </Grid>
                <Grid item xs={12}>
                  <AdvancedIndicatorsPanel />
                </Grid>
                <Grid item xs={12}>
                  <PatternRecognitionPanel />
                </Grid>
              </Grid>
            </Box>
          );
        case TAB_INDEX.KILL_SWITCH:
          return (
            <Box sx={{ width: '100%', height: '100%' }}>
              <KillSwitchPanel />
            </Box>
          );
        case TAB_INDEX.DOCUMENTATION:
          return (
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%', height: '100%' }}>
              <Documentation />
            </Box>
          );
        default:
          return null;
      }
    };

    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}>
        <PageTransition pageKey={activeTab}>
          {renderPage()}
        </PageTransition>
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
              
              {/* 분석 결과 표시 (AI 활성화 여부에 관계없이) */}
              {(selectedAnalysisDetail.reason || selectedAnalysisDetail.signals) && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    {selectedAnalysisDetail.aiEnabled ? 'AI 분석 의견' : '분석 결과'}
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
                      {formatAIReason(selectedAnalysisDetail.reason, selectedAnalysisDetail.decision) || 
                       (selectedAnalysisDetail.signals ? '기술적 분석 결과를 확인해주세요.' : '분석 결과가 없습니다.')}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              {/* Python 스타일 개별 신호 표시 */}
              {selectedAnalysisDetail.signals && selectedAnalysisDetail.signals.length > 0 && (
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    개별 신호 분석 ({selectedAnalysisDetail.signals.length}개)
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Grid container spacing={1}>
                      {selectedAnalysisDetail.signals.map((signal, index) => (
                        <Grid item xs={12} key={index}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip 
                                label={signal.signal === 'buy' ? '매수' : signal.signal === 'sell' ? '매도' : '홀드'} 
                                size="small"
                                color={signal.signal === 'buy' ? 'success' : signal.signal === 'sell' ? 'error' : 'default'}
                              />
                              <Typography variant="body2">{signal.source}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="caption" color="text.secondary">
                                {signal.description}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {(signal.strength * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                  
                  {selectedAnalysisDetail.avgSignalStrength !== undefined && (
                    <Box mt={2} p={2} bgcolor="primary.50" borderRadius={1}>
                      <Typography variant="body2" color="primary.main">
                        평균 신호 강도: <strong>{selectedAnalysisDetail.avgSignalStrength.toFixed(3)}</strong>
                        {selectedAnalysisDetail.decision === 'buy' && ` > ${0.15} (매수 임계값)`}
                        {selectedAnalysisDetail.decision === 'sell' && ` < ${-0.2} (매도 임계값)`}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* 기술적 지표 요약 */}
              {selectedAnalysisDetail.interpretation && (
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    분석 요약
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>신호 강도:</strong> {selectedAnalysisDetail.interpretation.level}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>활성 신호:</strong> {selectedAnalysisDetail.interpretation.activeSignals}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>우세:</strong> {selectedAnalysisDetail.interpretation.dominance}
                    </Typography>
                    {selectedAnalysisDetail.interpretation.topReasons && (
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary">주요 근거:</Typography>
                        {selectedAnalysisDetail.interpretation.topReasons.map((reason, idx) => (
                          <Typography key={idx} variant="body2" sx={{ ml: 1 }}>
                            • {reason}
                          </Typography>
                        ))}
                      </Box>
                    )}
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
                    <Typography variant="body2">{selectedAnalysisDetail.aiEnabled ? '활성' : '비활성'}</Typography>
                  </Grid>
                  {/* AI가 비활성화되었을 때 기술적 분석 결과 표시 */}
                  {!selectedAnalysisDetail.aiEnabled && !selectedAnalysisDetail.reason && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">분석 방식</Typography>
                        <Typography variant="body2">기술적 지표 분석</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">신뢰도 기준</Typography>
                        <Typography variant="body2">
                          {selectedAnalysisDetail.decision === 'buy' ? '매수 60%' : '매도 70%'}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
                
                {/* 주요 지표 표시 (AI 모드 여부와 관계없이) */}
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">주요 분석 지표</Typography>
                  <Box mt={1}>
                    {(() => {
                      console.log('[App] Modal technicalIndicators:', selectedAnalysisDetail.technicalIndicators);
                      console.log('[App] Modal signals:', selectedAnalysisDetail.signals);
                      console.log('[App] Modal interpretation:', selectedAnalysisDetail.interpretation);
                      console.log('[App] Modal reason:', selectedAnalysisDetail.reason);
                      console.log('[App] Modal selectedAnalysisDetail full:', JSON.stringify(selectedAnalysisDetail, null, 2));
                      return null;
                    })()}
                    {selectedAnalysisDetail.technicalIndicators ? (
                      <>
                        {selectedAnalysisDetail.technicalIndicators.rsi !== undefined && (
                          <Typography variant="body2">
                            • RSI: {selectedAnalysisDetail.technicalIndicators.rsi.toFixed(1)} 
                            {selectedAnalysisDetail.technicalIndicators.rsi > 70 ? ' (과매수)' : 
                             selectedAnalysisDetail.technicalIndicators.rsi < 30 ? ' (과매도)' : ''}
                          </Typography>
                        )}
                        {selectedAnalysisDetail.technicalIndicators.macd && (
                          <Typography variant="body2">
                            • MACD: {selectedAnalysisDetail.technicalIndicators.macd.histogram.toFixed(3)} 
                            {selectedAnalysisDetail.technicalIndicators.macd.histogram > 0 ? ' (상승 신호)' : ' (하락 신호)'}
                          </Typography>
                        )}
                        {selectedAnalysisDetail.technicalIndicators.bollinger && (
                          <Typography variant="body2">
                            • 볼린저 밴드: 위치 {(selectedAnalysisDetail.technicalIndicators.bollinger.position * 100).toFixed(0)}% 
                            {selectedAnalysisDetail.technicalIndicators.bollinger.position > 0.8 ? ' (상단)' : 
                             selectedAnalysisDetail.technicalIndicators.bollinger.position < 0.2 ? ' (하단)' : ' (중간)'}
                          </Typography>
                        )}
                        {selectedAnalysisDetail.technicalIndicators.volume !== undefined && (
                          <Typography variant="body2">
                            • 거래량: 평균 대비 {(selectedAnalysisDetail.technicalIndicators.volume * 100).toFixed(0)}%
                          </Typography>
                        )}
                        {selectedAnalysisDetail.patterns && selectedAnalysisDetail.patterns.candlePatterns.length > 0 && (
                          <Typography variant="body2">
                            • 패턴: {selectedAnalysisDetail.patterns.candlePatterns.length}개 캔들 패턴 감지
                          </Typography>
                        )}
                      </>
                    ) : (
                      <>
                        <Typography variant="body2">• RSI (과매수/과매도)</Typography>
                        <Typography variant="body2">• MACD (추세 전환)</Typography>
                        <Typography variant="body2">• 볼린저 밴드 (변동성)</Typography>
                        <Typography variant="body2">• 거래량 분석</Typography>
                        <Typography variant="body2">• 패턴 인식</Typography>
                      </>
                    )}
                  </Box>
                </Box>
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
    <ThemeContextProvider>
      <CssBaseline />
      <TradingProvider>
        <React.Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>}>
          <AppContent />
        </React.Suspense>
      </TradingProvider>
    </ThemeContextProvider>
  );
}

export default App;