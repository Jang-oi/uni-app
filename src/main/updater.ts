/**
 * Electron 자동 업데이트 관리
 * GitHub Releases를 통한 자동 업데이트
 */

import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

export function initAutoUpdater(mainWindow: BrowserWindow | null) {
  // 자동 다운로드 비활성화 (수동으로 다운로드 시작)
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // 개발 환경에서도 업데이트 확인 가능하도록 설정
  if (is.dev) {
    autoUpdater.updateConfigPath = join(__dirname, '../../dev-app-update.yml')
    autoUpdater.forceDevUpdateConfig = true
  }

  // 업데이트 확인 이벤트
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for update...')
    mainWindow?.webContents.send('updater:checking')
  })

  // 업데이트 가능 이벤트
  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version)
    mainWindow?.webContents.send('updater:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  })

  // 업데이트 없음 이벤트
  autoUpdater.on('update-not-available', (info) => {
    console.log('[Updater] Update not available. Current version:', info.version)
    mainWindow?.webContents.send('updater:not-available', {
      version: info.version
    })
  })

  // 다운로드 진행 이벤트
  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`[Updater] Download progress: ${progressObj.percent}%`)
    mainWindow?.webContents.send('updater:progress', {
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total
    })
  })

  // 다운로드 완료 이벤트
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded:', info.version)
    mainWindow?.webContents.send('updater:downloaded', {
      version: info.version
    })
  })

  // 에러 이벤트
  autoUpdater.on('error', (error) => {
    console.error('[Updater] Error:', error)
    mainWindow?.webContents.send('updater:error', {
      message: error.message
    })
  })
}

/**
 * 업데이트 확인
 */
export async function checkForUpdates() {
  try {
    const result = await autoUpdater.checkForUpdates()
    return result
  } catch (error) {
    console.error('[Updater] Check for updates error:', error)
    throw error
  }
}

/**
 * 업데이트 다운로드 시작
 */
export async function downloadUpdate() {
  try {
    await autoUpdater.downloadUpdate()
  } catch (error) {
    console.error('[Updater] Download update error:', error)
    throw error
  }
}

/**
 * 업데이트 설치 및 재시작
 */
export function installUpdate() {
  autoUpdater.quitAndInstall(false, true)
}

/**
 * 현재 버전 정보 가져오기
 */
export function getCurrentVersion() {
  return require('../../package.json').version
}
