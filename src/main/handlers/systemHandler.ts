/**
 * 시스템 정보 관련 IPC 핸들러
 */
import os from 'os'
import { ipcMain } from 'electron'

export function registerSystemHandlers() {
  // hostname 조회 핸들러
  ipcMain.handle('system:get-hostname', () => {
    return os.hostname()
  })

  console.log('[SystemHandler] 시스템 정보 핸들러 등록 완료')
}
