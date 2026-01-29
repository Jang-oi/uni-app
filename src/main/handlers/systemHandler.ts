/**
 * 시스템 정보 관련 IPC 핸들러
 */
import os from 'os'
import { BrowserWindow, ipcMain } from 'electron'

export function registerSystemHandlers() {
  // hostname 조회 핸들러
  ipcMain.handle('system:get-hostname', () => {
    return os.hostname()
  })

  // 창 최소화 핸들러
  ipcMain.handle('window:minimize', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) window.minimize()
  })
}
