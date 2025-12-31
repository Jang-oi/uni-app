/**
 * 알림 관련 IPC 핸들러
 */
import { ipcMain, Notification, shell } from 'electron'

export function registerNotificationHandlers() {
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

  console.log('[NotificationHandler] 알림 핸들러 등록 완료')
}
