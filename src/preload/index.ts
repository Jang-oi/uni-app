import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
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
