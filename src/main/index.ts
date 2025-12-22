import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { appConfig } from './config'
import { getSchedulerStatus, runTaskCrawlerManually, runVacationCrawlerManually, startScheduler, stopScheduler } from './crawler/scheduler'
import { hasValidCredentials, loadCredentials, saveCredentials } from './store'
import { createHyperVMonitor } from './hyperv/monitor'
import { getHyperVStatusList, updateHyperVStatus } from './api/hyperv'
// Express 서버 구현 후 주석 해제
// import { getVacationsByMonthFromServer } from './api/vacation'
// import { getAllTasksFromServer, getTasksByUserFromServer } from './api/task'
// 임시: Mock 데이터 사용 (서버 구현 전까지)
import { filterVacationsByMonth, getAllTasks, getTasksByUser } from './mockdata/loader'

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

  // ==================== 데이터 조회 (Mock / 서버 전환 가능) ====================

  /**
   * 월별 휴가 데이터 조회
   */
  ipcMain.handle('supabase:get-vacations', async (_event, year: string, month: string) => {
    try {
      // Express 서버 구현 후 주석 해제
      // const data = await getVacationsByMonthFromServer(year, month)

      // 임시: Mock 데이터 사용
      const data = filterVacationsByMonth(year, month)

      return { success: true, data }
    } catch (error) {
      console.error('[Data] 휴가 조회 실패:', error)
      return { success: false, error: (error as Error).message, data: [] }
    }
  })

  /**
   * 전체 휴가 개수 조회
   */
  ipcMain.handle('supabase:get-vacations-count', async () => {
    try {
      // Mock 데이터에서는 카운트 조회 불필요 (임시로 0 반환)
      return { success: true, count: 0 }
    } catch (error) {
      console.error('[Data] 휴가 카운트 조회 실패:', error)
      return { success: false, error: (error as Error).message, count: 0 }
    }
  })

  /**
   * 전체 업무 데이터 조회
   */
  ipcMain.handle('supabase:get-tasks', async () => {
    try {
      // Express 서버 구현 후 주석 해제
      // const data = await getAllTasksFromServer()

      // 임시: Mock 데이터 사용
      const data = getAllTasks()

      return { success: true, data }
    } catch (error) {
      console.error('[Data] 업무 조회 실패:', error)
      return { success: false, error: (error as Error).message, data: [] }
    }
  })

  /**
   * 사용자별 업무 조회
   */
  ipcMain.handle('supabase:get-tasks-by-user', async (_event, usId: string) => {
    try {
      // Express 서버 구현 후 주석 해제
      // const data = await getTasksByUserFromServer(usId)

      // 임시: Mock 데이터 사용
      const data = getTasksByUser(usId)

      return { success: true, data }
    } catch (error) {
      console.error('[Data] 사용자 업무 조회 실패:', error)
      return { success: false, error: (error as Error).message, data: [] }
    }
  })

  /**
   * 전체 업무 개수 조회
   */
  ipcMain.handle('supabase:get-tasks-count', async () => {
    try {
      // Mock 데이터에서는 카운트 조회 불필요 (임시로 0 반환)
      return { success: true, count: 0 }
    } catch (error) {
      console.error('[Data] 업무 카운트 조회 실패:', error)
      return { success: false, error: (error as Error).message, count: 0 }
    }
  })

  // ==================== HyperV 모니터 제어 ====================

  /**
   * HyperV 모니터 상태 조회
   */
  ipcMain.handle('hyperv:get-status', async () => {
    try {
      const status = hypervMonitor.getStatus()
      return { success: true, data: status }
    } catch (error) {
      console.error('[HyperV] 상태 조회 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * HyperV 모니터 시작
   */
  ipcMain.handle('hyperv:start', async () => {
    try {
      hypervMonitor.start()
      return { success: true }
    } catch (error) {
      console.error('[HyperV] 시작 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * HyperV 모니터 정지
   */
  ipcMain.handle('hyperv:stop', async () => {
    try {
      hypervMonitor.stop()
      return { success: true }
    } catch (error) {
      console.error('[HyperV] 정지 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 서버에서 HyperV 상태 목록 조회
   */
  ipcMain.handle('hyperv:get-list', async () => {
    try {
      const data = await getHyperVStatusList()
      return { success: true, data }
    } catch (error) {
      console.error('[HyperV] 목록 조회 실패:', error)
      return { success: false, error: (error as Error).message, data: [] }
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
