import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  LinearProgress,
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingUp,
  TrendingDown,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useTradingContext } from '../../contexts/TradingContext';

interface VaRData {
  dailyVaR95: number;
  dailyVaR99: number;
  weeklyVaR95: number;
  monthlyVaR95: number;
  percentageVaR95: number;
  percentageVaR99: number;
  methodology: string;
  confidence: number;
  calculatedAt: number;
}

interface StressTestResult {
  scenario: string;
  loss: number;
  percentage: number;
}

interface RiskReport {
  VaR: VaRData | null;
  CVaR: number;
  stressTest: StressTestResult[];
  recommendations: string[];
}

export const RiskManagementPanel: React.FC = () => {
  const { generateRiskReport } = useTradingContext();
  const [loading, setLoading] = useState(false);
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 리스크 리포트 가져오기
  const fetchRiskReport = async () => {
    setLoading(true);
    try {
      const report = await generateRiskReport();
      setRiskReport(report);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch risk report:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 리포트 가져오기
  useEffect(() => {
    fetchRiskReport();
    // 5분마다 자동 업데이트
    const interval = setInterval(fetchRiskReport, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // VaR 위험도에 따른 색상
  const getVaRColor = (percentage: number) => {
    if (percentage > 15) return 'error';
    if (percentage > 10) return 'warning';
    if (percentage > 5) return 'info';
    return 'success';
  };

  // VaR 위험도에 따른 진행률
  const getVaRProgress = (percentage: number) => {
    return Math.min(percentage * 5, 100); // 20%를 100%로 매핑
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* VaR 개요 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <AssessmentIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    포트폴리오 리스크 분석 (VaR)
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  {lastUpdate && (
                    <Typography variant="caption" color="text.secondary">
                      업데이트: {lastUpdate.toLocaleTimeString()}
                    </Typography>
                  )}
                  <IconButton onClick={fetchRiskReport} disabled={loading} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Box>
              </Box>

              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : riskReport?.VaR ? (
                <>
                  <Grid container spacing={3}>
                    {/* 일일 VaR */}
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          일일 VaR (95% 신뢰수준)
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color={getVaRColor(riskReport.VaR.percentageVaR95)}>
                          {riskReport.VaR.percentageVaR95.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ₩{riskReport.VaR.dailyVaR95.toLocaleString()}
                        </Typography>
                        <Box mt={1}>
                          <LinearProgress 
                            variant="determinate" 
                            value={getVaRProgress(riskReport.VaR.percentageVaR95)}
                            color={getVaRColor(riskReport.VaR.percentageVaR95)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      </Box>
                    </Grid>

                    {/* CVaR */}
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          CVaR (Expected Shortfall)
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="error">
                          ₩{riskReport.CVaR.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          최악의 5% 상황에서 평균 손실
                        </Typography>
                      </Box>
                    </Grid>

                    {/* 주간/월간 VaR */}
                    <Grid item xs={12}>
                      <Box display="flex" gap={4} mt={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            주간 VaR (95%)
                          </Typography>
                          <Typography variant="h6">
                            ₩{riskReport.VaR.weeklyVaR95.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            월간 VaR (95%)
                          </Typography>
                          <Typography variant="h6">
                            ₩{riskReport.VaR.monthlyVaR95.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            신뢰도
                          </Typography>
                          <Typography variant="h6">
                            {(riskReport.VaR.confidence * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* 권장사항 */}
                  {riskReport.recommendations.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        리스크 관리 권장사항
                      </Typography>
                      {riskReport.recommendations.map((rec, index) => (
                        <Alert key={index} severity="warning" sx={{ mt: 1 }}>
                          {rec}
                        </Alert>
                      ))}
                    </Box>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  리스크 분석을 위한 데이터가 부족합니다.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 스트레스 테스트 */}
        {riskReport?.stressTest && riskReport.stressTest.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <WarningIcon color="warning" />
                  <Typography variant="h6" fontWeight="bold">
                    스트레스 테스트 결과
                  </Typography>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>시나리오</TableCell>
                        <TableCell align="right">예상 손실액</TableCell>
                        <TableCell align="right">손실률</TableCell>
                        <TableCell align="center">위험도</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {riskReport.stressTest.map((test, index) => (
                        <TableRow key={index}>
                          <TableCell>{test.scenario}</TableCell>
                          <TableCell align="right">
                            ₩{test.loss.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {test.percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={
                                test.percentage > 40 ? '매우 높음' :
                                test.percentage > 30 ? '높음' :
                                test.percentage > 20 ? '중간' : '낮음'
                              }
                              color={
                                test.percentage > 40 ? 'error' :
                                test.percentage > 30 ? 'warning' :
                                'default'
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};