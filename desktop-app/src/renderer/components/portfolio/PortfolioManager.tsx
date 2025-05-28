import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { PortfolioCoin, Account, TickerData } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { useTradingContext } from '../../contexts/TradingContext';

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
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { supportedCoins, fetchSupportedCoins } = useTradingContext();

  // 지원되는 코인 목록을 동적으로 생성
  const availableCoins = useMemo(() => {
    return supportedCoins.map(symbol => ({
      symbol,
      name: symbol // 실제 이름은 나중에 업데이트 가능
    }));
  }, [supportedCoins]);

  // 컴포넌트 마운트 시 지원 코인 목록 새로고침
  useEffect(() => {
    if (supportedCoins.length === 0) {
      handleRefreshCoins();
    }
  }, []);

  const handleRefreshCoins = async () => {
    setIsLoadingCoins(true);
    try {
      await fetchSupportedCoins();
    } catch (error) {
      console.error('Failed to refresh supported coins:', error);
    } finally {
      setIsLoadingCoins(false);
    }
  };

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

  // 텍스트 하이라이팅 함수
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <Box
              key={index}
              component="span"
              sx={{ 
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                px: 0.5,
                borderRadius: 0.5
              }}
            >
              {part}
            </Box>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  const availableToAdd = availableCoins.filter(
    coin => !portfolio.some(p => p.symbol === coin.symbol && p.enabled)
  );

  // 검색어로 필터링된 코인 목록
  const filteredCoins = useMemo(() => {
    if (!searchQuery) return availableCoins;
    
    const query = searchQuery.toLowerCase();
    return availableCoins.filter(coin => {
      const symbol = coin.symbol.toLowerCase();
      const name = coin.name.toLowerCase();
      return symbol.includes(query) || name.includes(query);
    });
  }, [availableCoins, searchQuery]);

  const displayCoins = showOnlyHoldings 
    ? filteredCoins.filter(coin => {
        const account = accounts.find(acc => acc.currency === coin.symbol);
        return account && parseFloat(account.balance) > 0;
      })
    : filteredCoins;

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
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            포트폴리오 관리
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="지원 코인 목록 새로고침">
              <IconButton 
                onClick={handleRefreshCoins} 
                disabled={isLoadingCoins}
                size="small"
              >
                {isLoadingCoins ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
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
        </Box>
        
        {/* 검색 필드 */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="코인 이름 또는 심볼로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />
      </Box>

      {!isLoadingCoins && (
        <Box mb={2}>
          {searchQuery && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <Typography variant="body2">
                '{searchQuery}' 검색 결과: {displayCoins.length}개 코인
              </Typography>
            </Alert>
          )}
          {availableToAdd.length > 0 && !showOnlyHoldings && (
            <Alert severity="info">
              <Typography variant="body2">
                {availableToAdd.length}개의 코인을 추가할 수 있습니다 (총 {availableCoins.length}개 지원)
              </Typography>
            </Alert>
          )}
        </Box>
      )}

      {isLoadingCoins && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {displayCoins.length === 0 && !isLoadingCoins && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            {searchQuery 
              ? `'${searchQuery}'에 해당하는 코인이 없습니다.`
              : '표시할 코인이 없습니다.'
            }
          </Typography>
        </Box>
      )}

      <Grid container spacing={2}>
        {!isLoadingCoins && displayCoins.map((coin) => {
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
                        {highlightText(coin.symbol, searchQuery)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {highlightText(coin.name, searchQuery)}
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