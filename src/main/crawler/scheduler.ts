/**
 * 크롤러 스케줄러
 * node-cron을 사용한 주기적 크롤링 실행
 */

import cron, { ScheduledTask } from 'node-cron'
// import { taskCrawler } from './task'
// import { vacationCrawler } from './vacation'

class CrawlerScheduler {
  private vacationJob: ScheduledTask | null = null
  private taskJob: ScheduledTask | null = null

  /**
   * 스케줄러 시작
   */
  start(): void {
    console.log('[CrawlerScheduler] 스케줄러 시작')

    // 휴가 크롤링: 09시, 12시, 18시
    this.vacationJob = cron.schedule('0 9,12,18 * * *', async () => {
      console.log('[CrawlerScheduler] 휴가 크롤링 실행 (정기)')
      // await vacationCrawler.crawl()
    })

    // 업무 크롤링: 매 1분 (운영 환경에서는 5분 또는 10분으로 조정 권장)
    this.taskJob = cron.schedule('*/1 * * * *', async () => {
      console.log('[CrawlerScheduler] 업무 크롤링 실행 (정기)')
      // await taskCrawler.crawl()
    })

    // 시작 시 즉시 1회 실행
    this.runImmediately()

    console.log('[CrawlerScheduler] 휴가 크롤링: 09시, 12시, 18시')
    console.log('[CrawlerScheduler] 업무 크롤링: 매 1분')
  }

  /**
   * 즉시 크롤링 실행 (앱 시작 시)
   */
  private async runImmediately(): Promise<void> {
    console.log('[CrawlerScheduler] 초기 크롤링 시작')

    try {
      // 휴가 크롤링
      // await vacationCrawler.crawl()

      // 업무 크롤링
      // await taskCrawler.crawl()

      console.log('[CrawlerScheduler] 초기 크롤링 완료')
    } catch (error) {
      console.error('[CrawlerScheduler] 초기 크롤링 오류:', error)
    }
  }

  /**
   * 수동 휴가 크롤링 실행
   */
  async runVacationCrawler(): Promise<void> {
    console.log('[CrawlerScheduler] 휴가 크롤링 수동 실행')
    // await vacationCrawler.crawl()
  }

  /**
   * 수동 업무 크롤링 실행
   */
  async runTaskCrawler(): Promise<void> {
    console.log('[CrawlerScheduler] 업무 크롤링 수동 실행')
    // await taskCrawler.crawl()
  }

  /**
   * 스케줄러 정지
   */
  stop(): void {
    if (this.vacationJob) {
      this.vacationJob.stop()
      this.vacationJob = null
    }

    if (this.taskJob) {
      this.taskJob.stop()
      this.taskJob = null
    }

    console.log('[CrawlerScheduler] 스케줄러 정지')
  }

  /**
   * 스케줄 변경 (런타임 중 조정 가능)
   */
  updateSchedule(type: 'vacation' | 'task', cronExpression: string): void {
    console.log(`[CrawlerScheduler] ${type} 스케줄 변경: ${cronExpression}`)

    if (type === 'vacation' && this.vacationJob) {
      this.vacationJob.stop()
      this.vacationJob = cron.schedule(cronExpression, async () => {
        // await vacationCrawler.crawl()
      })
    } else if (type === 'task' && this.taskJob) {
      this.taskJob.stop()
      this.taskJob = cron.schedule(cronExpression, async () => {
        // await taskCrawler.crawl()
      })
    }
  }
}

/**
 * 싱글톤 인스턴스
 */
export const crawlerScheduler = new CrawlerScheduler()
