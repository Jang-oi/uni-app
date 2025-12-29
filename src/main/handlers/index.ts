/**
 * IPC 핸들러 통합 모듈
 * 모든 핸들러를 한 곳에서 등록
 */

import { ipcMain, Notification, shell } from 'electron'
import os from 'os'
import { getUserName } from '../config'
import { registerVersionHandlers } from './versionHandler'

/**
 * 모든 IPC 핸들러 등록
 */
export function registerAllHandlers() {
  registerVersionHandlers()

  // 사용자 정보 조회 핸들러
  ipcMain.handle('user:get-name', () => {
    return getUserName()
  })

  // 외부 URL 열기 핸들러
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url)
      return { success: true }
    } catch (error) {
      console.error('[Shell] 외부 URL 열기 실패:', error)
      return { success: false, error }
    }
  })

  // Windows 네이티브 알림 핸들러
  ipcMain.handle('notification:show', (_event, args: { title: string; body: string }) => {
    try {
      const notification = new Notification({
        title: args.title,
        body: args.body,
        silent: false // 소리 포함
      })

      notification.show()
      console.log('[Notification] 알림 표시:', args.title)

      return { success: true }
    } catch (error) {
      console.error('[Notification] 알림 표시 실패:', error)
      return { success: false, error }
    }
  })

  // hostname 조회 핸들러
  ipcMain.handle('system:get-hostname', () => {
    return os.hostname()
  })

  console.log('[Handlers] 모든 IPC 핸들러 등록 완료')
}
