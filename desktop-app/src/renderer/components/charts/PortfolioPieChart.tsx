import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface PortfolioData {
  name: string;
  value: number;
  percentage: number;
}

interface PortfolioPieChartProps {
  data: PortfolioData[];
  title?: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#FFD93D'
];

const PortfolioPieChartComponent: React.FC<PortfolioPieChartProps> = ({ 
  data, 
  title = '포트폴리오 구성' 
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            {payload[0].name}
          </Typography>
          <Typography variant="body2">
            금액: {formatCurrency(payload[0].value)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            비중: {formatPercent(payload[0].payload.percentage)}
          </Typography>
        </Card>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    return entry.percentage > 5 ? `${entry.name} ${formatPercent(entry.percentage)}` : '';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={300}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value: string) => <span style={{ fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

// areEqual 함수로 props 비교 로직 추가
const areEqual = (prevProps: PortfolioPieChartProps, nextProps: PortfolioPieChartProps) => {
  // 제목이 변경되면 리렌더링
  if (prevProps.title !== nextProps.title) {
    return false;
  }
  
  // 데이터 배열의 길이가 다르면 리렌더링
  if (prevProps.data.length !== nextProps.data.length) {
    return false;
  }
  
  // 데이터 배열의 내용 비교 (얕은 비교)
  for (let i = 0; i < prevProps.data.length; i++) {
    const prev = prevProps.data[i];
    const next = nextProps.data[i];
    
    // 이름, 값, 비율 중 하나라도 다르면 리렌더링
    if (prev.name !== next.name || 
        prev.value !== next.value || 
        Math.abs(prev.percentage - next.percentage) > 0.01) { // 0.01% 이상 차이날 때만
      return false;
    }
  }
  
  return true;
};

export const PortfolioPieChart = React.memo(PortfolioPieChartComponent, areEqual);