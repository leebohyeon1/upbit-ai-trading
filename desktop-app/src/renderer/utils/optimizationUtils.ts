// 최적화 유틸리티 함수들

/**
 * 함수 호출을 지연시키는 디바운스 함수
 * @param func 실행할 함수
 * @param delay 지연 시간 (ms)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 함수 호출 빈도를 제한하는 쓰로틀 함수
 * @param func 실행할 함수
 * @param limit 제한 시간 (ms)
 * @returns 쓰로틀된 함수
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastResult: ReturnType<T>;
  
  return function (this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 배열을 청크로 나누는 함수
 * @param array 원본 배열
 * @param size 청크 크기
 * @returns 청크 배열
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 깊은 객체 병합 함수
 * @param target 대상 객체
 * @param source 소스 객체
 * @returns 병합된 객체
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const output = { ...target };
  
  Object.keys(source).forEach(key => {
    if (source[key as keyof T] instanceof Object && key in target) {
      output[key as keyof T] = deepMerge(
        target[key as keyof T] as any,
        source[key as keyof T] as any
      );
    } else {
      output[key as keyof T] = source[key as keyof T] as T[keyof T];
    }
  });
  
  return output;
}

/**
 * 메모이제이션 함수
 * @param fn 메모이제이션할 함수
 * @param getKey 캐시 키 생성 함수
 * @returns 메모이제이션된 함수
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  const defaultGetKey = (...args: Parameters<T>) => JSON.stringify(args);
  const keyFn = getKey || defaultGetKey;
  
  return ((...args: Parameters<T>) => {
    const key = keyFn(...args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // 캐시 크기 제한 (최대 100개)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
}

/**
 * 비동기 함수 재시도 유틸리티
 * @param fn 실행할 비동기 함수
 * @param retries 재시도 횟수
 * @param delay 재시도 간격 (ms)
 * @returns Promise
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2); // 지수 백오프
  }
}

/**
 * 비동기 작업 병렬 실행 (동시 실행 수 제한)
 * @param tasks 실행할 작업 배열
 * @param limit 동시 실행 제한
 * @returns Promise 배열
 */
export async function parallelLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  
  for (let i = 0; i < tasks.length; i++) {
    const task = async () => {
      const result = await tasks[i]();
      results[i] = result;
    };
    
    const promise = task();
    executing.push(promise);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }
  
  await Promise.all(executing);
  return results;
}

/**
 * 성능 측정 데코레이터
 * @param target 대상 객체
 * @param propertyKey 메서드 이름
 * @param descriptor 메서드 디스크립터
 */
export function measurePerformance(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    try {
      const result = await originalMethod.apply(this, args);
      const end = performance.now();
      console.log(`[Performance] ${propertyKey} took ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.log(`[Performance] ${propertyKey} failed after ${(end - start).toFixed(2)}ms`);
      throw error;
    }
  };
  
  return descriptor;
}

/**
 * 객체 깊은 동결
 * @param obj 동결할 객체
 * @returns 동결된 객체
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);
  
  Object.getOwnPropertyNames(obj).forEach(prop => {
    if (obj[prop as keyof T] !== null
      && (typeof obj[prop as keyof T] === 'object' || typeof obj[prop as keyof T] === 'function')
      && !Object.isFrozen(obj[prop as keyof T])) {
      deepFreeze(obj[prop as keyof T] as any);
    }
  });
  
  return obj;
}

/**
 * 배열 중복 제거 (객체 배열 지원)
 * @param array 원본 배열
 * @param key 중복 체크 키 (객체인 경우)
 * @returns 중복 제거된 배열
 */
export function uniqueArray<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const k = item[key];
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  });
}

/**
 * LRU 캐시 구현
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 최근 사용으로 업데이트
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 가장 오래된 항목 제거
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}