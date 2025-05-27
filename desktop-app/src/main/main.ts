import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, safeStorage } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import * as dotenv from 'dotenv';
import tradingEngine from './trading-engine';

// Load environment variables
dotenv.config();

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
    this.setupIpcHandlers();
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
      this.checkForUpdates();
      // API 서버는 별도로 실행하도록 변경
      // this.startPythonBackend();
      
      // 3초 후 초기화 작업 수행
      setTimeout(async () => {
        this.loadInitialState();
        await this.loadSavedApiKeys();
        await this.loadSavedLearningStates();
        
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
    const iconPath = path.join(__dirname, 'main', 'icon.png');
    
    this.mainWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload', 'preload.js')
      },
      icon: iconPath,
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
    const iconPath = path.join(__dirname, 'main', 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    // 트레이 아이콘 크기 조정 (16x16 or 22x22 for better visibility)
    const trayIcon = icon.resize({ width: 16, height: 16 });
    this.tray = new Tray(trayIcon);
    
    // 트레이 툴팁 설정
    this.tray.setToolTip('Upbit AI Trading');
    
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
    return path.join(__dirname, 'main', 'icon.png');
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

  private async loadSavedLearningStates() {
    try {
      console.log('[Main] Loading saved learning states...');
      const savedStates = await this.getLearningStates();
      console.log('[Main] Saved states:', savedStates);
      
      if (savedStates && savedStates.length > 0) {
        console.log('[Main] Found saved learning states:', savedStates);
        
        const learningService = tradingEngine.getLearningService();
        if (learningService) {
          // 저장된 상태 복원
          savedStates.forEach(state => {
            if (state.isRunning) {
              console.log(`[Main] Restoring learning for ${state.ticker}`);
              learningService.startLearning(state.ticker);
            }
          });
          
          // 프론트엔드에 학습 상태 전송
          setTimeout(() => {
            console.log('[Main] Sending learning states to frontend');
            this.mainWindow?.webContents.send('learning-progress', savedStates);
          }, 1000);
        } else {
          console.log('[Main] Learning service not available');
        }
      } else {
        console.log('[Main] No saved learning states found');
      }
    } catch (error) {
      console.error('[Main] Failed to load saved learning states:', error);
    }
  }

  private checkForUpdates() {
    // 개발 모드에서는 업데이트 체크 안 함
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Skipping auto-updater');
      return;
    }

    // 업데이트 서버 설정 (GitHub Releases 사용)
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'leebohyeon1',
      repo: 'upbit-ai-trading',
      private: true,
      token: process.env.GH_TOKEN  // GitHub Personal Access Token
    });

    // 자동 다운로드 설정
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    // 업데이트 이벤트 핸들러
    autoUpdater.on('checking-for-update', () => {
      console.log('업데이트 확인 중...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('업데이트 발견:', info.version);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-available', info);
      }
    });

    autoUpdater.on('update-not-available', () => {
      console.log('최신 버전입니다.');
    });

    autoUpdater.on('error', (err) => {
      console.error('업데이트 오류:', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const log_message = '다운로드 속도: ' + progressObj.bytesPerSecond + 
                         ' - 다운로드됨 ' + progressObj.percent + '%' +
                         ' (' + progressObj.transferred + "/" + progressObj.total + ')';
      console.log(log_message);
      
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-progress', progressObj);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('업데이트 다운로드 완료');
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-downloaded', info);
        
        // 사용자에게 재시작 알림
        const { dialog } = require('electron');
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: '업데이트 준비됨',
          message: '새 버전이 다운로드되었습니다. 지금 재시작하시겠습니까?',
          buttons: ['재시작', '나중에'],
          defaultId: 0
        }).then((result: Electron.MessageBoxReturnValue) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall();
          }
        });
      }
    });

    // 업데이트 확인 시작
    autoUpdater.checkForUpdatesAndNotify();
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

  private getLearningStatesPath(): string {
    return path.join(app.getPath('userData'), 'learning-states.json');
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

  private async saveLearningStates(states?: any[]): Promise<boolean> {
    try {
      const learningService = tradingEngine.getLearningService();
      if (!learningService) return false;
      
      // states가 제공되지 않으면 현재 상태 가져오기
      const statesToSave = states || learningService.getLearningStates();
      
      fs.writeFileSync(
        this.getLearningStatesPath(),
        JSON.stringify(statesToSave, null, 2)
      );
      return true;
    } catch (error) {
      console.error('Failed to save learning states:', error);
      return false;
    }
  }

  private async getLearningStates(): Promise<any[]> {
    try {
      const statesPath = this.getLearningStatesPath();
      
      if (!fs.existsSync(statesPath)) {
        return [];
      }

      return JSON.parse(fs.readFileSync(statesPath, 'utf-8'));
    } catch (error) {
      console.error('Failed to load learning states:', error);
      return [];
    }
  }

  private setupIPC() {
    // start-trading은 setupIpcHandlers()에서 처리하므로 여기서는 제거

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

    // 학습 상태 저장
    ipcMain.handle('save-learning-states', async (event, states: any[]) => {
      return await this.saveLearningStates(states);
    });

    // 학습 상태 조회
    ipcMain.handle('get-learning-states', async () => {
      return await this.getLearningStates();
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
        const learningDataPath = path.join(app.getPath('userData'), 'learning');
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
        console.log('Sending analysis results to frontend:', results.length, 'items');
        this.mainWindow.webContents.send('analysis-completed', results);
      }
    });

    tradingEngine.on('singleAnalysisCompleted', (analysis: any) => {
      if (this.mainWindow) {
        console.log('Sending single analysis to frontend:', analysis);
        this.mainWindow.webContents.send('single-analysis-completed', analysis);
      }
    });

    tradingEngine.on('tradeExecuted', (trade: any) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('trade-executed', trade);
        
        // 학습 상태도 즉시 업데이트하도록 알림
        if (trade.type === 'SELL' && trade.profit !== undefined) {
          this.mainWindow.webContents.send('learning-updated', {
            market: trade.market,
            profit: trade.profit
          });
        }
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

    // 학습 상태 변경 이벤트 처리
    tradingEngine.on('learningStateChanged', async (states: any[]) => {
      console.log('Learning state changed, saving...', states);
      await this.saveLearningStates(states);
      
      if (this.mainWindow) {
        this.mainWindow.webContents.send('learning-progress', states);
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
        // upbitService에도 설정
        const upbitService = require('./upbit-service').default;
        upbitService.setApiKeys(keys.upbitAccessKey, keys.upbitSecretKey);
        
        // tradingEngine에 설정
        tradingEngine.setApiKeys(keys.upbitAccessKey, keys.upbitSecretKey, keys.anthropicApiKey);
        tradingEngine.setConfig({
          enableRealTrading: keys.enableRealTrade || false
        });
        console.log('Saved API keys loaded to both services');
        
        // API 키 유효성 검증 후 렌더러에 상태 전송
        console.log('Validating saved API keys...');
        try {
          const accounts = await upbitService.getAccounts();
          const balance = accounts.find((acc: any) => acc.currency === 'KRW')?.balance || '0';
          console.log('API keys validated successfully');
          
          // 앱이 완전히 로드될 때까지 잠시 대기
          setTimeout(() => {
            this.mainWindow?.webContents.send('api-key-status', {
              isValid: true,
              accessKey: keys.upbitAccessKey,
              balance: balance
            });
          }, 1000);
        } catch (error) {
          console.error('Failed to validate saved API keys:', error);
          // 검증 실패 시에도 상태 전송
          setTimeout(() => {
            this.mainWindow?.webContents.send('api-key-status', {
              isValid: false,
              accessKey: keys.upbitAccessKey
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to load saved API keys:', error);
    }
  }

  private setupIpcHandlers() {
    console.log('Setting up IPC handlers...');
    // API Key validation
    ipcMain.handle('validate-api-key', async (event, accessKey: string, secretKey: string, claudeApiKey?: string) => {
      try {
        const upbitService = require('./upbit-service').default;
        upbitService.setApiKeys(accessKey, secretKey);
        const accounts = await upbitService.getAccounts();
        
        // trading engine에도 즉시 설정
        tradingEngine.setApiKeys(accessKey, secretKey, claudeApiKey);
        
        return {
          isValid: true,
          accessKey: accessKey,
          balance: accounts.find((acc: any) => acc.currency === 'KRW')?.balance || '0'
        };
      } catch (error) {
        console.error('API key validation failed:', error);
        return {
          isValid: false,
          accessKey: accessKey,
          balance: '0'
        };
      }
    });

    // Account methods
    ipcMain.handle('get-accounts', async () => {
      try {
        const upbitService = require('./upbit-service').default;
        return await upbitService.getAccounts();
      } catch (error) {
        console.error('Failed to get accounts:', error);
        return [];
      }
    });

    // Market methods
    ipcMain.handle('get-markets', async () => {
      try {
        const upbitService = require('./upbit-service').default;
        return await upbitService.getMarkets();
      } catch (error) {
        console.error('Failed to get markets:', error);
        return [];
      }
    });

    ipcMain.handle('get-tickers', async (event, symbols: string[]) => {
      try {
        const upbitService = require('./upbit-service').default;
        return await upbitService.getTickers(symbols);
      } catch (error) {
        console.error('Failed to get tickers:', error);
        return [];
      }
    });

    // Trading methods
    ipcMain.handle('start-trading', async (event, tradingConfig: any, analysisConfigs: any[]) => {
      try {
        console.log('Starting trading with configs:', {
          tradingConfig,
          analysisConfigsCount: analysisConfigs?.length || 0
        });
        
        // analysisConfigs가 없으면 포트폴리오에서 가져오기
        if (!analysisConfigs || analysisConfigs.length === 0) {
          const portfolio = JSON.parse(fs.readFileSync(this.getPortfolioPath(), 'utf-8') || '[]');
          const enabledCoins = portfolio.filter((coin: any) => coin.enabled);
          
          if (enabledCoins.length === 0) {
            console.error('No enabled coins in portfolio');
            return false;
          }
          
          // 기본 설정으로 analysisConfigs 생성
          analysisConfigs = enabledCoins.map((coin: any) => ({
            ticker: `KRW-${coin.symbol}`,
            rsiOverbought: 75,
            rsiOversold: 25,
            minConfidenceForBuy: 65,
            minConfidenceForSell: 60,
            // ... 기타 기본값
          }));
        }
        
        // 설정 업데이트
        tradingEngine.updateConfig(tradingConfig);
        
        // 쿨타임 속성명 마이그레이션 (기존 buyingCooldown/sellingCooldown → buyCooldown/sellCooldown)
        if (analysisConfigs && analysisConfigs.length > 0) {
          analysisConfigs = analysisConfigs.map(config => {
            if ('buyingCooldown' in config && !('buyCooldown' in config)) {
              config.buyCooldown = config.buyingCooldown;
              delete config.buyingCooldown;
            }
            if ('sellingCooldown' in config && !('sellCooldown' in config)) {
              config.sellCooldown = config.sellingCooldown;
              delete config.sellingCooldown;
            }
            return config;
          });
          
          console.log('First config cooldowns after migration:', {
            ticker: analysisConfigs[0].ticker,
            buyCooldown: analysisConfigs[0].buyCooldown,
            sellCooldown: analysisConfigs[0].sellCooldown,
            originalBuyingCooldown: analysisConfigs[0].buyingCooldown,
            originalSellingCooldown: analysisConfigs[0].sellingCooldown
          });
        }
        
        // 분석 설정 전달 (UI에서 설정한 코인별 거래 파라미터)
        tradingEngine.setAnalysisConfigs(analysisConfigs);
        
        // AI 설정
        tradingEngine.toggleAI(tradingConfig.useAI || false);
        
        // 거래 시작 (analysisConfigs에서 시장 목록 추출)
        const markets = analysisConfigs.map(config => {
          // config.ticker가 이미 KRW-를 포함하고 있을 수 있음
          return config.ticker.startsWith('KRW-') ? config.ticker : `KRW-${config.ticker}`;
        });
        return await this.startTrading(markets);
      } catch (error) {
        console.error('Failed to start trading:', error);
        return false;
      }
    });

    ipcMain.handle('get-trading-state', async () => {
      return this.tradingState;
    });

    // Backtest methods
    ipcMain.handle('run-backtest', async (event, ticker: string, startDate: string, endDate: string, config: any) => {
      try {
        const backtestService = require('./backtest-service').default;
        return await backtestService.runBacktest(ticker, startDate, endDate, config);
      } catch (error) {
        console.error('Backtest failed:', error);
        throw error;
      }
    });

    // Learning methods
    ipcMain.handle('start-learning', async (event, ticker: string) => {
      try {
        const learningService = tradingEngine.getLearningService();
        if (learningService) {
          learningService.startLearning(ticker);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to start learning:', error);
        return false;
      }
    });

    ipcMain.handle('stop-learning', async (event, ticker: string) => {
      try {
        const learningService = tradingEngine.getLearningService();
        if (learningService) {
          learningService.stopLearning(ticker);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to stop learning:', error);
        return false;
      }
    });

    ipcMain.handle('get-learning-metrics', async (event, ticker: string) => {
      try {
        const learningService = tradingEngine.getLearningService();
        if (!learningService) return null;

        const stats = learningService.getPerformanceStats(ticker, 30);
        const indicatorPerformance = learningService.getIndicatorPerformance();
        const performanceHistory = tradingEngine.getTradeHistory(ticker, 30);

        // Kelly Criterion 계산
        let kellyFraction = 0;
        if (stats.total_trades >= 10) {
          kellyFraction = tradingEngine.calculateKellyForMarket(ticker);
        }

        return {
          ticker,
          isRunning: learningService.isLearningEnabled(ticker),
          totalTrades: stats.total_trades,
          winRate: stats.win_rate * 100,
          averageProfit: stats.average_profit,
          bestTrade: stats.best_trade,
          worstTrade: stats.worst_trade,
          sharpeRatio: stats.sharpe_ratio,
          kellyFraction,
          lastUpdated: new Date(),
          indicatorWeights: indicatorPerformance.map(ind => ({
            name: ind.indicator.toUpperCase(),
            weight: ind.weight,
            successRate: ind.success_rate,
            confidence: ind.confidence
          })),
          performanceHistory: performanceHistory.map(trade => ({
            date: new Date(trade.timestamp).toISOString().split('T')[0],
            winRate: trade.winRate || 0,
            profit: trade.profitRate || 0
          }))
        };
      } catch (error) {
        console.error('Failed to get learning metrics:', error);
        return null;
      }
    });

    ipcMain.handle('toggle-learning', async (event, ticker: string, enabled: boolean) => {
      try {
        const learningService = tradingEngine.getLearningService();
        if (!learningService) return false;

        if (enabled) {
          learningService.startLearning(ticker);
        } else {
          learningService.stopLearning(ticker);
        }
        
        // 학습 상태 저장
        await this.saveLearningStates();
        
        // 변경된 학습 상태를 프론트엔드로 전달
        const states = learningService.getLearningStates();
        this.mainWindow?.webContents.send('learning-progress', states);
        
        return true;
      } catch (error) {
        console.error('Failed to toggle learning:', error);
        return false;
      }
    });

    // Settings methods - already registered above

    // reset-all-settings 핸들러는 이미 존재함

    // 쿨타임 정보 조회
    ipcMain.handle('get-cooldown-info', async (event, market: string) => {
      try {
        const cooldownInfo = tradingEngine.getCooldownInfo(market);
        return cooldownInfo;
      } catch (error) {
        console.error('Failed to get cooldown info:', error);
        return {
          market,
          buyRemaining: 0,
          sellRemaining: 0,
          canBuy: true,
          canSell: true
        };
      }
    });

    // 학습 가중치 정보 조회
    ipcMain.handle('get-weight-learning-info', async (event, market: string) => {
      try {
        const learningService = tradingEngine.getLearningService();
        const learnedWeights = learningService.getCoinWeights(market);
        const globalWeights = learningService.getWeights();
        
        // 조정값 계산 (학습 가중치 / 기본 가중치)
        const defaultWeights = {
          rsi: 1.0, macd: 1.0, bollinger: 1.0, stochastic: 0.8,
          volume: 1.0, atr: 0.8, obv: 0.7, adx: 0.8,
          volatility: 1.0, trendStrength: 1.0, aiAnalysis: 1.2,
          newsImpact: 1.0, whaleActivity: 0.8,
          // learning-service에서 사용하는 추가 지표들
          bb_position: 0.8, volume_ratio: 0.9, stochastic_rsi: 0.9,
          obv_trend: 0.8, news_sentiment: 1.2, whale_activity: 1.1,
          market_trend: 1.0
        };
        
        const adjustments: any = {};
        const weights = learnedWeights || globalWeights;
        
        if (weights) {
          Object.keys(defaultWeights).forEach(key => {
            adjustments[key] = weights[key] / defaultWeights[key as keyof typeof defaultWeights];
          });
        }
        
        // 성능 통계 가져오기
        const performance = learningService.getPerformanceStats(market);
        
        return {
          enabled: true,
          mode: learnedWeights ? 'individual' : 'global',
          adjustments,
          performance: {
            trades: performance.total_trades,
            winRate: performance.win_rate,
            avgProfit: performance.average_profit,
            lastUpdated: Date.now()
          }
        };
      } catch (error) {
        console.error('Failed to get weight learning info:', error);
        return null;
      }
    });
    
    console.log('All IPC handlers registered successfully');
  }
}

new TradingApp();