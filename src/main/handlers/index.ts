/**
 * IPC 핸들러 통합 모듈
 * 모든 핸들러를 한 곳에서 등록
 */

import os from 'os'
import { ipcMain, Notification, shell } from 'electron'
import { getUserInfoFromServer } from '../api/user'
import { registerVersionHandlers } from './versionHandler'

/**
 * 모든 IPC 핸들러 등록
 */
export function registerAllHandlers() {
  registerVersionHandlers()

  // 서버에서 사용자 정보 조회 핸들러
  ipcMain.handle('user:get-info', async () => {
    try {
      const userInfo = await getUserInfoFromServer()
      return { success: true, data: userInfo }
    } catch (error) {
      console.error('[Handler] 사용자 정보 조회 실패:', error)
      return { success: false, error }
    }
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
  ipcMain.handle('notification:show', (_event, args: { title: string; body: string; taskId?: string }) => {
    try {
      const notification = new Notification({
        title: args.title,
        body: args.body,
        timeoutType: 'default' // 알림이 유지되는 시간 설정
      })

      // 알림 클릭 시 URL 열기 (taskId가 있는 경우)
      if (args.taskId) {
        notification.on('click', async () => {
          const url = `https://114.unipost.co.kr/home.uni?access=list&srIdx=${args.taskId}`
          try {
            await shell.openExternal(url)
            console.log('[Notification] 알림 클릭으로 URL 열기:', url)
          } catch (error) {
            console.error('[Notification] URL 열기 실패:', error)
          }
        })
      }

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
