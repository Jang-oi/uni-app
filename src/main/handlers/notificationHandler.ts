/**
 * 알림 관련 IPC 핸들러
 */
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { BrowserWindow, ipcMain, nativeImage, Notification, shell } from 'electron'

const getIconPath = (type?: string) => {
  const iconFolder = is.dev ? join(__dirname, '../../build') : join(process.resourcesPath, '/')
  if (!type) return join(iconFolder, 'task-check.png')

  return join(iconFolder, `${type}.png`)
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
        const mainWindow = BrowserWindow.getAllWindows()[0]
        if (mainWindow) {
          // 작업표시줄 반짝임 효과
          mainWindow.flashFrame(true)
          // 사용자가 창을 확인(포커스)하면 반짝임 중지
          mainWindow.once('focus', () => {
            mainWindow.flashFrame(false)
          })
        }

        // 알림 클릭 시 처리
        notification.on('click', async () => {
          const mainWindow = BrowserWindow.getAllWindows()[0]
          if (!mainWindow) {
            console.error('[Notification] Main Window를 찾을 수 없습니다')
            return
          }

          // 앱 포커스
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
          mainWindow.flashFrame(false)

          // taskId가 있으면 외부 URL 열기 (업무 관련)
          if (args.taskId) {
            const url = `https://114.unipost.co.kr/home.uni?access=list&srIdx=${args.taskId}`
            try {
              await shell.openExternal(url)
            } catch (error) {
              console.error('[Notification] URL 열기 실패:', error)
            }
          }
        })

        notification.show()
        return { success: true }
      } catch (error) {
        console.error('[Notification] 알림 표시 실패:', error)
        return { success: false, error }
      }
    }
  )
}
