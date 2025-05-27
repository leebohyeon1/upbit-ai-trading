import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove as HoldIcon,
  Info as InfoIcon,
  Psychology
} from '@mui/icons-material';
import { Analysis } from '../../types';
import { formatTimeAgo, getDecisionColor, getDecisionText } from '../../utils/formatters';

interface AnalysisCardProps {
  analysis: Analysis;
  onClick: () => void;
  showAI?: boolean;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
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
                {analysis.ticker.replace('KRW-', '')}
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
            <Tooltip title="상세 정보">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {formatTimeAgo(analysis.timestamp)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              신뢰도: {(analysis.confidence * 100).toFixed(0)}%
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};