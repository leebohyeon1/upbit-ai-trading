import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardProps } from '@mui/material';

interface AnimatedCardProps extends CardProps {
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  delay = 0,
  ...cardProps 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ 
        y: -4,
        boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.12)"
      }}
      style={{ height: '100%' }}
    >
      <Card {...cardProps} sx={{ height: '100%', ...cardProps.sx }}>
        {children}
      </Card>
    </motion.div>
  );
};