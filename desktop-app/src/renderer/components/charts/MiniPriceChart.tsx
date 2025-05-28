import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Box } from '@mui/material';

interface MiniPriceChartProps {
  data: Array<{ time: number; price: number }>;
  color?: string;
  height?: number;
}

export const MiniPriceChart: React.FC<MiniPriceChartProps> = ({ 
  data, 
  color = '#4caf50',
  height = 60 
}) => {
  // 가격 변화 방향에 따라 색상 결정
  const priceChange = data.length > 1 ? 
    data[data.length - 1].price - data[0].price : 0;
  const chartColor = priceChange >= 0 ? '#4caf50' : '#f44336';

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={color === '#4caf50' ? chartColor : color}
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};