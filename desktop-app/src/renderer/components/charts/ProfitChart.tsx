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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1 }}>
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

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                stroke="#4caf50"
                fillOpacity={1}
                fill="url(#colorProfit)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ProfitChart = React.memo(ProfitChartComponent);