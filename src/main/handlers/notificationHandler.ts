/**
 * 알림 관련 IPC 핸들러
 */
import { BrowserWindow, ipcMain, Notification, shell } from 'electron'

export function registerNotificationHandlers() {
  // Windows 네이티브 알림 핸들러 (업그레이드)
  ipcMain.handle(
    'notification:show',
    (
      _event,
      args: {
        title: string
        body: string
        taskId?: string
        vmName?: string
        notificationType?: 'task-check' | 'task-support' | 'vm-request' | 'vm-approved' | 'vm-rejected'
      }
    ) => {
      try {
        const notificationOptions: Electron.NotificationConstructorOptions = {
          title: args.title,
          body: args.body,
          timeoutType: 'default'
        }

        const notification = new Notification(notificationOptions)

        // 알림 클릭 시 처리
        notification.on('click', async () => {
          const mainWindow = BrowserWindow.getAllWindows()[0]
          if (!mainWindow) {
            console.error('[Notification] Main Window를 찾을 수 없습니다')
            return
          }

          // 앱 포커스
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()

          // taskId가 있으면 외부 URL 열기 (업무 관련)
          if (args.taskId) {
            const url = `https://114.unipost.co.kr/home.uni?access=list&srIdx=${args.taskId}`
            try {
              await shell.openExternal(url)
              console.log('[Notification] 알림 클릭으로 URL 열기:', url)
            } catch (error) {
              console.error('[Notification] URL 열기 실패:', error)
            }
          }

          // VM 요청 알림 클릭 시 Renderer에 이벤트 전송 (알림 페이지 이동 + 다이얼로그 오픈)
          if (args.notificationType === 'vm-request' && args.vmName) {
            mainWindow.webContents.send('notification:vm-request-clicked', {
              vmName: args.vmName
            })
            console.log('[Notification] VM 요청 알림 클릭:', args.vmName)
          }

          // VM 결과 알림 클릭 시 Renderer에 이벤트 전송
          if (args.notificationType === 'vm-approved' || args.notificationType === 'vm-rejected') {
            mainWindow.webContents.send('notification:vm-result-clicked', {
              type: args.notificationType,
              vmName: args.vmName
            })
          }
        })

        notification.show()
        console.log('[Notification] 알림 표시:', args.title)

        return { success: true }
      } catch (error) {
        console.error('[Notification] 알림 표시 실패:', error)
        return { success: false, error }
      }
    }
  )

  console.log('[NotificationHandler] 알림 핸들러 등록 완료')
}
