import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Badge,
  Divider
} from '@mui/material';
import {
  Refresh,
  Search,
  Newspaper,
  SentimentVerySatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  TrendingUp,
  TrendingDown,
  Language,
  OpenInNew
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTimeAgo } from '../../utils/formatters';

interface NewsItem {
  title: string;
  link: string;
  pubDate: Date;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  summary?: string;
  influenceScore?: number;
  isKorean?: boolean;
}

interface NewsAnalysis {
  totalNews: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  sentimentScore: number;
  topKeywords: string[];
  majorEvents: string[];
  newsItems: NewsItem[];
  fudIndex?: number;
  averageInfluence?: number;
  koreanNewsRatio?: number;
}

export const NewsAnalysisPanel: React.FC = () => {
  const [newsData, setNewsData] = useState<NewsAnalysis | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<string>('MARKET');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchNews = async (coin: string = 'MARKET') => {
    setIsLoading(true);
    setError('');

    try {
      // TODO: main 프로세스에 IPC 핸들러 추가 필요
      const electronAPI = (window as any).electronAPI;
      
      // 임시 더미 데이터
      const dummyData: NewsAnalysis = {
        totalNews: 156,
        positiveCount: 67,
        negativeCount: 42,
        neutralCount: 47,
        sentimentScore: 25,
        topKeywords: ['Bitcoin', 'ETF', 'SEC', '규제', '기관투자', 'DeFi', '상승', '전망'],
        majorEvents: [
          'Bitcoin ETF 승인 가능성 증대',
          '미국 SEC의 암호화폐 규제 완화 신호',
          '기관투자자들의 관심 증가'
        ],
        newsItems: [
          {
            title: 'Bitcoin ETF 승인 임박, 시장 기대감 상승',
            link: 'https://example.com/1',
            pubDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
            source: 'CoinDesk',
            sentiment: 'positive',
            summary: 'SEC가 Bitcoin ETF 승인을 긍정적으로 검토하고 있다는 소식에 시장이 들썩이고 있습니다.',
            influenceScore: 85,
            isKorean: false
          },
          {
            title: '한국 정부, 암호화폐 과세 유예 검토',
            link: 'https://example.com/2',
            pubDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
            source: '한국경제',
            sentiment: 'positive',
            summary: '정부가 암호화폐 과세를 2025년까지 유예하는 방안을 검토하고 있습니다.',
            influenceScore: 72,
            isKorean: true
          },
          {
            title: '주요 거래소 해킹 시도 증가 우려',
            link: 'https://example.com/3',
            pubDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
            source: 'CryptoNews',
            sentiment: 'negative',
            summary: '최근 주요 거래소를 대상으로 한 해킹 시도가 증가하고 있어 보안 강화가 필요합니다.',
            influenceScore: 65,
            isKorean: false
          },
          {
            title: 'DeFi TVL 사상 최고치 경신',
            link: 'https://example.com/4',
            pubDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
            source: 'DeFi Pulse',
            sentiment: 'positive',
            summary: 'DeFi 생태계의 TVL이 1500억 달러를 돌파하며 사상 최고치를 기록했습니다.',
            influenceScore: 58,
            isKorean: false
          }
        ],
        fudIndex: 35,
        averageInfluence: 70,
        koreanNewsRatio: 0.25
      };

      setNewsData(dummyData);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      setError('뉴스 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(() => fetchNews(selectedCoin), 10 * 60 * 1000); // 10분마다 갱신
    return () => clearInterval(interval);
  }, [selectedCoin]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <SentimentVerySatisfied sx={{ color: 'success.main' }} />;
      case 'negative':
        return <SentimentDissatisfied sx={{ color: 'error.main' }} />;
      default:
        return <SentimentNeutral sx={{ color: 'warning.main' }} />;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 50) return 'success.main';
    if (score <= -50) return 'error.main';
    return 'warning.main';
  };

  const sentimentData = newsData ? [
    { name: '긍정', value: newsData.positiveCount, color: '#4caf50' },
    { name: '부정', value: newsData.negativeCount, color: '#f44336' },
    { name: '중립', value: newsData.neutralCount, color: '#ff9800' }
  ] : [];

  const keywordData = newsData ? newsData.topKeywords.slice(0, 5).map((keyword, index) => ({
    keyword,
    count: Math.floor(Math.random() * 50) + 10 // 임시 카운트
  })) : [];

  const filteredNews = newsData?.newsItems.filter(item =>
    searchQuery === '' || 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          뉴스 분석
        </Typography>
        <Box>
          <Button
            variant={selectedCoin === 'MARKET' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSelectedCoin('MARKET')}
            sx={{ mr: 1 }}
          >
            전체 시장
          </Button>
          <Button
            variant={selectedCoin === 'BTC' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSelectedCoin('BTC')}
            sx={{ mr: 1 }}
          >
            BTC
          </Button>
          <Button
            variant={selectedCoin === 'ETH' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSelectedCoin('ETH')}
            sx={{ mr: 1 }}
          >
            ETH
          </Button>
          <IconButton onClick={() => fetchNews(selectedCoin)} disabled={isLoading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {newsData && (
        <Grid container spacing={3}>
          {/* 감성 분석 개요 */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {/* 감성 점수 */}
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      시장 감성 지수
                    </Typography>
                    <Box textAlign="center">
                      <Typography 
                        variant="h2" 
                        sx={{ color: getSentimentColor(newsData.sentimentScore) }}
                      >
                        {newsData.sentimentScore > 0 ? '+' : ''}{newsData.sentimentScore}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        -100 (매우 부정적) ~ +100 (매우 긍정적)
                      </Typography>
                      <Box display="flex" justifyContent="center" mt={2}>
                        {newsData.sentimentScore > 20 && <TrendingUp sx={{ color: 'success.main', mr: 1 }} />}
                        {newsData.sentimentScore < -20 && <TrendingDown sx={{ color: 'error.main', mr: 1 }} />}
                        <Typography variant="body1">
                          {newsData.sentimentScore > 20 ? '긍정적 시장 분위기' :
                           newsData.sentimentScore < -20 ? '부정적 시장 분위기' : '중립적 시장 분위기'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 감성 분포 */}
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      뉴스 감성 분포
                    </Typography>
                    <Box sx={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {sentimentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 주요 키워드 */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      주요 키워드
                    </Typography>
                    <Box sx={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={keywordData} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="keyword" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 뉴스 목록 */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        최신 뉴스
                      </Typography>
                      <TextField
                        size="small"
                        placeholder="뉴스 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                    <List>
                      {filteredNews.map((news, index) => (
                        <React.Fragment key={index}>
                          <ListItem 
                            onClick={() => {
                              setSelectedNews(news);
                              setDetailOpen(true);
                            }}
                            sx={{ cursor: 'pointer' }}
                          >
                            <ListItemAvatar>
                              {getSentimentIcon(news.sentiment)}
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center">
                                  <Typography variant="body1" sx={{ flex: 1 }}>
                                    {news.title}
                                  </Typography>
                                  {news.isKorean && (
                                    <Chip 
                                      label="KR" 
                                      size="small" 
                                      sx={{ ml: 1 }} 
                                    />
                                  )}
                                  {news.influenceScore && news.influenceScore >= 70 && (
                                    <Badge 
                                      badgeContent="HOT" 
                                      color="error" 
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {news.source} · {formatTimeAgo(news.pubDate)}
                                  </Typography>
                                  {news.summary && (
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                      {news.summary}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < filteredNews.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* 사이드바 */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              {/* 주요 이벤트 */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      주요 이벤트
                    </Typography>
                    <List dense>
                      {newsData.majorEvents.map((event, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={event}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* 통계 정보 */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      뉴스 통계
                    </Typography>
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          총 뉴스 수
                        </Typography>
                        <Typography variant="body2">
                          {newsData.totalNews}개
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          평균 영향력 점수
                        </Typography>
                        <Typography variant="body2">
                          {newsData.averageInfluence}/100
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          한국 뉴스 비율
                        </Typography>
                        <Typography variant="body2">
                          {((newsData.koreanNewsRatio || 0) * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                      {newsData.fudIndex !== undefined && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            FUD 지수
                          </Typography>
                          <Typography 
                            variant="body2"
                            color={newsData.fudIndex > 50 ? 'error.main' : 'text.primary'}
                          >
                            {newsData.fudIndex}/100
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* 뉴스 상세 다이얼로그 */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            {selectedNews && getSentimentIcon(selectedNews.sentiment)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {selectedNews?.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNews && (
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Chip 
                  label={selectedNews.source} 
                  size="small" 
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {formatTimeAgo(selectedNews.pubDate)}
                </Typography>
                {selectedNews.isKorean && (
                  <Chip 
                    icon={<Language />}
                    label="한국어" 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              {selectedNews.summary && (
                <Typography variant="body1" paragraph>
                  {selectedNews.summary}
                </Typography>
              )}
              {selectedNews.influenceScore && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    영향력 점수: {selectedNews.influenceScore}/100
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={selectedNews.influenceScore} 
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>
            닫기
          </Button>
          {selectedNews && (
            <Button 
              startIcon={<OpenInNew />}
              onClick={() => window.open(selectedNews.link, '_blank')}
            >
              원문 보기
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};