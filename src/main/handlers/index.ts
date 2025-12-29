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

  // Windows 알림 권한 요청 핸들러
  ipcMain.handle('notification:request-permission', async () => {
    try {
      // Windows에서는 Notification.isSupported()로 알림 지원 확인
      if (!Notification.isSupported()) {
        console.warn('[Notification] 알림이 지원되지 않는 시스템입니다.')
        return { success: false, permission: 'denied' }
      }

      // Windows에서는 명시적 권한 요청이 없지만, 테스트 알림으로 확인
      const testNotification = new Notification({
        title: 'Uni App',
        body: '알림이 활성화되었습니다.',
        silent: true
      })
      testNotification.show()

      console.log('[Notification] 알림 권한 확인 완료')
      return { success: true, permission: 'granted' }
    } catch (error) {
      console.error('[Notification] 알림 권한 확인 실패:', error)
      return { success: false, permission: 'denied', error }
    }
  })

  // Windows 알림 설정 페이지 열기
  ipcMain.handle('notification:open-settings', async () => {
    try {
      // Windows 10/11 알림 설정 페이지 열기
      const { spawn } = require('child_process')

      // ms-settings:notifications - Windows 알림 설정
      spawn('cmd.exe', ['/c', 'start', 'ms-settings:notifications'], {
        detached: true,
        stdio: 'ignore'
      })

      console.log('[Notification] Windows 알림 설정 페이지 열기')
      return { success: true }
    } catch (error) {
      console.error('[Notification] 설정 페이지 열기 실패:', error)
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
