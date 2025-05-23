import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

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

    app.whenReady().then(() => {
      this.createWindow();
      this.createTray();
      this.setupIPC();
      this.startPythonBackend();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
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

  private setupIPC() {
    ipcMain.handle('get-trading-state', () => {
      return this.tradingState;
    });

    ipcMain.handle('start-trading', async () => {
      return await this.startTrading();
    });

    ipcMain.handle('stop-trading', async () => {
      return await this.stopTrading();
    });

    ipcMain.handle('toggle-ai', async (event, enabled: boolean) => {
      return await this.toggleAI(enabled);
    });

    ipcMain.handle('minimize-to-tray', () => {
      this.mainWindow?.hide();
    });
  }

  private startPythonBackend() {
    const pythonPath = path.join(__dirname, '..', '..', '..', 'src', 'main.py');
    
    try {
      // Python 프로세스 시작 (실제로는 FastAPI 서버를 시작해야 함)
      console.log('Python backend would start here:', pythonPath);
      // this.pythonProcess = spawn('python', [pythonPath]);
      
      // 실제 구현시에는 FastAPI 서버와 통신
    } catch (error) {
      console.error('Failed to start Python backend:', error);
    }
  }

  private async startTrading(): Promise<boolean> {
    try {
      // Python 백엔드에 자동매매 시작 요청
      this.tradingState.isRunning = true;
      this.tradingState.lastUpdate = new Date().toISOString();
      
      // 트레이 메뉴 업데이트
      this.updateTrayMenu();
      
      // 렌더러에 상태 업데이트 알림
      this.mainWindow?.webContents.send('trading-state-changed', this.tradingState);
      
      return true;
    } catch (error) {
      console.error('Failed to start trading:', error);
      return false;
    }
  }

  private async stopTrading(): Promise<boolean> {
    try {
      // Python 백엔드에 자동매매 중지 요청
      this.tradingState.isRunning = false;
      this.tradingState.lastUpdate = new Date().toISOString();
      
      // 트레이 메뉴 업데이트
      this.updateTrayMenu();
      
      // 렌더러에 상태 업데이트 알림
      this.mainWindow?.webContents.send('trading-state-changed', this.tradingState);
      
      return true;
    } catch (error) {
      console.error('Failed to stop trading:', error);
      return false;
    }
  }

  private async toggleAI(enabled: boolean): Promise<boolean> {
    try {
      // Python 백엔드에 AI 설정 변경 요청
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
}

new TradingApp();