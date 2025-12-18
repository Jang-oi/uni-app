/**
 * 휴가 크롤러
 * 휴가 사이트에서 팀원 휴가 정보 조회
 */

import { config } from '../config'
import { loadCredentials } from '../store'
import { crawlerBrowser } from './browser'

interface VacationData {
  employeeName: string
  startDate: string
  endDate: string
  type: string
  status: string
}

class VacationCrawler {
  /**
   * 휴가 데이터 크롤링
   */
  async crawl(): Promise<VacationData[]> {
    console.log('[VacationCrawler] 크롤링 시작')

    try {
      // 브라우저 초기화
      await crawlerBrowser.init()

      // 자격증명 로드
      const credentials = loadCredentials()
      const siteUrl = credentials.vacationSite.url
      if (!siteUrl) {
        throw new Error('휴가 사이트 URL이 설정되지 않았습니다')
      }

      await crawlerBrowser.navigateTo(siteUrl)

      // 로그인 확인
      const isLoggedIn = await crawlerBrowser.checkLogin()
      if (!isLoggedIn) {
        console.warn('[VacationCrawler] 로그인 필요 - 크롤링 중단')
        return []
      }

      // 휴가 목록이 로드될 때까지 대기
      const listLoaded = await crawlerBrowser.waitForSelector('.vacation-list', 5000)
      if (!listLoaded) {
        console.warn('[VacationCrawler] 휴가 목록을 찾을 수 없습니다')
        return []
      }

      // 휴가 데이터 파싱
      const vacations = await this.parseVacations()

      console.log(`[VacationCrawler] 크롤링 완료: ${vacations.length}개 항목`)

      // 서버로 전송
      await this.syncToServer(vacations)

      return vacations
    } catch (error) {
      console.error('[VacationCrawler] 크롤링 오류:', error)
      return []
    }
  }

  /**
   * 휴가 데이터 파싱
   */
  private async parseVacations(): Promise<VacationData[]> {
    const vacations = await crawlerBrowser.executeScript<VacationData[]>(`
      (function() {
        // 실제 사이트 구조에 맞게 수정 필요
        const items = Array.from(document.querySelectorAll('.vacation-item'));

        return items.map(item => {
          const nameElement = item.querySelector('.employee-name');
          const startDateElement = item.querySelector('.start-date');
          const endDateElement = item.querySelector('.end-date');
          const typeElement = item.querySelector('.vacation-type');
          const statusElement = item.querySelector('.status');

          return {
            employeeName: nameElement?.textContent?.trim() || '',
            startDate: startDateElement?.textContent?.trim() || '',
            endDate: endDateElement?.textContent?.trim() || '',
            type: typeElement?.textContent?.trim() || '',
            status: statusElement?.textContent?.trim() || '승인'
          };
        }).filter(v => v.employeeName); // 빈 항목 제외
      })()
    `)

    return vacations
  }

  /**
   * 서버로 데이터 동기화
   */
  private async syncToServer(vacations: VacationData[]): Promise<void> {
    try {
      const response = await fetch(`${config.serverUrl}/api/vacations/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vacations })
      })

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`)
      }

      console.log('[VacationCrawler] 서버 동기화 완료')
    } catch (error) {
      console.error('[VacationCrawler] 서버 동기화 오류:', error)
    }
  }
}

/**
 * 싱글톤 인스턴스
 */
export const vacationCrawler = new VacationCrawler()
