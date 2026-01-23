import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, Menu, shell, Tray } from 'electron'
import { sendHyperVHeartbeat } from './api/hyperv'
import { registerAllHandlers } from './handlers'
import { createHyperVMonitor } from './hyperv/monitor'
import { initAutoUpdater } from './updater'

let mainWindow: BrowserWindow | null = null
let tray: Tray
let isQuiting = false

// HyperV 모니터 인스턴스 생성 (함수형)
const hypervMonitor = createHyperVMonitor(async (activeVMs: string[], userName: string) => {
  try {
    await sendHyperVHeartbeat(activeVMs, userName)
  } catch (error) {
    console.error('[HyperV] Heartbeat 전송 실패:', error)
  }
})

export const uniIcon = is.dev
  ? join(__dirname, '../../build/unicorn.ico') // 개발 환경 경로
  : join(process.resourcesPath, 'unicorn.ico') // 빌드된 앱(프로덕션) 경로

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
  })

  // 앱이 포커스되거나 보여질 때 renderer에 알림 (서버 재연결용)
  mainWindow.on('show', () => {
    mainWindow?.webContents.send('app:focused')
  })
  mainWindow.on('focus', () => {
    mainWindow?.webContents.send('app:focused')
  })

  // 4. 창이 닫힐 때 종료되는 대신 트레이로 최소화되도록 설정
  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault()
      mainWindow?.minimize() // 대신 창 숨김
    }
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

// Electron 중복 실행 방지
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // 이미 앱이 실행 중이면 종료
  app.quit()
} else {
  // 두 번째 인스턴스 실행 시도 시 기존 창 포커스
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.company.unipost.uni.app')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    registerAllHandlers()

    createTray()
    createWindow()
    initAutoUpdater(mainWindow)
    hypervMonitor.start()

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

const createTray = () => {
  tray = new Tray(uniIcon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '종료',
      click: () => {
        isQuiting = true // 실제 종료를 위한 플래그 설정
        app.quit()
      }
    }
  ])

  tray.setToolTip('Uni-App')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow?.show()
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  hypervMonitor.stop()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
