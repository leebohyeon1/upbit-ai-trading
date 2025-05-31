import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove as HoldIcon,
  Info as InfoIcon,
  Psychology,
  Warning,
  CheckCircle,
  Timer,
  AccountBalanceWallet,
  TrendingFlat
} from '@mui/icons-material';
import { Analysis, TradeFailureReasonMessages, TradeFailureReason } from '../../types';
import { formatTimeAgo, getDecisionColor, getDecisionText } from '../../utils/formatters';

interface AnalysisCardProps {
  analysis: Analysis;
  onClick: () => void;
  showAI?: boolean;
}

const getFailureIcon = (reason?: TradeFailureReason) => {
  switch (reason) {
    case TradeFailureReason.COOLDOWN_BUY:
    case TradeFailureReason.COOLDOWN_SELL:
      return <Timer sx={{ fontSize: 16, color: 'warning.main' }} />;
    case TradeFailureReason.INSUFFICIENT_BALANCE:
    case TradeFailureReason.MIN_ORDER_AMOUNT:
      return <AccountBalanceWallet sx={{ fontSize: 16, color: 'error.main' }} />;
    case TradeFailureReason.LOW_CONFIDENCE:
    case TradeFailureReason.VOLATILITY_TOO_HIGH:
      return <TrendingFlat sx={{ fontSize: 16, color: 'warning.main' }} />;
    default:
      return <Warning sx={{ fontSize: 16, color: 'error.main' }} />;
  }
};

const AnalysisCardComponent: React.FC<AnalysisCardProps> = ({
  analysis,
  onClick,
  showAI = false
}) => {
  const getDecisionIcon = () => {
    switch (analysis.decision?.toLowerCase()) {
      case 'buy':
        return <TrendingUp />;
      case 'sell':
        return <TrendingDown />;
      case 'hold':
        return <HoldIcon />;
      default:
        return undefined;
    }
  };

  return (
    <Card>
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" fontWeight="bold">
                {analysis.ticker?.replace('KRW-', '') || 'N/A'}
              </Typography>
              <Chip
                icon={getDecisionIcon()}
                label={getDecisionText(analysis.decision)}
                color={getDecisionColor(analysis.decision) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                size="small"
              />
              {showAI && analysis.reason && (
                <Tooltip title="AI 분석 포함">
                  <Psychology sx={{ fontSize: 20, color: 'primary.main' }} />
                </Tooltip>
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              {analysis.patterns && (analysis.patterns.candlePatterns.length > 0 || analysis.patterns.chartPatterns.length > 0) && (
                <Tooltip title="패턴 감지됨">
                  <Chip
                    label={`패턴 ${analysis.patterns.candlePatterns.length + analysis.patterns.chartPatterns.length}개`}
                    size="small"
                    sx={{ 
                      height: 20,
                      fontSize: '0.7rem',
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      color: 'warning.main'
                    }}
                  />
                </Tooltip>
              )}
              <Tooltip title="상세 정보">
                <InfoIcon 
                  fontSize="small" 
                  sx={{ 
                    color: 'action.disabled',
                    cursor: 'pointer'
                  }} 
                />
              </Tooltip>
            </Box>
          </Box>

          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                신뢰도
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {(analysis.confidence * 100).toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={analysis.confidence * 100}
              sx={{
                height: 6,
                borderRadius: 1,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1,
                  bgcolor: 
                    analysis.confidence >= 0.9 ? 'success.main' :
                    analysis.confidence >= 0.7 ? 'warning.main' :
                    'error.main'
                }
              }}
            />
          </Box>

          {analysis.reason && !showAI && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                mb: 1
              }}
            >
              {analysis.reason}
            </Typography>
          )}

          {/* 거래 시도 결과 표시 */}
          {analysis.tradeAttempt && (
            <Box mt={2}>
              {analysis.tradeAttempt.success ? (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" color="success.main">
                    거래 주문 성공
                  </Typography>
                </Box>
              ) : analysis.tradeAttempt.attempted && (
                <Box>
                  <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                    {getFailureIcon(analysis.tradeAttempt.failureReason as TradeFailureReason)}
                    <Typography variant="caption" color="error" fontWeight="bold">
                      {analysis.tradeAttempt.failureReason && 
                        TradeFailureReasonMessages[analysis.tradeAttempt.failureReason as TradeFailureReason]?.title || 
                        '거래 실패'
                      }
                    </Typography>
                  </Box>
                  {analysis.tradeAttempt.details && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2.5 }}>
                      {analysis.tradeAttempt.details}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export const AnalysisCard = React.memo(AnalysisCardComponent);