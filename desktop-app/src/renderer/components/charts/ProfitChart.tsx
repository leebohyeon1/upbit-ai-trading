import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import { formatPercent, formatCurrency } from '../../utils/formatters';

interface ProfitChartProps {
  data: Array<{
    time: string;
    profitRate: number;
    totalValue: number;
  }>;
  title?: string;
}

const ProfitChartComponent: React.FC<ProfitChartProps> = ({ data, title = '수익률 추이' }) => {
  const theme = useTheme();

  // 데이터 검증 및 기본값 처리
  const chartData = data && data.length > 0 ? data : [];
  
  console.log('[ProfitChart] Received data:', data);
  console.log('[ProfitChart] Chart data:', chartData);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1, minWidth: 150 }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2" color={payload[0].value >= 0 ? 'success.main' : 'error.main'}>
            수익률: {formatPercent(payload[0].value)}
          </Typography>
          {payload[1] && (
            <Typography variant="body2">
              총 자산: {formatCurrency(payload[1].value)}
            </Typography>
          )}
        </Card>
      );
    }
    return null;
  };

  // 데이터가 없는 경우 처리
  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ 
            width: '100%', 
            height: 300, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: theme.palette.grey[50]
          }}>
            <Typography variant="body2" color="text.secondary">
              수익률 데이터가 없습니다
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4caf50" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f44336" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f44336" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="time" 
                stroke={theme.palette.text.secondary}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke={theme.palette.divider} />
              <Area
                type="monotone"
                dataKey="profitRate"
                stroke={chartData.some(d => d.profitRate >= 0) ? "#4caf50" : "#f44336"}
                strokeWidth={2}
                fillOpacity={1}
                fill={chartData.some(d => d.profitRate >= 0) ? "url(#colorProfit)" : "url(#colorLoss)"}
                animationDuration={1000}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ProfitChart = React.memo(ProfitChartComponent);