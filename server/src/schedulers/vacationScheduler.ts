import cron from 'node-cron'
import { runVacationCrawler } from '@/crawlers/vacationCrawler.js'
import {calendarData, socketIO} from '@/index.js'
import {processCalendarData} from "@/services/vacationService";
import {VacationData} from "@/types/calendar";

/**
 * 휴가 데이터 크롤링 실행
 */
const executeVacationCrawling = async (): Promise<void> => {
    try {
        console.log('[VacationScheduler] 정기 휴가 데이터 업데이트 시작...')
        const result = await runVacationCrawler() as VacationData
        console.log('[VacationScheduler] 업데이트 완료:', result)

        calendarData.vacationsDate = processCalendarData(result.response);

        socketIO.emit('calendar:updated', calendarData)
        console.log('[VacationScheduler] 전역 저장소 업데이트 및 Socket 이벤트 전송 완료')
    } catch (error) {
        console.error('[VacationScheduler] 실행 실패:', error)
    }
}

/**
 * 휴가 크롤러 스케줄러 시작
 * 매일 오전 08:00, 오후 13:00 실행
 */
export const startVacationScheduler = (): void => {
    // 1. 오전 8시 0분 실행
    cron.schedule('0 8 * * *', async () => {
        await executeVacationCrawling()
    })

    // 2. 오후 1시 0분 실행
    cron.schedule('0 13 * * *', async () => {
        await executeVacationCrawling()
    })

    console.log('[VacationScheduler] 스케줄러 시작: 매일 08:00, 13:00')
}

/**
 * 서버 시작 시 즉시 실행이 필요한 경우 사용
 */
export const runInitialVacationCrawling = async (): Promise<void> => {
    console.log('[VacationScheduler] 초기 데이터 동기화 수행...')
    await executeVacationCrawling()
}