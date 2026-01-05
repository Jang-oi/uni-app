/**
 * 알림 관련 IPC 핸들러
 */
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { BrowserWindow, ipcMain, nativeImage, Notification, shell } from 'electron'

const getIconPath = (type?: string) => {
  const iconFolder = is.dev ? join(__dirname, '../../build') : join(process.resourcesPath, '/')

  switch (type) {
    case 'task-support':
      return join(iconFolder, 'task_support.png')
    case 'task-check':
      return join(iconFolder, 'task_check.png')
    case 'vm-request':
      return join(iconFolder, 'vm_request.png')
    case 'vm-approved':
      return join(iconFolder, 'vm_approved.png')
    case 'vm-rejected':
      return join(iconFolder, 'vm_rejected.png')
    default:
      return join(iconFolder, 'logo.png') // 기본 로고
  }
}

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
        senderName?: string
        notificationType?: 'task-check' | 'task-support' | 'vm-request' | 'vm-approved' | 'vm-rejected'
      }
    ) => {
      try {
        const iconPath = getIconPath(args.notificationType)

        const notificationOptions: Electron.NotificationConstructorOptions = {
          title: args.title,
          body: args.body,
          icon: nativeImage.createFromPath(iconPath),
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
              vmName: args.vmName,
              senderName: args.senderName
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
}
