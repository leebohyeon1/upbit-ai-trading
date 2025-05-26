import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, safeStorage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import tradingEngine from './trading-engine';

class TradingApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private pythonProcess: ChildProcess | null = null;
  private isQuitting = false;
  private tradingState = {
    isRunning: false,
    aiEnabled: false,
    lastUpdate: new Date().toISOString()
  };

  constructor() {
    this.setupApp();
    this.setupTradingEngine();
  }

  private setupApp() {
    // Single instance lock
    const gotTheLock = app.requestSingleInstanceLock();
    
    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });

    app.whenReady().then(async () => {
      this.createWindow();
      this.createTray();
      this.setupIPC();
      // API 서버는 별도로 실행하도록 변경
      // this.startPythonBackend();
      
      // 3초 후 초기화 작업 수행
      setTimeout(async () => {
        this.loadInitialState();
        await this.loadSavedApiKeys();
        
        // 독립적인 거래 엔진 이벤트 연결은 이미 setupTradingEngine()에서 설정됨
      }, 3000);
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
      // 앱 종료시 Python 프로세스도 종료
      if (this.pythonProcess) {
        this.pythonProcess.kill();
      }
      // 거래 엔진 종료
      tradingEngine.stop();
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload', 'preload.js')
      },
      icon: this.getIconPath(),
      title: 'Upbit AI Trading'
    });

    this.mainWindow.loadFile(path.join(__dirname, 'index.html'));

    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createTray() {
    const icon = nativeImage.createFromPath(this.getIconPath());
    this.tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '열기',
        click: () => {
          this.mainWindow?.show();
        }
      },
      {
        label: '자동매매 상태',
        enabled: false
      },
      { type: 'separator' },
      {
        label: '자동매매 시작',
        click: () => {
          this.startTrading();
        }
      },
      {
        label: '자동매매 중지',
        click: () => {
          this.stopTrading();
        }
      },
      { type: 'separator' },
      {
        label: '종료',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setToolTip('Upbit AI Trading');
    this.tray.setContextMenu(contextMenu);
    
    this.tray.on('double-click', () => {
      this.mainWindow?.show();
    });
  }

  private getIconPath(): string {
    // 아이콘 파일이 없으므로 임시로 빈 경로 반환
    return path.join(__dirname, 'icon.png');
  }


  private startPythonBackend() {
    // Windows에서는 실행 파일이 dist 폴더에 있으므로 경로 조정
    const isDev = !app.isPackaged;
    const apiServerPath = isDev 
      ? path.join(__dirname, '..', '..', '..', 'api_server.py')
      : path.join(process.resourcesPath, '..', '..', 'api_server.py');
    
    try {
      // FastAPI 서버 자동 시작
      console.log('Starting API server at:', apiServerPath);
      
      // Windows에서 Python 가상환경 확인
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      
      this.pythonProcess = spawn(pythonCmd, [apiServerPath], {
        cwd: path.dirname(apiServerPath),
        shell: true,
        env: { ...process.env }
      });
      
      this.pythonProcess.stdout?.on('data', (data) => {
        console.log(`API Server: ${data.toString()}`);
      });
      
      this.pythonProcess.stderr?.on('data', (data) => {
        console.error(`API Server Error: ${data.toString()}`);
      });
      
      this.pythonProcess.on('error', (error) => {
        console.error('Failed to start API server:', error);
      });
      
      this.pythonProcess.on('close', (code) => {
        console.log(`API Server exited with code ${code}`);
      });
      
      // API 서버가 시작될 때까지 더 길게 대기
      setTimeout(() => {
        this.loadInitialState();
      }, 5000);
    } catch (error) {
      console.error('Failed to start Python backend:', error);
    }
  }

  private async startTrading(tickers: string[] = ['KRW-BTC']): Promise<boolean> {
    try {
      // 내장 거래 엔진 사용
      tradingEngine.setActiveMarkets(tickers);
      const success = await tradingEngine.start();
      
      if (success) {
        this.tradingState.isRunning = true;
        this.tradingState.lastUpdate = new Date().toISOString();
        
        // 트레이 메뉴 업데이트
        this.updateTrayMenu();
        
        // 렌더러에 상태 업데이트 알림
        this.mainWindow?.webContents.send('trading-state-changed', this.tradingState);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to start trading:', error);
      return false;
    }
  }

  private async stopTrading(): Promise<boolean> {
    try {
      // 내장 거래 엔진 사용
      const success = await tradingEngine.stop();
      
      if (success) {
        this.tradingState.isRunning = false;
        this.tradingState.lastUpdate = new Date().toISOString();
        
        // 트레이 메뉴 업데이트
        this.updateTrayMenu();
        
        // 렌더러에 상태 업데이트 알림
        this.mainWindow?.webContents.send('trading-state-changed', this.tradingState);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to stop trading:', error);
      return false;
    }
  }

  private async toggleAI(enabled: boolean): Promise<boolean> {
    try {
      // 내장 거래 엔진 사용
      tradingEngine.toggleAI(enabled);
      
      this.tradingState.aiEnabled = enabled;
      this.tradingState.lastUpdate = new Date().toISOString();
      
      // 렌더러에 상태 업데이트 알림
      this.mainWindow?.webContents.send('trading-state-changed', this.tradingState);
      
      return true;
    } catch (error) {
      console.error('Failed to toggle AI:', error);
      return false;
    }
  }

  private async loadInitialState() {
    try {
      // 독립적인 상태 관리 - 더 이상 외부 API 서버에 의존하지 않음
      this.tradingState.isRunning = tradingEngine.isRunning();
      this.tradingState.aiEnabled = true; // AI 분석 항상 활성화
      this.tradingState.lastUpdate = new Date().toISOString();
      
      this.updateTrayMenu();
      this.mainWindow?.webContents.send('trading-state-changed', this.tradingState);
    } catch (error) {
      console.error('Failed to load initial state:', error);
    }
  }

  private updateTrayMenu() {
    const statusLabel = this.tradingState.isRunning 
      ? `자동매매 실행중 (AI: ${this.tradingState.aiEnabled ? 'ON' : 'OFF'})`
      : '자동매매 중지됨';
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '열기',
        click: () => {
          this.mainWindow?.show();
        }
      },
      {
        label: statusLabel,
        enabled: false
      },
      { type: 'separator' },
      {
        label: '자동매매 시작',
        enabled: !this.tradingState.isRunning,
        click: () => {
          this.startTrading();
        }
      },
      {
        label: '자동매매 중지',
        enabled: this.tradingState.isRunning,
        click: () => {
          this.stopTrading();
        }
      },
      { type: 'separator' },
      {
        label: '종료',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray?.setContextMenu(contextMenu);
  }

  private getApiKeysPath(): string {
    return path.join(app.getPath('userData'), 'api-keys.json');
  }

  private getPortfolioPath(): string {
    return path.join(app.getPath('userData'), 'portfolio.json');
  }

  private getAnalysisConfigsPath(): string {
    return path.join(app.getPath('userData'), 'analysis-configs.json');
  }

  private getTradingConfigPath(): string {
    return path.join(app.getPath('userData'), 'trading-config.json');
  }

  private async saveApiKeys(keys: any): Promise<boolean> {
    try {
      // 암호화된 키 저장 (실제 거래 설정도 포함)
      const encryptedKeys = {
        upbitAccessKey: safeStorage.encryptString(keys.upbitAccessKey),
        upbitSecretKey: safeStorage.encryptString(keys.upbitSecretKey),
        anthropicApiKey: keys.anthropicApiKey ? safeStorage.encryptString(keys.anthropicApiKey) : null,
        enableRealTrade: keys.enableRealTrade || false  // 실제 거래 설정 저장
      };

      fs.writeFileSync(
        this.getApiKeysPath(), 
        JSON.stringify(encryptedKeys, null, 2)
      );

      // 내장 거래 엔진에 키 설정
      try {
        tradingEngine.setApiKeys(keys.upbitAccessKey, keys.upbitSecretKey, keys.anthropicApiKey);
        tradingEngine.setConfig({
          enableRealTrading: keys.enableRealTrade || false
        });
      } catch (error) {
        console.error('Failed to set API keys to trading engine:', error);
      }

      return true;
    } catch (error) {
      console.error('Failed to save API keys:', error);
      return false;
    }
  }

  private async getApiKeys(): Promise<any> {
    try {
      const keysPath = this.getApiKeysPath();
      
      if (!fs.existsSync(keysPath)) {
        return {
          upbitAccessKey: '',
          upbitSecretKey: '',
          anthropicApiKey: '',
          enableRealTrade: false
        };
      }

      const encryptedKeys = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));
      
      return {
        upbitAccessKey: safeStorage.decryptString(Buffer.from(encryptedKeys.upbitAccessKey)),
        upbitSecretKey: safeStorage.decryptString(Buffer.from(encryptedKeys.upbitSecretKey)),
        anthropicApiKey: encryptedKeys.anthropicApiKey 
          ? safeStorage.decryptString(Buffer.from(encryptedKeys.anthropicApiKey))
          : '',
        enableRealTrade: encryptedKeys.enableRealTrade || false
      };
    } catch (error) {
      console.error('Failed to load API keys:', error);
      return {
        upbitAccessKey: '',
        upbitSecretKey: '',
        anthropicApiKey: '',
        enableRealTrade: false
      };
    }
  }

  private async savePortfolio(portfolio: any[]): Promise<boolean> {
    try {
      fs.writeFileSync(
        this.getPortfolioPath(),
        JSON.stringify(portfolio, null, 2)
      );
      return true;
    } catch (error) {
      console.error('Failed to save portfolio:', error);
      return false;
    }
  }

  private async getPortfolio(): Promise<any[]> {
    try {
      const portfolioPath = this.getPortfolioPath();
      
      if (!fs.existsSync(portfolioPath)) {
        return [];
      }

      return JSON.parse(fs.readFileSync(portfolioPath, 'utf-8'));
    } catch (error) {
      console.error('Failed to load portfolio:', error);
      return [];
    }
  }

  // WebSocket 또는 API를 통해 분석 업데이트 받기
  public sendAnalysisUpdate(analysis: any) {
    this.mainWindow?.webContents.send('analysis-update', analysis);
  }

  private async saveAnalysisConfigs(configs: any[]): Promise<boolean> {
    try {
      fs.writeFileSync(
        this.getAnalysisConfigsPath(),
        JSON.stringify(configs, null, 2)
      );
      return true;
    } catch (error) {
      console.error('Failed to save analysis configs:', error);
      return false;
    }
  }

  private async getAnalysisConfigs(): Promise<any[]> {
    try {
      const configsPath = this.getAnalysisConfigsPath();
      
      if (!fs.existsSync(configsPath)) {
        return [];
      }

      return JSON.parse(fs.readFileSync(configsPath, 'utf-8'));
    } catch (error) {
      console.error('Failed to load analysis configs:', error);
      return [];
    }
  }

  private async saveTradingConfig(config: any): Promise<boolean> {
    try {
      fs.writeFileSync(
        this.getTradingConfigPath(),
        JSON.stringify(config, null, 2)
      );

      // 독립적인 거래 엔진에 설정 적용
      try {
        tradingEngine.updateConfig(config);
        console.log('Trading config updated successfully');
      } catch (error) {
        console.error('Failed to update trading engine config:', error);
      }

      return true;
    } catch (error) {
      console.error('Failed to save trading config:', error);
      return false;
    }
  }

  private async getTradingConfig(): Promise<any> {
    try {
      const configPath = this.getTradingConfigPath();
      
      if (!fs.existsSync(configPath)) {
        return null;
      }

      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (error) {
      console.error('Failed to load trading config:', error);
      return null;
    }
  }

  private setupIPC() {
    // 거래 상태 조회
    ipcMain.handle('get-trading-state', async () => {
      return this.tradingState;
    });

    // 자동매매 시작
    ipcMain.handle('start-trading', async (event, tickers: string[]) => {
      return await this.startTrading(tickers);
    });

    // 자동매매 중지
    ipcMain.handle('stop-trading', async () => {
      return await this.stopTrading();
    });

    // AI 토글
    ipcMain.handle('toggle-ai', async (event, enabled: boolean) => {
      return await this.toggleAI(enabled);
    });

    // 트레이로 최소화
    ipcMain.handle('minimize-to-tray', async () => {
      this.mainWindow?.hide();
    });

    // API 키 저장
    ipcMain.handle('save-api-keys', async (event, keys: any) => {
      return await this.saveApiKeys(keys);
    });

    // API 키 조회
    ipcMain.handle('get-api-keys', async () => {
      return await this.getApiKeys();
    });

    // 포트폴리오 저장
    ipcMain.handle('save-portfolio', async (event, portfolio: any[]) => {
      return await this.savePortfolio(portfolio);
    });

    // 포트폴리오 조회
    ipcMain.handle('get-portfolio', async () => {
      return await this.getPortfolio();
    });

    // 분석 설정 저장
    ipcMain.handle('save-analysis-configs', async (event, configs: any[]) => {
      return await this.saveAnalysisConfigs(configs);
    });

    // 분석 설정 조회
    ipcMain.handle('get-analysis-configs', async () => {
      return await this.getAnalysisConfigs();
    });

    // 고급 트레이딩 설정 저장
    ipcMain.handle('save-trading-config', async (event, config: any) => {
      return await this.saveTradingConfig(config);
    });

    // 고급 트레이딩 설정 조회
    ipcMain.handle('get-trading-config', async () => {
      return await this.getTradingConfig();
    });

    // 실제 거래 토글
    ipcMain.handle('toggle-real-trade', async (event, enabled: boolean) => {
      try {
        tradingEngine.setConfig({ enableRealTrading: enabled });
        console.log(`Real trading ${enabled ? 'enabled' : 'disabled'}`);
        return true;
      } catch (error) {
        console.error('Failed to toggle real trade:', error);
        return false;
      }
    });

    // 학습 시스템 상태 조회
    ipcMain.handle('get-learning-status', async () => {
      try {
        return tradingEngine.getLearningStatus();
      } catch (error) {
        console.error('Failed to get learning status:', error);
        return null;
      }
    });

    // 설정 초기화
    ipcMain.handle('reset-all-settings', async () => {
      try {
        // 1. 거래 설정 초기화 (App.tsx의 TradingConfig 타입과 일치)
        const defaultTradingConfig = {
          decisionThresholds: { buyThreshold: 0.15, sellThreshold: -0.2 },
          investmentRatios: { minRatio: 0.15, maxRatio: 0.5, perCoinMaxRatio: 0.2 },
          signalStrengths: {
            ma_crossover: 0.7, ma_long_trend: 0.5,
            bb_extreme: 0.8, bb_middle: 0.3,
            rsi_extreme: 0.95, rsi_middle: 0.4,
            macd_crossover: 0.9, macd_trend: 0.5,
            stoch_extreme: 0.7, stoch_middle: 0.3,
            orderbook: 0.7, trade_data: 0.6, korea_premium: 0.7,
            fear_greed_extreme: 0.9, fear_greed_middle: 0.6,
            onchain_sopr: 0.7, onchain_active_addr: 0.5
          },
          indicatorWeights: {
            MA: 0.8, MA60: 0.7, BB: 1.3, RSI: 1.5, MACD: 1.5, Stochastic: 1.3,
            Orderbook: 1.1, Trades: 0.9, KIMP: 1.2, FearGreed: 1.4, SOPR: 0.6, ActiveAddr: 0.5
          },
          indicatorUsage: {
            MA: true, MA60: true, BB: true, RSI: true, MACD: true, Stochastic: true,
            Orderbook: true, Trades: true, KIMP: true, FearGreed: true, SOPR: true, ActiveAddr: true
          },
          tradingSettings: {
            minOrderAmount: 5000,
            maxSlippage: 0.005,
            tradingInterval: 1,
            cooldown: { enabled: true, buyMinutes: 120, sellMinutes: 60, minConfidenceOverride: 0.85 },
            selling: {
              defaultSellRatio: 1.0,
              confidenceBasedAdjustment: true,
              highConfidenceMultiplier: 1.5,
              lowConfidenceMultiplier: 0.7
            },
            buying: {
              defaultBuyRatio: 0.1,
              confidenceBasedAdjustment: true,
              highConfidenceMultiplier: 1.8,
              lowConfidenceMultiplier: 0.6
            }
          }
        };
        
        // 2. 포트폴리오 초기화 (빈 배열)
        const defaultPortfolio: any[] = [];
        
        // 3. 분석 설정 초기화 (빈 배열)
        const defaultAnalysisConfigs: any[] = [];
        
        // 4. 파일에 저장
        fs.writeFileSync(this.getTradingConfigPath(), JSON.stringify(defaultTradingConfig, null, 2));
        fs.writeFileSync(this.getPortfolioPath(), JSON.stringify(defaultPortfolio, null, 2));
        fs.writeFileSync(this.getAnalysisConfigsPath(), JSON.stringify(defaultAnalysisConfigs, null, 2));
        
        // 5. 학습 데이터 초기화
        const learningDataPath = path.join(process.cwd(), 'data', 'learning');
        if (fs.existsSync(learningDataPath)) {
          const files = fs.readdirSync(learningDataPath);
          files.forEach(file => {
            fs.unlinkSync(path.join(learningDataPath, file));
          });
        }
        
        // 6. 거래 엔진에 기본 설정 적용 (거래 엔진용 타입)
        const engineConfig = {
          enableRealTrading: false,
          maxInvestmentPerCoin: 50000,
          stopLossPercent: 3,
          takeProfitPercent: 5,
          rsiOverbought: 75,
          rsiOversold: 25,
          buyingCooldown: 120,
          sellingCooldown: 60,
          minConfidenceForTrade: 75,
          sellRatio: 1.0,
          buyRatio: 0.1,
          dynamicRSI: true,
          dynamicConfidence: true,
          useKellyCriterion: true,
          maxKellyFraction: 0.1
        };
        tradingEngine.setConfig(engineConfig);
        
        console.log('All settings have been reset to defaults');
        return true;
      } catch (error) {
        console.error('Failed to reset settings:', error);
        return false;
      }
    });
  }

  private setupTradingEngine() {
    // 거래 엔진 이벤트 리스너 설정
    tradingEngine.on('tradingStarted', () => {
      this.tradingState.isRunning = true;
      this.sendStatusUpdate();
    });

    tradingEngine.on('tradingStopped', () => {
      this.tradingState.isRunning = false;
      this.sendStatusUpdate();
    });

    tradingEngine.on('aiToggled', (enabled: boolean) => {
      this.tradingState.aiEnabled = enabled;
      this.sendStatusUpdate();
    });

    tradingEngine.on('analysisCompleted', (results: any[]) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('analysis-update', results);
      }
    });

    tradingEngine.on('singleAnalysisCompleted', (analysis: any) => {
      if (this.mainWindow) {
        console.log('Sending single analysis to frontend:', analysis);
        this.mainWindow.webContents.send('analysis-update', analysis);
      }
    });

    tradingEngine.on('tradeExecuted', (trade: any) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('trade-executed', trade);
      }
    });

    tradingEngine.on('statusUpdate', (status: any) => {
      this.tradingState = {
        isRunning: status.isRunning,
        aiEnabled: status.aiEnabled,
        lastUpdate: new Date().toISOString()
      };
      this.sendStatusUpdate();
    });

    tradingEngine.on('configChanged', (config: any) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('trading-config-changed', config);
      }
    });
  }

  private sendStatusUpdate() {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('status-update', this.tradingState);
    }
  }

  private async loadSavedApiKeys() {
    try {
      const keys = await this.getApiKeys();
      if (keys.upbitAccessKey && keys.upbitSecretKey) {
        tradingEngine.setApiKeys(keys.upbitAccessKey, keys.upbitSecretKey, keys.anthropicApiKey);
        tradingEngine.setConfig({
          enableRealTrading: keys.enableRealTrade || false
        });
        console.log('Saved API keys loaded to trading engine');
      }
    } catch (error) {
      console.error('Failed to load saved API keys:', error);
    }
  }
}

new TradingApp();