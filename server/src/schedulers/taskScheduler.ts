import cron from 'node-cron'
import { runTaskCrawler } from '@/crawlers/taskCrawler.js'
import { socketIO, taskData } from '@/index.js'
import {TaskData} from "@/types/task";

let isCrawling = false // 중복 실행 방지 플래그

/**
 * 현재 시간이 업무 시간인지 확인 (평일 08:00-20:00)
 */
const isBusinessHours = (): boolean => {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday, 6 = Saturday
  const hour = now.getHours()

  // Check if weekday (Monday-Friday: 1-5)
  const isWeekday = day >= 1 && day <= 5

  // Check if within business hours (08:00-20:00)
  const isWithinHours = hour >= 8 && hour < 20

  return isWeekday && isWithinHours
}

/**
 * 업무 시간 내에 크롤링 실행
 */
const executeTaskCrawling = async (): Promise<void> => {
  if (!isBusinessHours()) {
    console.log('[TaskScheduler] 업무 시간 외: 크롤링 건너뜀')
    return
  }

  if (isCrawling) {
    console.warn('[TaskScheduler] 이전 작업이 진행 중입니다. 건너뜁니다.')
    return
  }

  isCrawling = true
  try {
    console.log('[TaskScheduler] 크롤링 시작...')
    const result = await runTaskCrawler() as TaskData

    taskData.team = result.team
    taskData.members = result.members;
    taskData.lastUpdated = result.lastUpdated;

    socketIO.emit('task:updated', taskData)
    console.log('[TaskScheduler] 전역 저장소 업데이트 및 Socket 이벤트 전송 완료')

  } catch (error) {
    console.error('[TaskScheduler] 크롤링 실패:', error)
  } finally {
    isCrawling = false
  }
}

/**
 * 업무 크롤러 스케줄러 시작
 * 평일 08:00-20:00 동안 매 1분마다 실행
 */
export const startTaskScheduler = (): void => {
  cron.schedule('* * * * *', executeTaskCrawling);
}

/**
 * 서버 시작 시 초기 크롤링 실행 (업무 시간인 경우에만)
 */
export const runInitialTaskCrawling = async (): Promise<void> => {
  if (isBusinessHours()) {
    console.log('[TaskScheduler] 초기 크롤링 실행 중...')
    await executeTaskCrawling()
  } else {
    console.log('[TaskScheduler] 업무 시간 외: 초기 크롤링 건너뜀')
  }
}
