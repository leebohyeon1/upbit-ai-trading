import React, { useEffect, useState } from 'react';
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
  ReferenceLine,
  ComposedChart,
  Bar,
  Cell
} from 'recharts';
import { Box, Card, CardContent, Typography, useTheme, ToggleButton, ToggleButtonGroup, CircularProgress } from '@mui/material';
import { formatPercent, formatCurrency } from '../../utils/formatters';
import { useTradingContext } from '../../contexts/TradingContext';

interface ProfitChartProps {
  data?: Array<{
    time: string;
    profitRate: number;
    totalValue: number;
  }>;
  title?: string;
  days?: number;
}

const ProfitChartComponent: React.FC<ProfitChartProps> = ({ data: propData, title = '수익률 추이', days = 30 }) => {
  const theme = useTheme();
  const { profitHistory, fetchProfitHistory } = useTradingContext();
  const [chartData, setChartData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'cumulative' | 'daily'>('cumulative');
  const [period, setPeriod] = useState(days);
  const [loading, setLoading] = useState(false);

  // 기간 변경 시 새로운 데이터 가져오기
  useEffect(() => {
    const loadProfitData = async () => {
      setLoading(true);
      try {
        const history = await window.electronAPI.getProfitHistory(period);
        if (history && history.length > 0) {
          setChartData(history);
        }
      } catch (error) {
        console.error('Failed to load profit history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfitData();
  }, [period]);

  // profitHistory 또는 propData 사용 및 일별 데이터 계산
  useEffect(() => {
    let data = profitHistory && profitHistory.length > 0 ? profitHistory : propData || [];
    
    if (data.length > 0) {
      // 일별 수익 계산
      const processedData = data.map((item, index) => {
        let dailyProfit = 0;
        if (index > 0) {
          // 이전 날 대비 수익
          dailyProfit = item.totalValue - data[index - 1].totalValue;
        }
        return {
          ...item,
          dailyProfit
        };
      });
      setChartData(processedData);
    }
  }, [profitHistory, propData]);
  
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

  // 로딩 중이거나 데이터가 없는 경우 처리
  if (loading || chartData.length === 0) {
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
            {loading ? (
              <CircularProgress size={40} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                수익률 데이터가 없습니다
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="cumulative">
                누적
              </ToggleButton>
              <ToggleButton value="daily">
                일별
              </ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={(e, value) => value && setPeriod(value)}
              size="small"
            >
              <ToggleButton value={7}>7일</ToggleButton>
              <ToggleButton value={30}>30일</ToggleButton>
              <ToggleButton value={90}>90일</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            {viewMode === 'cumulative' ? (
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
            ) : (
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="time" 
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label) => `날짜: ${label}`}
                />
                <ReferenceLine y={0} stroke={theme.palette.divider} />
                <Bar dataKey="dailyProfit" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.dailyProfit >= 0 ? '#4caf50' : '#f44336'} />
                  ))}
                </Bar>
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ProfitChart = React.memo(ProfitChartComponent);