const axios = require('axios');

async function getKimchiPremium() {
  console.log('🌶️ 김치 프리미엄 계산 시작...\n');
  
  try {
    // 1. 환율 정보 가져오기 (무료 API 사용)
    console.log('1️⃣ 환율 정보 가져오기...');
    const exchangeRateResponse = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    const usdToKrw = exchangeRateResponse.data.rates.KRW;
    console.log(`✅ USD/KRW 환율: ${usdToKrw.toFixed(2)}원\n`);
    
    // 2. Binance BTC 가격 가져오기
    console.log('2️⃣ Binance BTC/USDT 가격 가져오기...');
    const binanceResponse = await axios.get('https://api.binance.com/api/v3/ticker/price', {
      params: { symbol: 'BTCUSDT' }
    });
    const btcUsdPrice = parseFloat(binanceResponse.data.price);
    const btcKrwPriceBinance = btcUsdPrice * usdToKrw;
    console.log(`✅ Binance BTC 가격: $${btcUsdPrice.toFixed(2)} (₩${btcKrwPriceBinance.toLocaleString()})\n`);
    
    // 3. Upbit BTC 가격 가져오기
    console.log('3️⃣ Upbit KRW-BTC 가격 가져오기...');
    const upbitResponse = await axios.get('https://api.upbit.com/v1/ticker', {
      params: { markets: 'KRW-BTC' }
    });
    const btcKrwPriceUpbit = upbitResponse.data[0].trade_price;
    console.log(`✅ Upbit BTC 가격: ₩${btcKrwPriceUpbit.toLocaleString()}\n`);
    
    // 4. 김치 프리미엄 계산
    const kimchiPremium = ((btcKrwPriceUpbit - btcKrwPriceBinance) / btcKrwPriceBinance) * 100;
    
    console.log('📊 김치 프리미엄 계산 결과:');
    console.log('━'.repeat(50));
    console.log(`Binance 가격 (원화 환산): ₩${btcKrwPriceBinance.toLocaleString()}`);
    console.log(`Upbit 가격:              ₩${btcKrwPriceUpbit.toLocaleString()}`);
    console.log(`가격 차이:               ₩${(btcKrwPriceUpbit - btcKrwPriceBinance).toLocaleString()}`);
    console.log(`김치 프리미엄:           ${kimchiPremium.toFixed(2)}%`);
    console.log('━'.repeat(50));
    
    // 5. 다른 주요 코인들의 김프도 계산
    console.log('\n📈 주요 코인별 김치 프리미엄:');
    const coins = [
      { symbol: 'ETH', binanceSymbol: 'ETHUSDT' },
      { symbol: 'XRP', binanceSymbol: 'XRPUSDT' },
      { symbol: 'SOL', binanceSymbol: 'SOLUSDT' },
      { symbol: 'DOGE', binanceSymbol: 'DOGEUSDT' }
    ];
    
    for (const coin of coins) {
      try {
        // Binance 가격
        const binanceRes = await axios.get('https://api.binance.com/api/v3/ticker/price', {
          params: { symbol: coin.binanceSymbol }
        });
        const usdPrice = parseFloat(binanceRes.data.price);
        const krwPriceBinance = usdPrice * usdToKrw;
        
        // Upbit 가격
        const upbitRes = await axios.get('https://api.upbit.com/v1/ticker', {
          params: { markets: `KRW-${coin.symbol}` }
        });
        const krwPriceUpbit = upbitRes.data[0].trade_price;
        
        // 김프 계산
        const premium = ((krwPriceUpbit - krwPriceBinance) / krwPriceBinance) * 100;
        
        console.log(`${coin.symbol}: ${premium.toFixed(2)}% (Upbit: ₩${krwPriceUpbit.toLocaleString()}, Binance: ₩${krwPriceBinance.toLocaleString()})`);
      } catch (error) {
        console.log(`${coin.symbol}: 데이터 가져오기 실패`);
      }
    }
    
    // 6. 김프 해석
    console.log('\n💡 김치 프리미엄 해석:');
    if (kimchiPremium > 5) {
      console.log('⚠️ 김프가 5% 이상으로 높습니다. 매수 시 주의가 필요합니다.');
    } else if (kimchiPremium > 3) {
      console.log('📈 김프가 3-5% 수준으로 약간 높은 편입니다.');
    } else if (kimchiPremium > 0) {
      console.log('✅ 김프가 0-3% 수준으로 정상 범위입니다.');
    } else {
      console.log('📉 역프리미엄 상태입니다. 해외 대비 국내가 저렴합니다.');
    }
    
    return kimchiPremium;
    
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
    }
  }
}

// 실시간 모니터링 (10초마다 업데이트)
async function monitorKimchiPremium() {
  console.clear();
  await getKimchiPremium();
  
  console.log('\n⏱️ 10초마다 업데이트됩니다. Ctrl+C로 종료하세요.');
  
  setInterval(async () => {
    console.clear();
    await getKimchiPremium();
    console.log('\n⏱️ 마지막 업데이트:', new Date().toLocaleString('ko-KR'));
  }, 10000);
}

// 모니터링 시작
monitorKimchiPremium();