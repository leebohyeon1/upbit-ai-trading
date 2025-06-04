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
  Clear as ClearIcon,
  DeleteForever as DeleteForeverIcon
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
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCoins, setAvailableCoins] = useState<{ symbol: string; name: string }[]>([]);
  const [isLoadingCoins, setIsLoadingCoins] = useState(true);
  const { fetchSupportedCoins } = useTradingContext();

  // 지원 코인 목록 가져오기
  useEffect(() => {
    fetchAvailableCoins();
  }, []);

  const fetchAvailableCoins = async () => {
    setIsLoadingCoins(true);
    try {
      const supportedSymbols = await fetchSupportedCoins();
      const coinList = supportedSymbols.map(symbol => ({
        symbol,
        name: symbol // 실제로는 한글 이름을 가져와야 함
      }));
      setAvailableCoins(coinList);
    } catch (error) {
      console.error('Failed to fetch available coins:', error);
    } finally {
      setIsLoadingCoins(false);
    }
  };

  const handleRefreshCoins = () => {
    fetchAvailableCoins();
  };

  // 검색 필터링
  const displayCoins = useMemo(() => {
    let coins = availableCoins;

    if (showOnlyHoldings) {
      const holdingSymbols = accounts
        .filter(acc => acc.currency !== 'KRW' && parseFloat(acc.balance) > 0)
        .map(acc => acc.currency);
      coins = coins.filter(coin => holdingSymbols.includes(coin.symbol));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      coins = coins.filter(coin => 
        coin.symbol.toLowerCase().includes(query) ||
        coin.name.toLowerCase().includes(query)
      );
    }

    return coins;
  }, [availableCoins, showOnlyHoldings, accounts, searchQuery]);

  const getAccountInfo = (symbol: string) => {
    const account = accounts.find(acc => acc.currency === symbol);
    if (!account || parseFloat(account.balance) === 0) return null;

    const ticker = tickers.find(t => t.market === `KRW-${symbol}`);
    const holdings = parseFloat(account.balance);
    const avgBuyPrice = parseFloat(account.avg_buy_price);
    const currentPrice = ticker?.trade_price || 0;
    const profitLoss = holdings * (currentPrice - avgBuyPrice);
    const profitLossPercent = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;

    return {
      holdings: holdings.toFixed(8),
      avgBuyPrice: avgBuyPrice.toFixed(0),
      currentPrice: currentPrice.toFixed(0),
      profitLoss: profitLoss.toFixed(0),
      profitLossPercent: profitLossPercent.toFixed(2)
    };
  };

  const handleToggleCoin = (symbol: string) => {
    const existingCoin = portfolio.find(coin => coin.symbol === symbol);
    
    if (existingCoin) {
      const updatedPortfolio = portfolio.map(coin =>
        coin.symbol === symbol ? { ...coin, enabled: !coin.enabled } : coin
      );
      onUpdatePortfolio(updatedPortfolio);
    }
    // 포트폴리오에 없는 코인은 토글하지 않음 (추가 버튼을 통해서만 추가)
  };

  const handleAddCoin = (coin: { symbol: string; name: string }) => {
    // 이미 포트폴리오에 있는지 확인
    const existingCoin = portfolio.find(p => p.symbol === coin.symbol);
    if (existingCoin) {
      console.log(`${coin.symbol} is already in portfolio`);
      return;
    }
    
    const newCoin: PortfolioCoin = {
      symbol: coin.symbol,
      name: coin.name,
      enabled: true
    };
    onUpdatePortfolio([...portfolio, newCoin]);
  };

  const handleRemoveCoin = (symbol: string) => {
    const updatedPortfolio = portfolio.filter(coin => coin.symbol !== symbol);
    onUpdatePortfolio(updatedPortfolio);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={index} style={{ backgroundColor: 'yellow' }}>{part}</span> : 
        part
    );
  };

  // 포트폴리오에 추가할 수 있는 코인들
  const availableToAdd = useMemo(() => {
    const portfolioSymbols = portfolio.map(coin => coin.symbol);
    return availableCoins.filter(coin => !portfolioSymbols.includes(coin.symbol));
  }, [availableCoins, portfolio]);

  // 총 보유 자산 정보
  const totalAssetInfo = useMemo(() => {
    let totalValue = 0;
    let totalProfit = 0;

    accounts.forEach(account => {
      if (account.currency === 'KRW') {
        totalValue += parseFloat(account.balance);
      } else {
        const holdings = parseFloat(account.balance);
        if (holdings > 0) {
          const ticker = tickers.find(t => t.market === `KRW-${account.currency}`);
          const currentPrice = ticker?.trade_price || 0;
          const avgBuyPrice = parseFloat(account.avg_buy_price);
          
          totalValue += holdings * currentPrice;
          totalProfit += holdings * (currentPrice - avgBuyPrice);
        }
      }
    });

    return {
      totalValue,
      totalProfit,
      totalProfitPercent: totalValue > 0 ? (totalProfit / (totalValue - totalProfit)) * 100 : 0
    };
  }, [accounts, tickers]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
            <Tooltip title="포트폴리오 초기화 (모든 코인 제거)">
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={() => {
                  if (window.confirm('정말로 포트폴리오를 초기화하시겠습니까?\n모든 코인이 포트폴리오에서 제거됩니다.')) {
                    onUpdatePortfolio([]);
                  }
                }}
                size="small"
              >
                포트폴리오 초기화
              </Button>
            </Tooltip>
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
                          {portfolioCoin && (
                            <>
                              <Switch
                                checked={isEnabled}
                                onChange={() => handleToggleCoin(coin.symbol)}
                                color="primary"
                              />
                              <Tooltip title="포트폴리오에서 제거">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveCoin(coin.symbol)}
                                  color="error"
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
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

                      {!portfolioCoin && (
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