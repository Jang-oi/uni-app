/**
 * 크롤러 스케줄러 (함수형 프로그래밍)
 * node-cron을 사용한 주기적 크롤링 실행
 */

import cron, { ScheduledTask } from 'node-cron'
import { runTaskCrawler } from './task'

/**
 * 스케줄러 상태 (불변성 유지)
 */
type SchedulerState = {
  taskJob: ScheduledTask | null
  isRunning: boolean
}

let schedulerState: SchedulerState = {
  taskJob: null,
  isRunning: false
}

/**
 * 초기 크롤링 즉시 실행
 */
const runInitialCrawl = async (): Promise<void> => {
  console.log('[CrawlerScheduler] 초기 크롤링 시작')

  try {
    // 업무 크롤링 (비동기)
    await runTaskCrawler()

    console.log('[CrawlerScheduler] 초기 크롤링 완료')
  } catch (error) {
    console.error('[CrawlerScheduler] 초기 크롤링 오류:', error)
  }
}

/**
 * 업무 크롤링 스케줄 Job 생성
 */
const createTaskJob = (cronExpression = '*/1 * * * *'): ScheduledTask => {
  return cron.schedule(cronExpression, async () => {
    console.log('[CrawlerScheduler] 업무 크롤링 실행 (정기)')
    try {
      await runTaskCrawler()
    } catch (error) {
      console.error('[CrawlerScheduler] 업무 크롤링 오류:', error)
    }
  })
}

/**
 * 스케줄러 시작
 */
export const startScheduler = async (): Promise<void> => {
  if (schedulerState.isRunning) {
    console.log('[CrawlerScheduler] 이미 실행 중입니다.')
    return
  }

  console.log('[CrawlerScheduler] 스케줄러 시작')

  // 스케줄 Job 생성
  schedulerState = {
    taskJob: createTaskJob(),
    isRunning: true
  }

  // 시작 시 즉시 1회 실행
  await runInitialCrawl()

  console.log('[CrawlerScheduler] 휴가 크롤링: 09시, 12시, 18시')
  console.log('[CrawlerScheduler] 업무 크롤링: 매 1분')
}

/**
 * 스케줄러 정지
 */
export const stopScheduler = (): void => {
  if (!schedulerState.isRunning) {
    console.log('[CrawlerScheduler] 스케줄러가 실행 중이 아닙니다.')
    return
  }

  if (schedulerState.taskJob) {
    schedulerState.taskJob.stop()
  }

  // 상태 초기화
  schedulerState = {
    taskJob: null,
    isRunning: false
  }

  console.log('[CrawlerScheduler] 스케줄러 정지')
}

/**
 * 수동 업무 크롤링 실행
 */
export const runTaskCrawlerManually = async (): Promise<void> => {
  console.log('[CrawlerScheduler] 업무 크롤링 수동 실행')
  try {
    await runTaskCrawler()
  } catch (error) {
    console.error('[CrawlerScheduler] 업무 크롤링 수동 실행 오류:', error)
  }
}

/**
 * 스케줄 변경 (런타임 중 조정 가능)
 */
export const updateSchedule = (type: 'vacation' | 'task', cronExpression: string): void => {
  console.log(`[CrawlerScheduler] ${type} 스케줄 변경: ${cronExpression}`)

  if (!schedulerState.isRunning) {
    console.log('[CrawlerScheduler] 스케줄러가 실행 중이 아니므로 변경할 수 없습니다.')
    return
  }

  if (type === 'task' && schedulerState.taskJob) {
    schedulerState.taskJob.stop()
    schedulerState.taskJob = createTaskJob(cronExpression)
  }
}

/**
 * 현재 스케줄러 상태 조회
 */
export const getSchedulerStatus = (): { isRunning: boolean } => {
  return { isRunning: schedulerState.isRunning }
}
