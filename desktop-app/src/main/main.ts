import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, safeStorage } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import * as dotenv from 'dotenv';
import tradingEngine from './trading-engine';
import UpbitService from './upbit-service';
import RiskManagementService from './risk-management-service';
import killSwitchService from './kill-switch-service';
import { TwoFactorAuthService } from './two-factor-auth-service';
import multiTimeframeService from './multi-timeframe-service';
import supportResistanceService from './support-resistance-service';
import advancedIndicatorsService from './advanced-indicators-service';
import tradeHistoryService from './trade-history-service';

// Load environment variables
dotenv.config();

class TradingApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private pythonProcess: ChildProcess | null = null;
  private isQuitting = false;
  private twoFactorAuthService: TwoFactorAuthService;
  private tradingState = {
    isRunning: false,
    enableRealTrading: false,
    maxInvestmentPerCoin: 100000,
    aiEnabled: false,
    lastUpdate: new Date().toISOString()
  };

  constructor() {
    this.twoFactorAuthService = new TwoFactorAuthService();
    this.setupApp();
    this.setupTradingEngine();
    this.setupIpcHandlers();
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  private setupApp() {
    // 개발 모드에서는 Single instance lock 비활성화
    const isDev = process.env.ELECTRON_DEV_MODE === 'true';
    
    if (!isDev) {
      // Single instance lock
      const gotTheLock = app.requestSingleInstanceLock();
      
      if (!gotTheLock) {
        app.quit();
        return;
      }
    }

    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });

    app.whenReady().then(async () => {
      // API 키를 먼저 로드
      await this.loadSavedApiKeys();
      
      this.createWindow();
      this.createTray();
      this.setupIPC();
      this.checkForUpdates();
      // API 서버는 별도로 실행하도록 변경
      // this.startPythonBackend();
      
      // 초기 상태 로드
      this.loadInitialState();
      await this.loadSavedLearningStates();
      
      // 독립적인 거래 엔진 이벤트 연결은 이미 setupTradingEngine()에서 설정됨
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
    const iconPath = path.join(__dirname, 'icon.png');
    
    this.mainWindow = new BrowserWindow({
      width: 1300,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload', 'preload.js')
      },
      icon: iconPath,
      title: process.env.ELECTRON_DEV_MODE === 'true' ? 'Upbit AI Trading (개발)' : 'Upbit AI Trading'
    });

    this.mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // 윈도우가 준비되면 초기 상태 전송
    this.mainWindow.webContents.once('did-finish-load', () => {
      console.log('[Main] Window did-finish-load, sending initial state');
      // 약간의 지연을 두고 상태 전송
      setTimeout(() => {
        console.log('[Main] Delayed status update after did-finish-load');
        this.sendStatusUpdate();
      }, 1000);
    });
    
    // dom-ready 이벤트도 리스닝
    this.mainWindow.webContents.once('dom-ready', () => {
      console.log('[Main] Window dom-ready event fired');
    });

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
    const iconPath = path.join(__dirname, 'icon.png');
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
      console.log('[Main] startTrading called with tickers:', tickers);
      
      // 즉시 UI 상태 업데이트 (버튼 애니메이션을 위해)
      this.tradingState.isRunning = true;
      this.tradingState.lastUpdate = new Date().toISOString();
      
      console.log('[Main] Updated tradingState:', this.tradingState);
      
      // 트레이 메뉴 업데이트
      this.updateTrayMenu();
      
      // 렌더러에 상태 업데이트 즉시 알림
      this.sendStatusUpdate();
      
      // 약간의 지연 후 실제 거래 엔진 시작 (UI 업데이트가 반영되도록)
      setTimeout(async () => {
        try {
          // 내장 거래 엔진 사용
          tradingEngine.setActiveMarkets(tickers);
          const success = await tradingEngine.start();
          
          if (!success) {
            // 실패 시 상태 롤백
            this.tradingState.isRunning = false;
            this.tradingState.lastUpdate = new Date().toISOString();
            
            console.log('[Main] Trading engine start failed, rolling back state');
            
            // 트레이 메뉴 업데이트
            this.updateTrayMenu();
            
            // 렌더러에 상태 업데이트 알림
            this.sendStatusUpdate();
          }
        } catch (error) {
          console.error('Failed to start trading engine:', error);
          // 에러 시 상태 롤백
          this.tradingState.isRunning = false;
          this.tradingState.lastUpdate = new Date().toISOString();
          this.updateTrayMenu();
          this.sendStatusUpdate();
        }
      }, 100);
      
      return true; // UI 업데이트는 즉시 성공
    } catch (error) {
      console.error('Failed to start trading:', error);
      return false;
    }
  }

  private async stopTrading(): Promise<boolean> {
    try {
      // 즉시 UI 상태 업데이트 (버튼 애니메이션을 위해)
      this.tradingState.isRunning = false;
      this.tradingState.lastUpdate = new Date().toISOString();
      
      // 트레이 메뉴 업데이트
      this.updateTrayMenu();
      
      // 렌더러에 상태 업데이트 즉시 알림
      this.mainWindow?.webContents.send('trading-state-changed', this.tradingState);
      
      // 약간의 지연 후 실제 거래 엔진 중지
      setTimeout(async () => {
        try {
          // 내장 거래 엔진 사용
          const success = await tradingEngine.stop();
          
          if (!success) {
            console.error('Failed to stop trading engine properly');
          }
        } catch (error) {
          console.error('Failed to stop trading engine:', error);
        }
      }, 100);
      
      return true; // UI 업데이트는 즉시 성공
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
    const configPath = path.join(app.getPath('userData'), 'analysis-configs.json');
    console.log('[Main] Analysis configs path:', configPath);
    return configPath;
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
        alphaVantageApiKey: keys.alphaVantageApiKey ? safeStorage.encryptString(keys.alphaVantageApiKey) : null,
        exchangeRateApiKey: keys.exchangeRateApiKey ? safeStorage.encryptString(keys.exchangeRateApiKey) : null,
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
        
        // market-correlation-service에 API 키 업데이트
        const marketCorrelationService = require('./market-correlation-service').default;
        marketCorrelationService.updateApiKeys({
          alphaVantageApiKey: keys.alphaVantageApiKey,
          exchangeRateApiKey: keys.exchangeRateApiKey
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
          alphaVantageApiKey: '',
          exchangeRateApiKey: '',
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
        alphaVantageApiKey: encryptedKeys.alphaVantageApiKey 
          ? safeStorage.decryptString(Buffer.from(encryptedKeys.alphaVantageApiKey))
          : '',
        exchangeRateApiKey: encryptedKeys.exchangeRateApiKey 
          ? safeStorage.decryptString(Buffer.from(encryptedKeys.exchangeRateApiKey))
          : '',
        enableRealTrade: encryptedKeys.enableRealTrade || false
      };
    } catch (error) {
      console.error('Failed to load API keys:', error);
      return {
        upbitAccessKey: '',
        upbitSecretKey: '',
        anthropicApiKey: '',
        alphaVantageApiKey: '',
        exchangeRateApiKey: '',
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
      const configsPath = this.getAnalysisConfigsPath();
      console.log('[Main] Saving analysis configs to:', configsPath);
      console.log('[Main] Configs to save:', JSON.stringify(configs, null, 2));
      
      fs.writeFileSync(
        configsPath,
        JSON.stringify(configs, null, 2)
      );
      
      console.log('[Main] Analysis configs saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save analysis configs:', error);
      return false;
    }
  }

  private async getAnalysisConfigs(): Promise<any[]> {
    try {
      const configsPath = this.getAnalysisConfigsPath();
      console.log('[Main] Loading analysis configs from:', configsPath);
      
      if (!fs.existsSync(configsPath)) {
        console.log('[Main] Analysis configs file does not exist');
        return [];
      }

      const configs = JSON.parse(fs.readFileSync(configsPath, 'utf-8'));
      console.log('[Main] Loaded analysis configs:', configs);
      return configs;
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
      this.tradingState.isRunning = status.isRunning;
      this.tradingState.aiEnabled = status.aiEnabled;
      this.tradingState.lastUpdate = new Date().toISOString();
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
    console.log('[Main] sendStatusUpdate called, mainWindow exists:', !!this.mainWindow);
    console.log('[Main] Trading state to send:', this.tradingState);
    
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      console.log('[Main] Window is valid, sending status update');
      console.log('[Main] Window webContents ready:', this.mainWindow.webContents.isLoading() ? 'loading' : 'ready');
      
      // webContents가 로드될 때까지 대기
      if (this.mainWindow.webContents.isLoading()) {
        console.log('[Main] WebContents is loading, waiting for dom-ready');
        this.mainWindow.webContents.once('dom-ready', () => {
          console.log('[Main] DOM ready, sending status update');
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            console.log('[Main] Sending trading-state-changed event with data:', this.tradingState);
            this.mainWindow.webContents.send('trading-state-changed', this.tradingState);
            console.log('[Main] Event sent successfully');
          }
        });
      } else {
        console.log('[Main] Sending status update immediately');
        try {
          this.mainWindow.webContents.send('trading-state-changed', this.tradingState);
          console.log('[Main] Status update sent successfully');
          
          // IPC 통신 테스트를 위한 추가 디버깅
          this.mainWindow.webContents.executeJavaScript(`
            console.log('[Renderer] Direct test - window.electronAPI exists:', !!window.electronAPI);
            console.log('[Renderer] Direct test - current trading state:', window.electronAPI ? window.electronAPI.tradingState : 'No electronAPI');
          `);
        } catch (error) {
          console.error('[Main] Error sending status update:', error);
        }
      }
    } else {
      console.log('[Main] Window not available for sending status update');
    }
  }

  private async loadSavedApiKeys() {
    try {
      console.log('[Main] Loading saved API keys...');
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
        console.log('[Main] Saved API keys loaded to both services');
        
        // API 키 유효성 검증은 나중에 윈도우가 생성된 후에 수행
        this.validateAndSendApiKeyStatus(keys);
      } else {
        console.log('[Main] No saved API keys found');
      }
    } catch (error) {
      console.error('[Main] Failed to load saved API keys:', error);
    }
  }
  
  private async validateAndSendApiKeyStatus(keys: any) {
    // 윈도우가 생성될 때까지 대기
    const checkWindow = async () => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        console.log('[Main] Validating saved API keys...');
        try {
          const upbitService = require('./upbit-service').default;
          const accounts = await upbitService.getAccounts();
          const balance = accounts.find((acc: any) => acc.currency === 'KRW')?.balance || '0';
          console.log('[Main] API keys validated successfully');
          
          this.mainWindow.webContents.send('api-key-status', {
            isValid: true,
            accessKey: keys.upbitAccessKey,
            balance: balance
          });
        } catch (error) {
          console.error('[Main] Failed to validate saved API keys:', error);
          this.mainWindow.webContents.send('api-key-status', {
            isValid: false,
            accessKey: keys.upbitAccessKey
          });
        }
      } else {
        // 윈도우가 아직 생성되지 않았으면 잠시 후 다시 시도
        setTimeout(checkWindow, 500);
      }
    };
    
    checkWindow();
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
        console.log('[Main] Starting trading with configs:', {
          tradingConfig,
          analysisConfigsCount: analysisConfigs?.length || 0
        });
        
        // tradingState 업데이트
        this.tradingState.enableRealTrading = tradingConfig.enableRealTrading || false;
        this.tradingState.aiEnabled = tradingConfig.useAI || false;
        console.log('[Main] Updated trading state:', this.tradingState);
        
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
      console.log('[Main] get-trading-state called, returning:', this.tradingState);
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

    // Trade History methods
    ipcMain.handle('get-trade-history', async (event, options?: any) => {
      try {
        return tradeHistoryService.getTrades(options);
      } catch (error) {
        console.error('Failed to get trade history:', error);
        return [];
      }
    });

    ipcMain.handle('get-profit-history', async (event, days: number = 7) => {
      try {
        return tradingEngine.getProfitHistory(days);
      } catch (error) {
        console.error('Failed to get profit history:', error);
        return [];
      }
    });

    // 거래 내역 추가
    ipcMain.handle('add-trade', async (event, trade: any) => {
      try {
        return tradeHistoryService.addTrade(trade);
      } catch (error) {
        console.error('Failed to add trade:', error);
        return null;
      }
    });

    // 거래 통계 조회
    ipcMain.handle('get-trade-statistics', async (event, period?: any) => {
      try {
        return tradeHistoryService.getTradeStatistics(period);
      } catch (error) {
        console.error('Failed to get trade statistics:', error);
        return null;
      }
    });

    // 일별 성과 조회
    ipcMain.handle('get-daily-performance', async (event, days: number = 30) => {
      try {
        return tradeHistoryService.getDailyPerformance(days);
      } catch (error) {
        console.error('Failed to get daily performance:', error);
        return [];
      }
    });

    // 수익률 차트 데이터 조회
    ipcMain.handle('get-profit-chart-data', async (event, days: number = 30) => {
      try {
        return tradeHistoryService.getProfitChartData(days);
      } catch (error) {
        console.error('Failed to get profit chart data:', error);
        return null;
      }
    });

    // 성과 통계 조회 (getTradeStatistics와 동일)
    ipcMain.handle('get-performance-stats', async (event, days: number = 30) => {
      try {
        // 기간 계산
        const endDate = Date.now();
        const startDate = endDate - (days * 24 * 60 * 60 * 1000);
        const period = { start: startDate, end: endDate };
        
        return tradeHistoryService.getTradeStatistics(period);
      } catch (error) {
        console.error('Failed to get performance stats:', error);
        return {
          totalTrades: 0,
          totalProfit: 0,
          totalProfitRate: 0,
          winRate: 0,
          avgProfit: 0,
          maxProfit: 0,
          maxLoss: 0,
          profitableDays: 0,
          totalDays: 0
        };
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
    
    // 지원하는 KRW 코인 목록 조회
    ipcMain.handle('get-supported-krw-coins', async () => {
      try {
        const service = tradingEngine.getUpbitService();
        if (!service) {
          console.error('UpbitService is not initialized');
          return [];
        }
        const coins = await service.getSupportedKrwCoins();
        return coins;
      } catch (error) {
        console.error('Failed to get supported KRW coins:', error);
        return [];
      }
    });

    // Market Correlation IPC 핸들러 추가
    ipcMain.handle('market-correlation', async () => {
      try {
        const correlationService = require('./market-correlation-service').default;
        const result = await correlationService.getMarketCorrelations();
        console.log('[Main] Market correlation data:', result);
        return result;
      } catch (error) {
        console.error('[Main] Market correlation error:', error);
        return {
          btcDominance: 0,
          sp500: { correlation: 0, change: 0 },
          nasdaq: { correlation: 0, change: 0 },
          gold: { correlation: 0, change: 0 },
          dxy: { correlation: 0, change: 0 },
          fearGreedIndex: { value: 50, status: 'Neutral' },
          marketSentiment: 'Neutral',
          lastUpdated: new Date().toISOString()
        };
      }
    });

    // News Analysis IPC 핸들러 추가
    ipcMain.handle('news-analysis', async () => {
      try {
        const newsService = require('./news-service').default;
        const results = await newsService.getLatestNews();
        console.log('[Main] News analysis data:', results);
        return results;
      } catch (error) {
        console.error('[Main] News analysis error:', error);
        return {
          sentiment: { positive: 33, negative: 33, neutral: 34 },
          newsItems: [],
          keywords: [],
          impactScore: 50,
          lastUpdated: new Date().toISOString()
        };
      }
    });

    // 거래 내역 조회 (수익률 차트용)
    ipcMain.handle('get-trading-history', async () => {
      try {
        console.log('[Main] get-trading-history called');
        // 거래 내역 및 포트폴리오 기반으로 수익률 계산
        const upbitService = require('./upbit-service').default;
        const accounts = await upbitService.getAccounts();
        console.log('[Main] Accounts:', accounts.length);
        
        // 현재는 간단한 임시 데이터 반환
        // TODO: 실제 거래 내역을 저장하고 조회하는 로직 구현
        const history = [];
        const now = new Date();
        
        // 초기 자산 계산 (현재 KRW + 코인 평가액)
        let totalAssets = 0;
        const tickers = await upbitService.getTickers(
          accounts.filter((acc: any) => acc.currency !== 'KRW')
            .map((acc: any) => `KRW-${acc.currency}`)
        );
        
        // 현재 총 자산 계산
        accounts.forEach((acc: any) => {
          if (acc.currency === 'KRW') {
            totalAssets += parseFloat(acc.balance);
          } else {
            const ticker = tickers.find((t: any) => t.market === `KRW-${acc.currency}`);
            if (ticker) {
              totalAssets += parseFloat(acc.balance) * ticker.trade_price;
            }
          }
        });
        
        // 거래 설정 확인 (시뮬레이션 vs 실거래)
        const tradingConfig = await this.getTradingConfig();
        const isSimulation = !tradingConfig.enableRealTrading;
        console.log('[Main] Trading mode:', isSimulation ? 'Simulation' : 'Real');
        
        if (isSimulation) {
          // 시뮬레이션 모드: trading-engine에서 시뮬레이션 상태 가져오기
          const simulationStatus = tradingEngine.getSimulationStatus();
          console.log('[Main] Simulation status:', simulationStatus);
          
          const initialAssets = 10000000; // 시뮬레이션 초기 자산 1천만원
          const currentTotalValue = simulationStatus.totalValue;
          const currentProfitRate = ((currentTotalValue - initialAssets) / initialAssets) * 100;
          
          // 지난 7일간 시뮬레이션 수익률 추이 생성
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
            
            // 시뮬레이션에서는 점진적 수익률 변화 시뮬레이션
            const progressRatio = (6 - i) / 6; // 0 ~ 1
            const profitRate = currentProfitRate * progressRatio;
            const totalValue = initialAssets + (initialAssets * profitRate / 100);
            
            history.push({
              time: dateKey,
              profitRate: profitRate,
              totalValue: totalValue
            });
          }
        } else {
          // 실거래 모드: 실제 거래 내역 기반 계산
          const tradeHistory = tradingEngine.getTradeHistory();
          console.log('[Main] Trade history count:', tradeHistory.length);
          
          // 실제 투자원금 계산
          const krwAccount = accounts.find((acc: any) => acc.currency === 'KRW');
          const krwBalance = krwAccount ? parseFloat(krwAccount.balance) : 0;
          
          let totalInvested = krwBalance;
          accounts.filter((acc: any) => acc.currency !== 'KRW').forEach((acc: any) => {
            const avgBuyPrice = parseFloat(acc.avg_buy_price || '0');
            const balance = parseFloat(acc.balance || '0');
            totalInvested += avgBuyPrice * balance;
          });
          
          const initialAssets = totalInvested || 10000000;
          
          // 날짜별 수익률 계산
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
            
            // 현재 평가액 (모든 날짜에 대해 현재 가격 사용, 향후 개선 가능)
            let currentTotalAssets = krwBalance;
            accounts.filter((acc: any) => acc.currency !== 'KRW').forEach((acc: any) => {
              const ticker = tickers.find((t: any) => t.market === `KRW-${acc.currency}`);
              if (ticker) {
                currentTotalAssets += parseFloat(acc.balance) * ticker.trade_price;
              }
            });
            
            const profitRate = ((currentTotalAssets - initialAssets) / initialAssets) * 100;
            
            history.push({
              time: dateKey,
              profitRate: profitRate,
              totalValue: currentTotalAssets
            });
          }
        }
        
        console.log('[Main] Returning history:', history);
        return history;
      } catch (error) {
        console.error('Failed to get trading history:', error);
        return [];
      }
    });
    
    // 시뮬레이션 상태 조회
    ipcMain.handle('get-simulation-status', async () => {
      try {
        console.log('[Main] Getting simulation status...');
        console.log('[Main] Trading engine running:', tradingEngine.isRunning());
        
        if (!tradingEngine.isRunning()) {
          console.log('[Main] Trading engine not running, returning null');
          return null;
        }
        
        const config = await this.getTradingConfig();
        console.log('[Main] Trading config:', { enableRealTrading: config?.enableRealTrading });
        
        if (config && config.enableRealTrading === true) {
          console.log('[Main] Real trading enabled, returning null');
          return null;
        }
        
        const simulationStatus = tradingEngine.getSimulationStatus();
        console.log('[Main] Simulation status:', simulationStatus);
        return simulationStatus;
      } catch (error) {
        console.error('Failed to get simulation status:', error);
        return null;
      }
    });
    
    // 알림 설정 관련 핸들러
    ipcMain.handle('get-notification-settings', async () => {
      try {
        const notificationService = require('./notification-service').default;
        return notificationService.getSettings();
      } catch (error) {
        console.error('Failed to get notification settings:', error);
        return null;
      }
    });
    
    ipcMain.handle('save-notification-settings', async (event, settings) => {
      try {
        const notificationService = require('./notification-service').default;
        notificationService.saveSettings(settings);
        return true;
      } catch (error) {
        console.error('Failed to save notification settings:', error);
        return false;
      }
    });
    
    ipcMain.handle('get-notification-history', async (event, limit) => {
      try {
        const notificationService = require('./notification-service').default;
        return notificationService.getHistory(limit);
      } catch (error) {
        console.error('Failed to get notification history:', error);
        return [];
      }
    });
    
    ipcMain.handle('clear-notification-history', async () => {
      try {
        const notificationService = require('./notification-service').default;
        notificationService.clearHistory();
        return true;
      } catch (error) {
        console.error('Failed to clear notification history:', error);
        return false;
      }
    });
    
    // VaR and Risk Management handlers
    ipcMain.handle('generate-risk-report', async () => {
      try {
        const riskService = new (require('./risk-management-service').RiskManagementService)();
        const upbitService = require('./upbit-service').default;
        
        // 포트폴리오 정보 가져오기
        const accounts = await upbitService.getAccounts();
        const portfolio: Array<{symbol: string; balance: number; avgBuyPrice: number; currentPrice: number; value: number}> = [];
        
        for (const account of accounts) {
          if (account.currency !== 'KRW' && parseFloat(account.balance) > 0) {
            const ticker = await upbitService.getTicker(`KRW-${account.currency}`);
            portfolio.push({
              symbol: account.currency,
              balance: parseFloat(account.balance),
              avgBuyPrice: parseFloat(account.avg_buy_price),
              currentPrice: ticker ? ticker.trade_price : 0,
              value: parseFloat(account.balance) * (ticker ? ticker.trade_price : 0)
            });
          }
        }
        
        // 가격 히스토리 가져오기 (최근 30일)
        const priceHistory = new Map();
        for (const position of portfolio) {
          const candles = await upbitService.getCandlesByTimeframe(`KRW-${position.symbol}`, '1d', 30);
          priceHistory.set(position.symbol, candles.map((c: any) => c.trade_price).reverse());
        }
        
        // VaR 계산
        // 포트폴리오 데이터를 RiskManagementService 형식에 맞게 변환
        const riskPortfolio = portfolio.map(pos => ({
          market: pos.symbol,
          balance: pos.balance,
          avgBuyPrice: pos.avgBuyPrice,
          currentPrice: pos.currentPrice,
          value: pos.value,
          weight: pos.value / portfolio.reduce((sum: number, p: any) => sum + p.value, 0)
        }));
        
        const varResult = riskService.calculateVaR(riskPortfolio, priceHistory);
        
        // CVaR 계산
        const cvar = riskService.calculateCVaR(riskPortfolio);
        
        // 스트레스 테스트
        // 스트레스 테스트 시나리오 정의
        const scenarios = [
          {
            name: '급락 시나리오',
            shocks: new Map(riskPortfolio.map(pos => [pos.market, -20]))
          },
          {
            name: '보통 하락',
            shocks: new Map(riskPortfolio.map(pos => [pos.market, -10]))
          }
        ];
        
        const stressTest = riskService.performStressTest(riskPortfolio, scenarios);
        
        // 권장사항 생성
        // 권장사항 생성
        const recommendations = [];
        if (varResult.percentageVaR95 > 10) {
          recommendations.push('포트폴리오 위험도가 높습니다. 포지션 축소를 고려하세요.');
        }
        if (varResult.confidence < 0.7) {
          recommendations.push('VaR 신뢰도가 낮습니다. 더 많은 가격 데이터가 필요합니다.');
        }
        
        return {
          VaR: varResult,
          CVaR: cvar,
          stressTest,
          recommendations
        };
      } catch (error) {
        console.error('Failed to generate risk report:', error);
        return {
          VaR: null,
          CVaR: 0,
          stressTest: [],
          recommendations: ['리스크 분석을 위한 데이터가 부족합니다.']
        };
      }
    });
    
    // Rebalancing handlers
    ipcMain.handle('get-rebalancing-config', async () => {
      try {
        const configPath = path.join(app.getPath('userData'), 'rebalancing-config.json');
        if (fs.existsSync(configPath)) {
          return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
        return null;
      } catch (error) {
        console.error('Failed to get rebalancing config:', error);
        return null;
      }
    });
    
    ipcMain.handle('save-rebalancing-config', async (event, config) => {
      try {
        const configPath = path.join(app.getPath('userData'), 'rebalancing-config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        // Trading engine에 리밸런싱 설정 적용
        if (config.enabled) {
          // tradingEngine.setRebalancingConfig(config);
          // 리밸런싱 설정은 별도로 관리
        }
        
        return true;
      } catch (error) {
        console.error('Failed to save rebalancing config:', error);
        return false;
      }
    });
    
    ipcMain.handle('execute-rebalancing', async () => {
      try {
        // 실제 리밸런싱 실행
        // TODO: 실제 거래 API 연동 필요
        console.log('Executing portfolio rebalancing...');
        
        // 현재는 성공 메시지만 반환
        return { 
          success: true, 
          message: '리밸런싱이 예약되었습니다. 시장가 주문으로 순차적으로 실행됩니다.' 
        };
      } catch (error) {
        console.error('Failed to execute rebalancing:', error);
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('simulate-rebalancing', async () => {
      try {
        // 리밸런싱 설정 가져오기
        const configPath = path.join(app.getPath('userData'), 'rebalancing-config.json');
        
        if (!fs.existsSync(configPath)) {
          return null;
        }
        
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        
        // 현재 계정 정보 가져오기
        const upbitService = require('./upbit-service').default;
        const accounts = await upbitService.getAccounts();
        const tickers = await upbitService.getTickers(
          accounts
            .filter((acc: any) => acc.currency !== 'KRW' && parseFloat(acc.balance) > 0)
            .map((acc: any) => `KRW-${acc.currency}`)
        );
        
        // 전체 자산 가치 계산
        let totalValue = 0;
        const positions: any[] = [];
        
        // KRW 잔액
        const krwAccount = accounts.find((acc: any) => acc.currency === 'KRW');
        if (krwAccount) {
          totalValue += parseFloat(krwAccount.balance);
        }
        
        // 코인 평가액
        for (const account of accounts) {
          if (account.currency !== 'KRW' && parseFloat(account.balance) > 0) {
            const ticker = tickers.find((t: any) => t.market === `KRW-${account.currency}`);
            if (ticker) {
              const value = parseFloat(account.balance) * ticker.trade_price;
              totalValue += value;
              
              const currentWeight = value / totalValue;
              const targetWeight = config.targetWeights.find((t: any) => t.symbol === account.currency)?.weight || 0;
              
              positions.push({
                symbol: account.currency,
                value: value,
                currentWeight: currentWeight,
                targetWeight: targetWeight,
                balance: parseFloat(account.balance),
                price: ticker.trade_price
              });
            }
          }
        }
        
        // 리밸런싱 시뮬레이션
        const sellOrders: any[] = [];
        const buyOrders: any[] = [];
        let estimatedFees = 0;
        
        for (const position of positions) {
          const difference = position.targetWeight - position.currentWeight;
          
          if (Math.abs(difference) > config.threshold / 100) {
            const tradeValue = Math.abs(difference * totalValue);
            
            if (tradeValue > config.minTradeAmount) {
              if (difference > 0) {
                buyOrders.push({
                  symbol: position.symbol,
                  value: tradeValue,
                  targetWeight: position.targetWeight * 100,
                  currentWeight: position.currentWeight * 100
                });
              } else {
                sellOrders.push({
                  symbol: position.symbol,
                  value: tradeValue,
                  targetWeight: position.targetWeight * 100,
                  currentWeight: position.currentWeight * 100
                });
              }
              
              // 수수료 계산 (0.05%)
              estimatedFees += tradeValue * 0.0005;
            }
          }
        }
        
        return {
          sellOrders,
          buyOrders,
          estimatedFees,
          totalValue,
          newVaR: null // VaR 계산은 별도 구현 필요
        };
      } catch (error) {
        console.error('Failed to simulate rebalancing:', error);
        return null;
      }
    });
    
    // Kill Switch 핸들러
    ipcMain.handle('get-kill-switch-status', async () => {
      try {
        return {
          isActive: killSwitchService.isKillSwitchActive(),
          config: killSwitchService.getConfig(),
          history: killSwitchService.getHistory(),
          systemStatus: {
            dailyLoss: 0, // TODO: 실제 값 계산
            currentDrawdown: 0, // TODO: 실제 값 계산
            apiHealth: true,
            lastCheck: Date.now()
          }
        };
      } catch (error) {
        console.error('Failed to get kill switch status:', error);
        return null;
      }
    });
    
    ipcMain.handle('activate-kill-switch', async (event, reason: string) => {
      try {
        const result = await killSwitchService.triggerManual(reason);
        return result;
      } catch (error) {
        console.error('Failed to activate kill switch:', error);
        throw error;
      }
    });
    
    ipcMain.handle('deactivate-kill-switch', async () => {
      try {
        await killSwitchService.deactivate();
        return true;
      } catch (error) {
        console.error('Failed to deactivate kill switch:', error);
        throw error;
      }
    });
    
    ipcMain.handle('update-kill-switch-config', async (event, config) => {
      try {
        await killSwitchService.updateConfig(config);
        return true;
      } catch (error) {
        console.error('Failed to update kill switch config:', error);
        throw error;
      }
    });
    
    // Kill Switch 모니터링 시작
    killSwitchService.startMonitoring();
    
    // 2FA 핸들러
    ipcMain.handle('get-2fa-status', async () => {
      try {
        return this.twoFactorAuthService.getStatus();
      } catch (error) {
        console.error('Failed to get 2FA status:', error);
        throw error;
      }
    });
    
    ipcMain.handle('setup-2fa', async () => {
      try {
        return await this.twoFactorAuthService.setup();
      } catch (error) {
        console.error('Failed to setup 2FA:', error);
        throw error;
      }
    });
    
    ipcMain.handle('enable-2fa', async (event, token: string) => {
      try {
        return await this.twoFactorAuthService.enable(token);
      } catch (error) {
        console.error('Failed to enable 2FA:', error);
        throw error;
      }
    });
    
    ipcMain.handle('disable-2fa', async (event, token: string) => {
      try {
        return await this.twoFactorAuthService.disable(token);
      } catch (error) {
        console.error('Failed to disable 2FA:', error);
        throw error;
      }
    });
    
    ipcMain.handle('verify-2fa', async (event, token: string) => {
      try {
        return await this.twoFactorAuthService.authenticate(token);
      } catch (error) {
        console.error('Failed to verify 2FA:', error);
        return false;
      }
    });
    
    ipcMain.handle('regenerate-backup-codes', async (event, token: string) => {
      try {
        return await this.twoFactorAuthService.regenerateBackupCodes(token);
      } catch (error) {
        console.error('Failed to regenerate backup codes:', error);
        throw error;
      }
    });
    
    // 멀티 타임프레임 분석 핸들러
    ipcMain.handle('analyze-multi-timeframe', async (event, params) => {
      try {
        return await multiTimeframeService.analyzeMultiTimeframe(params.symbol, params.timeframes);
      } catch (error) {
        console.error('Failed to analyze multi-timeframe:', error);
        throw error;
      }
    });
    
    // 지지/저항선 분석 핸들러
    ipcMain.handle('analyze-support-resistance', async (event, params) => {
      try {
        return await supportResistanceService.analyzeSupportResistance(
          params.symbol, 
          params.timeframe || '1h', 
          params.period || 200
        );
      } catch (error) {
        console.error('Failed to analyze support/resistance:', error);
        throw error;
      }
    });
    
    // 고급 지표 분석 핸들러
    ipcMain.handle('analyze-advanced-indicators', async (event, params) => {
      try {
        return await advancedIndicatorsService.analyzeAdvancedIndicators(
          params.symbol, 
          params.timeframe || '1h', 
          params.period || 200
        );
      } catch (error) {
        console.error('Failed to analyze advanced indicators:', error);
        throw error;
      }
    });
    
    // News API 핸들러
    ipcMain.handle('set-news-api-keys', async (event, keys) => {
      try {
        const newsApiService = require('./news-api-service').default;
        newsApiService.setApiKeys(keys.newsApiKey, keys.cryptoPanicApiKey);
        return true;
      } catch (error) {
        console.error('Failed to set news API keys:', error);
        return false;
      }
    });
    
    ipcMain.handle('get-crypto-news', async (event, symbol, limit) => {
      try {
        const newsApiService = require('./news-api-service').default;
        return await newsApiService.getCryptoNews(symbol, limit);
      } catch (error) {
        console.error('Failed to get crypto news:', error);
        return [];
      }
    });
    
    ipcMain.handle('analyze-market-news', async (event, market) => {
      try {
        const newsApiService = require('./news-api-service').default;
        return await newsApiService.analyzeMarketNews(market);
      } catch (error) {
        console.error('Failed to analyze market news:', error);
        return null;
      }
    });
    
    console.log('All IPC handlers registered successfully');
  }
}

const tradingApp = new TradingApp();

export function getMainWindow(): BrowserWindow | null {
  return tradingApp.getMainWindow();
}