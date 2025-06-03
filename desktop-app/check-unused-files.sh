#!/bin/bash

# 모든 서비스 파일 목록
services=(
  "ai-service"
  "analysis-service"
  "analysis-service-python-style"
  "api-client"
  "api-rate-limiter"
  "backtest-service"
  "dca-strategy-service"
  "grid-trading-service"
  "kelly-criterion-service"
  "kill-switch-service"
  "learning-service"
  "market-correlation-service"
  "mean-reversion-service"
  "momentum-trading-service"
  "multi-timeframe-service"
  "news-api-service"
  "news-service"
  "notification-service"
  "pattern-recognition-service"
  "risk-management-service"
  "support-resistance-service"
  "trade-history-service"
  "trading-config"
  "trading-engine"
  "two-factor-auth-service"
  "upbit-service"
)

echo "=== 사용되지 않는 서비스 파일 검사 ==="
echo ""

for service in "${services[@]}"; do
  # 해당 서비스를 import하는 파일 찾기
  count=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "$service" | grep -v "$service.ts" | wc -l)
  
  if [ $count -eq 0 ]; then
    echo "❌ $service.ts - 사용되지 않음"
  else
    echo "✅ $service.ts - $count개 파일에서 사용됨"
  fi
done

echo ""
echo "=== 기타 의심스러운 파일들 ==="
echo ""

# .bak 파일 찾기
echo "백업 파일들:"
find src -name "*.bak" -type f

# 임시 파일 찾기
echo ""
echo "임시 파일들:"
find src -name "*.tmp" -o -name "*~" -o -name "*.swp" -type f

# 중복 가능성 있는 파일 찾기
echo ""
echo "중복 가능성 있는 파일들:"
find src -name "*-copy*" -o -name "*-old*" -o -name "*-backup*" -type f