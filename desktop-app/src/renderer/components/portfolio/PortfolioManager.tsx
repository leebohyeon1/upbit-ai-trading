import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  Box,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  TrendingUp,
  TrendingDown,
  AccountBalance
} from '@mui/icons-material';
import { PortfolioCoin, Account, TickerData } from '../../types';
import { AVAILABLE_COINS } from '../../constants';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface PortfolioManagerProps {
  portfolio: PortfolioCoin[];
  accounts: Account[];
  tickers: TickerData[];
  onUpdatePortfolio: (portfolio: PortfolioCoin[]) => void;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  portfolio,
  accounts,
  tickers,
  onUpdatePortfolio
}) => {
  const [showOnlyHoldings, setShowOnlyHoldings] = useState(false);

  const handleAddCoin = (coin: { symbol: string; name: string }) => {
    const newPortfolio = [...portfolio];
    const existingIndex = newPortfolio.findIndex(p => p.symbol === coin.symbol);
    
    if (existingIndex >= 0) {
      newPortfolio[existingIndex].enabled = true;
    } else {
      newPortfolio.push({ ...coin, enabled: true });
    }
    
    onUpdatePortfolio(newPortfolio);
  };

  const handleRemoveCoin = (symbol: string) => {
    const newPortfolio = portfolio.map(coin => 
      coin.symbol === symbol ? { ...coin, enabled: false } : coin
    );
    onUpdatePortfolio(newPortfolio);
  };

  const handleToggleCoin = (symbol: string) => {
    const newPortfolio = portfolio.map(coin => 
      coin.symbol === symbol ? { ...coin, enabled: !coin.enabled } : coin
    );
    onUpdatePortfolio(newPortfolio);
  };

  const getAccountInfo = (symbol: string) => {
    const account = accounts.find(acc => acc.currency === symbol);
    const ticker = tickers.find(t => t.market === `KRW-${symbol}`);
    
    if (!account || parseFloat(account.balance) === 0) return null;
    
    const holdings = parseFloat(account.balance);
    const avgBuyPrice = parseFloat(account.avg_buy_price);
    const currentPrice = ticker?.trade_price || 0;
    const totalValue = holdings * currentPrice;
    const totalCost = holdings * avgBuyPrice;
    const profitLoss = totalValue - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
    
    return {
      holdings: holdings.toFixed(8),
      avgBuyPrice: avgBuyPrice.toFixed(0),
      currentPrice: currentPrice.toFixed(0),
      profitLoss: profitLoss.toFixed(0),
      profitLossPercent: profitLossPercent.toFixed(2),
      totalValue
    };
  };

  const availableToAdd = AVAILABLE_COINS.filter(
    coin => !portfolio.some(p => p.symbol === coin.symbol && p.enabled)
  );

  const displayCoins = showOnlyHoldings 
    ? AVAILABLE_COINS.filter(coin => {
        const account = accounts.find(acc => acc.currency === coin.symbol);
        return account && parseFloat(account.balance) > 0;
      })
    : AVAILABLE_COINS;

  return (
    <Box sx={{ 
      flex: 1,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: { xs: 1, sm: 2, md: 3, lg: 4 },
      boxSizing: 'border-box',
      overflow: 'auto'
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          포트폴리오 관리
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showOnlyHoldings}
              onChange={(e) => setShowOnlyHoldings(e.target.checked)}
            />
          }
          label="보유 코인만 표시"
        />
      </Box>

      {availableToAdd.length > 0 && !showOnlyHoldings && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {availableToAdd.length}개의 코인을 추가할 수 있습니다
          </Typography>
        </Alert>
      )}

      <Grid container spacing={2}>
        {displayCoins.map((coin) => {
          const accountInfo = getAccountInfo(coin.symbol);
          const portfolioCoin = portfolio.find(p => p.symbol === coin.symbol);
          const isEnabled = portfolioCoin?.enabled || false;
          
          return (
            <Grid item xs={12} md={6} lg={4} key={coin.symbol}>
              <Card 
                sx={{ 
                  opacity: isEnabled ? 1 : 0.7,
                  border: isEnabled ? 2 : 1,
                  borderColor: isEnabled ? 'primary.main' : 'divider'
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" fontWeight="bold">
                        {coin.symbol}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {coin.name}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      {accountInfo && (
                        <Chip
                          label="보유"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      <Switch
                        checked={isEnabled}
                        onChange={() => handleToggleCoin(coin.symbol)}
                        color="primary"
                      />
                    </Box>
                  </Box>

                  {accountInfo && (
                    <Box>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            보유수량
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {accountInfo.holdings} {coin.symbol}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            평균매수가
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(accountInfo.avgBuyPrice)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            현재가
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(accountInfo.currentPrice)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            손익
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {parseFloat(accountInfo.profitLoss) >= 0 ? (
                              <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                            ) : (
                              <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                            )}
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              color={parseFloat(accountInfo.profitLoss) >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatPercent(parseFloat(accountInfo.profitLossPercent))}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {!isEnabled && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddCoin(coin)}
                      sx={{ mt: 2 }}
                    >
                      포트폴리오에 추가
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};