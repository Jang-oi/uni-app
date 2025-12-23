import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { updateHyperVStatus } from './api/hyperv'
// import { getAllTasksFromServer, getTasksByUserFromServer } from './api/task' // 사용 안 함 (Renderer가 직접 서버 호출)
import { appConfig } from './config'
import { getSchedulerStatus, runTaskCrawlerManually, runVacationCrawlerManually, startScheduler, stopScheduler } from './crawler/scheduler'
import { createHyperVMonitor } from './hyperv/monitor'
import { hasValidCredentials, loadCredentials, saveCredentials } from './store'

let mainWindow: BrowserWindow | null = null

// HyperV 모니터 인스턴스 생성 (함수형)
const hypervMonitor = createHyperVMonitor(async (vmName: string, userName: string | null) => {
  try {
    await updateHyperVStatus(vmName, userName)
  } catch (error) {
    console.error('[HyperV] 서버 업데이트 실패:', error)
  }
})

export const uniIcon = is.dev
  ? join(__dirname, '../../build/unicorn3.ico') // 개발 환경 경로
  : join(process.resourcesPath, 'unicorn3.ico') // 빌드된 앱(프로덕션) 경로

function createWindow(): void {
  // 브라우저 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 800,
    height: 920,
    show: false,
    title: 'Uni App',
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
    console.log('[App] 일반 모드로 실행 (관리자 기능은 인증 후 사용 가능)')
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

  // ==================== 관리자 인증 ====================

  /**
   * 관리자 비밀번호 확인
   */
  ipcMain.handle('admin:verify-password', async (_event, password: string) => {
    const isValid = password === appConfig.adminPassword
    console.log('[Admin] 비밀번호 인증:', isValid ? '성공' : '실패')
    return { success: isValid }
  })

  /**
   * 저장된 자격증명 로드
   */
  ipcMain.handle('credentials:load', async () => {
    const creds = loadCredentials()
    console.log('[Credentials] 자격증명 로드')
    return { success: true, data: creds }
  })

  /**
   * 자격증명 저장
   */
  ipcMain.handle('credentials:save', async (_event, credentials) => {
    saveCredentials(credentials)
    console.log('[Credentials] 자격증명 저장됨')
    return { success: true }
  })

  /**
   * 자격증명 유효성 확인
   */
  ipcMain.handle('credentials:validate', async () => {
    const isValid = hasValidCredentials()
    return { success: true, isValid }
  })

  // ==================== 크롤러 제어 ====================

  /**
   * 크롤러 스케줄러 시작 (Master 모드 활성화)
   */
  ipcMain.handle('crawler:start-scheduler', async () => {
    const status = getSchedulerStatus()
    if (status.isRunning) {
      console.log('[Crawler] 이미 실행 중입니다')
      return { success: false, message: '이미 실행 중입니다' }
    }

    if (!hasValidCredentials()) {
      console.log('[Crawler] 자격증명이 설정되지 않았습니다')
      return { success: false, message: '자격증명을 먼저 설정하세요' }
    }

    await startScheduler()
    console.log('[Crawler] 스케줄러 시작됨')

    return { success: true }
  })

  /**
   * 크롤러 스케줄러 정지 (Master 모드 비활성화)
   */
  ipcMain.handle('crawler:stop-scheduler', async () => {
    const status = getSchedulerStatus()
    if (!status.isRunning) {
      console.log('[Crawler] 실행 중이 아닙니다')
      return { success: false, message: '실행 중이 아닙니다' }
    }

    stopScheduler()

    console.log('[Crawler] 스케줄러 정지됨')
    return { success: true }
  })

  /**
   * 휴가 크롤러 수동 실행
   */
  ipcMain.handle('crawler:run-vacation', async () => {
    if (!hasValidCredentials()) {
      return { success: false, message: '자격증명을 먼저 설정하세요' }
    }

    await runVacationCrawlerManually()
    return { success: true }
  })

  /**
   * 업무 크롤러 수동 실행
   */
  ipcMain.handle('crawler:run-task', async () => {
    if (!hasValidCredentials()) {
      return { success: false, message: '자격증명을 먼저 설정하세요' }
    }

    await runTaskCrawlerManually()
    return { success: true }
  })

  /**
   * 크롤러 상태 확인
   */
  ipcMain.handle('crawler:status', async () => {
    const status = getSchedulerStatus()
    return {
      success: true,
      isRunning: status.isRunning
    }
  })

  // 메인 윈도우 생성
  createWindow()

  // HyperV 모니터 시작 (모든 앱)
  hypervMonitor.start()
  console.log('[App] HyperV 모니터링 백그라운드 서비스 시작')

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
  // 크롤러 정지 (실행 중이었다면)
  const status = getSchedulerStatus()
  if (status.isRunning) {
    stopScheduler()
  }

  // HyperV 모니터 정지
  hypervMonitor.stop()
  console.log('[App] HyperV 모니터링 백그라운드 서비스 종료')

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
