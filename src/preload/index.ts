import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  // ==================== Socket.io 이벤트 리스너 ====================
  onVacationUpdated: (callback: (data: any) => void) => {
    ipcRenderer.on('vacation:updated', (_event, data) => callback(data))
  },
  onTaskUpdated: (callback: (data: any) => void) => {
    ipcRenderer.on('task:updated', (_event, data) => callback(data))
  },
  onTaskAlert: (callback: (data: any) => void) => {
    ipcRenderer.on('task:alert', (_event, data) => callback(data))
  },
  onHypervStatus: (callback: (data: any) => void) => {
    ipcRenderer.on('hyperv:status', (_event, data) => callback(data))
  },
  onHypervRequest: (callback: (data: any) => void) => {
    ipcRenderer.on('hyperv:request-received', (_event, data) => callback(data))
  },
  onMasterRevoked: (callback: (data: any) => void) => {
    ipcRenderer.on('master:revoked', (_event, data) => callback(data))
  },

  // ==================== 관리자 인증 ====================
  verifyAdminPassword: async (password: string) => {
    return await ipcRenderer.invoke('admin:verify-password', password)
  },

  // ==================== 자격증명 관리 ====================
  loadCredentials: async () => {
    return await ipcRenderer.invoke('credentials:load')
  },
  saveCredentials: async (credentials: any) => {
    return await ipcRenderer.invoke('credentials:save', credentials)
  },
  validateCredentials: async () => {
    return await ipcRenderer.invoke('credentials:validate')
  },

  // ==================== 크롤러 제어 ====================
  startCrawlerScheduler: async () => {
    return await ipcRenderer.invoke('crawler:start-scheduler')
  },
  stopCrawlerScheduler: async () => {
    return await ipcRenderer.invoke('crawler:stop-scheduler')
  },
  runVacationCrawler: async () => {
    return await ipcRenderer.invoke('crawler:run-vacation')
  },
  runTaskCrawler: async () => {
    return await ipcRenderer.invoke('crawler:run-task')
  },
  getCrawlerStatus: async () => {
    return await ipcRenderer.invoke('crawler:status')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
