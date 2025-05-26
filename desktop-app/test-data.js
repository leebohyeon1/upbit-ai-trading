const axios = require('axios');

async function testUpbitData() {
  console.log('📊 Upbit 데이터 테스트 시작...\n');
  
  const market = 'KRW-BTC';
  const baseURL = 'https://api.upbit.com';
  
  try {
    // 1. Ticker 데이터 테스트
    console.log('1️⃣ Ticker 데이터 가져오기...');
    const tickerResponse = await axios.get(`${baseURL}/v1/ticker`, {
      params: { markets: market }
    });
    const ticker = tickerResponse.data[0];
    console.log('✅ Ticker 데이터:', {
      현재가: ticker.trade_price?.toLocaleString() + '원',
      변화율: (ticker.change_rate * 100).toFixed(2) + '%',
      거래량_24h: ticker.acc_trade_volume_24h?.toFixed(2),
      거래대금_24h: (ticker.acc_trade_price_24h / 100000000).toFixed(2) + '억원',
      고가: ticker.high_price?.toLocaleString() + '원',
      저가: ticker.low_price?.toLocaleString() + '원'
    });
    
    // 2. 캔들 데이터 테스트
    console.log('\n2️⃣ 캔들 데이터 가져오기...');
    const candleResponse = await axios.get(`${baseURL}/v1/candles/minutes/5`, {
      params: { market, count: 10 }
    });
    const latestCandle = candleResponse.data[0];
    console.log('✅ 최신 캔들:', {
      시간: new Date(latestCandle.candle_date_time_utc).toLocaleString('ko-KR'),
      시가: latestCandle.opening_price?.toLocaleString() + '원',
      종가: latestCandle.trade_price?.toLocaleString() + '원',
      거래량: latestCandle.candle_acc_trade_volume?.toFixed(4)
    });
    
    // 3. 호가 데이터 테스트
    console.log('\n3️⃣ 호가 데이터 가져오기...');
    const orderbookResponse = await axios.get(`${baseURL}/v1/orderbook`, {
      params: { markets: market }
    });
    const orderbook = orderbookResponse.data[0];
    
    const totalBidSize = orderbook.orderbook_units.reduce((sum, unit) => sum + unit.bid_size, 0);
    const totalAskSize = orderbook.orderbook_units.reduce((sum, unit) => sum + unit.ask_size, 0);
    const bidAskRatio = totalBidSize / (totalAskSize || 1);
    const bestBid = orderbook.orderbook_units[0].bid_price;
    const bestAsk = orderbook.orderbook_units[0].ask_price;
    const spread = ((bestAsk - bestBid) / bestBid) * 100;
    
    console.log('✅ 호가 분석:', {
      최우선_매수호가: bestBid?.toLocaleString() + '원',
      최우선_매도호가: bestAsk?.toLocaleString() + '원',
      스프레드: spread.toFixed(3) + '%',
      총_매수물량: totalBidSize.toFixed(4) + ' BTC',
      총_매도물량: totalAskSize.toFixed(4) + ' BTC',
      매수매도_비율: bidAskRatio.toFixed(2) + ' (' + (bidAskRatio > 1 ? '매수세 우세' : '매도세 우세') + ')'
    });
    
    // 4. 체결 데이터 테스트
    console.log('\n4️⃣ 체결 데이터 가져오기...');
    const tradesResponse = await axios.get(`${baseURL}/v1/trades/ticks`, {
      params: { market, count: 50 }
    });
    const trades = tradesResponse.data;
    
    const buyVolume = trades.filter(t => t.ask_bid === 'BID').reduce((sum, t) => sum + t.trade_volume, 0);
    const sellVolume = trades.filter(t => t.ask_bid === 'ASK').reduce((sum, t) => sum + t.trade_volume, 0);
    const totalVolume = buyVolume + sellVolume;
    const buyRatio = buyVolume / (totalVolume || 1);
    
    console.log('✅ 최근 50건 체결 분석:', {
      매수_체결량: buyVolume.toFixed(4) + ' BTC',
      매도_체결량: sellVolume.toFixed(4) + ' BTC',
      매수_비율: (buyRatio * 100).toFixed(1) + '%',
      체결_강도: buyRatio > 0.6 ? '강한 매수세' : buyRatio < 0.4 ? '강한 매도세' : '중립'
    });
    
    // 5. 거래량 분석
    console.log('\n5️⃣ 거래량 분석...');
    const candles = candleResponse.data;
    const volumes = candles.map(c => c.candle_acc_trade_volume);
    const currentVolume = volumes[0];
    const avgVolume = volumes.slice(1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
    const volumeRatio = currentVolume / avgVolume;
    
    console.log('✅ 거래량 분석:', {
      현재_거래량: currentVolume.toFixed(4) + ' BTC',
      평균_거래량: avgVolume.toFixed(4) + ' BTC',
      평균_대비: (volumeRatio * 100).toFixed(1) + '%',
      거래량_상태: volumeRatio > 1.5 ? '⚠️ 거래량 급증!' : volumeRatio < 0.5 ? '거래량 감소' : '정상'
    });
    
    console.log('\n✅ 모든 데이터가 정상적으로 가져와졌습니다!');
    
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
    }
  }
}

// 테스트 실행
testUpbitData();