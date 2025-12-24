/**
 * 크롤러 제어 관련 IPC 핸들러
 */

import { ipcMain } from 'electron'
import { getSchedulerStatus, runTaskCrawlerManually, startScheduler, stopScheduler } from '../crawler/scheduler'
import { hasValidCredentials } from '../store'

export function registerCrawlerHandlers() {
  /**
   * 크롤러 스케줄러 시작 (Master 모드 활성화)
   */
  ipcMain.handle('crawler:start-scheduler', async () => {
    const status = getSchedulerStatus()
    if (status.isRunning) {
      console.log('[Crawler] 이미 실행 중입니다')
      return { success: false, message: '이미 실행 중입니다' }
    }

    if (!hasValidCredentials()) {
      console.log('[Crawler] 자격증명이 설정되지 않았습니다')
      return { success: false, message: '자격증명을 먼저 설정하세요' }
    }

    await startScheduler()
    console.log('[Crawler] 스케줄러 시작됨')

    return { success: true }
  })

  /**
   * 크롤러 스케줄러 정지 (Master 모드 비활성화)
   */
  ipcMain.handle('crawler:stop-scheduler', async () => {
    const status = getSchedulerStatus()
    if (!status.isRunning) {
      console.log('[Crawler] 실행 중이 아닙니다')
      return { success: false, message: '실행 중이 아닙니다' }
    }

    stopScheduler()

    console.log('[Crawler] 스케줄러 정지됨')
    return { success: true }
  })

  /**
   * 업무 크롤러 수동 실행
   */
  ipcMain.handle('crawler:run-task', async () => {
    if (!hasValidCredentials()) {
      return { success: false, message: '자격증명을 먼저 설정하세요' }
    }

    await runTaskCrawlerManually()
    return { success: true }
  })

  /**
   * 크롤러 상태 확인
   */
  ipcMain.handle('crawler:status', async () => {
    const status = getSchedulerStatus()
    return {
      success: true,
      isRunning: status.isRunning
    }
  })
}
