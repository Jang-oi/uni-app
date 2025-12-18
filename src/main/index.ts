import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { isMasterMode, validateConfig } from './config'
import { crawlerBrowser } from './crawler/browser'
import { crawlerScheduler } from './crawler/scheduler'
import { socketClient } from './socket/client'

let mainWindow: BrowserWindow | null = null

export const uniIcon = is.dev
  ? join(__dirname, '../../build/unicorn3.ico') // 개발 환경 경로
  : join(process.resourcesPath, 'unicorn3.ico') // 빌드된 앱(프로덕션) 경로

function createWindow(): void {
  // 설정 유효성 검사
  const validation = validateConfig()
  if (!validation.valid) {
    console.error('[Config] 설정 오류:')
    validation.errors.forEach((error) => console.error('  -', error))
  }

  // 브라우저 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 800,
    height: 860,
    show: false,
    title: `Uni App ${isMasterMode() ? '(Master)' : '(Client)'}`,
    icon: uniIcon,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    console.log(`[App] ${isMasterMode() ? 'Master' : 'Client'} 모드로 실행`)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 크롤러 수동 실행 (Master 모드 전용)
  if (isMasterMode()) {
    ipcMain.handle('crawler:run-vacation', async () => {
      await crawlerScheduler.runVacationCrawler()
      return { success: true }
    })

    ipcMain.handle('crawler:run-task', async () => {
      await crawlerScheduler.runTaskCrawler()
      return { success: true }
    })
  }

  // 메인 윈도우 생성
  createWindow()

  // Socket.io 클라이언트 연결
  if (mainWindow) {
    socketClient.setMainWindow(mainWindow)
    socketClient.connect()
  }

  // TODO: HyperV 모니터 시작 (모든 앱)
  // hypervMonitor.start()

  // Master 모드일 때만 크롤러 시작
  if (isMasterMode()) {
    console.log('[App] Master 모드 - 크롤러 기능 활성화')
    crawlerScheduler.start()
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Socket 연결 해제
  socketClient.disconnect()

  // 크롤러 정지
  if (isMasterMode()) {
    crawlerScheduler.stop()
    crawlerBrowser.destroy()
  }

  // TODO: HyperV 모니터 정지
  // hypervMonitor.stop()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
