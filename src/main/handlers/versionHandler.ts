/**
 * 버전 관리 및 자동 업데이트 관련 IPC 핸들러
 */

import fs from 'fs'
import path from 'path'
import { ipcMain } from 'electron'
import { checkForUpdates, downloadUpdate, getCurrentVersion, installUpdate } from '../updater'

export function registerVersionHandlers() {
  /**
   * 버전 히스토리 조회
   */
  ipcMain.handle('updater:get-history', async () => {
    try {
      const historyPath = path.join(process.cwd(), 'version-history.json')
      const historyData = fs.readFileSync(historyPath, 'utf-8')
      const history = JSON.parse(historyData)
      console.log('[Updater] 버전 히스토리 조회 성공')
      return { success: true, history }
    } catch (error) {
      console.error('[Updater] 버전 히스토리 조회 실패:', error)
      return { success: false, history: [] }
    }
  })
  /**
   * 현재 버전 조회
   */
  ipcMain.handle('updater:get-version', async () => {
    const version = getCurrentVersion()
    console.log('[Updater] 현재 버전:', version)
    return { success: true, version }
  })

  /**
   * 업데이트 확인
   */
  ipcMain.handle('updater:check', async () => {
    try {
      console.log('[Updater] 업데이트 확인 시작')
      await checkForUpdates()
      return { success: true }
    } catch (error) {
      console.error('[Updater] 업데이트 확인 실패:', error)
      return { success: false, message: error instanceof Error ? error.message : '업데이트 확인 실패' }
    }
  })

  /**
   * 업데이트 다운로드
   */
  ipcMain.handle('updater:download', async () => {
    try {
      console.log('[Updater] 업데이트 다운로드 시작')
      await downloadUpdate()
      return { success: true }
    } catch (error) {
      console.error('[Updater] 업데이트 다운로드 실패:', error)
      return { success: false, message: error instanceof Error ? error.message : '다운로드 실패' }
    }
  })

  /**
   * 업데이트 설치 및 재시작
   */
  ipcMain.handle('updater:install', async () => {
    try {
      console.log('[Updater] 업데이트 설치 시작')
      installUpdate()
      return { success: true }
    } catch (error) {
      console.error('[Updater] 업데이트 설치 실패:', error)
      return { success: false, message: error instanceof Error ? error.message : '설치 실패' }
    }
  })
}
