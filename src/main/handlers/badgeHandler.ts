/**
 * 배지 관련 IPC 핸들러
 */
import { BrowserWindow, ipcMain, nativeImage } from 'electron'

export function registerBadgeHandlers() {
  // 인자를 (count, dataUrl) 두 개로 받도록 수정
  ipcMain.handle('badge:set-count', (_event, count: number, badgeData: string | null) => {
    try {
      const mainWindow = BrowserWindow.getAllWindows()[0]
      if (!mainWindow) return { success: false }

      if (count > 0 && badgeData) {
        // 전달받은 PNG 이미지로 오버레이 설정
        const badgeIcon = nativeImage.createFromDataURL(badgeData)
        mainWindow.setOverlayIcon(badgeIcon, `${count}개의 알림`)
      } else {
        mainWindow.setOverlayIcon(null, '')
      }

      return { success: true }
    } catch (error) {
      console.error('[Badge] 배지 업데이트 실패:', error)
      return { success: false }
    }
  })
}
