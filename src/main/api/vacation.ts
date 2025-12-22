/**
 * 휴가 데이터 서버 API 연동 모듈
 */

import { api, ApiResponse } from './client'
import type { VacationRawData } from '../types/data'

/**
 * 크롤링한 휴가 데이터를 서버로 전송 (UPSERT)
 * Express 서버 구현 후 주석 해제하여 사용
 */
export async function syncVacationsToServer(rawData: VacationRawData[]): Promise<{ inserted: number; updated: number; total: number }> {
  try {
    console.log(`[API:Vacation] ${rawData.length}개 데이터를 서버로 전송 시작...`)

    const response = await api.post<ApiResponse<{ inserted: number; updated: number; total: number }>>('/api/vacations/sync', {
      vacations: rawData
    })

    if (response.data.success && response.data.data) {
      console.log('[API:Vacation] 서버 동기화 완료:', response.data.data)
      return response.data.data
    } else {
      console.error('[API:Vacation] 서버 응답 오류:', response.data.error)
      return { inserted: 0, updated: 0, total: 0 }
    }
  } catch (error) {
    console.error('[API:Vacation] 서버 전송 중 오류:', error)
    return { inserted: 0, updated: 0, total: 0 }
  }
}

/**
 * 월별 휴가 데이터 조회 (서버에서)
 * Express 서버 구현 후 주석 해제하여 사용
 */
export async function getVacationsByMonthFromServer(year: string, month: string) {
  try {
    console.log(`[API:Vacation] ${year}년 ${month}월 데이터 서버에서 조회...`)

    const response = await api.get<ApiResponse>(`/api/vacations/${year}/${month}`)

    if (response.data.success && response.data.data) {
      console.log(`[API:Vacation] ${response.data.data.length}건 조회 완료`)
      return response.data.data
    } else {
      console.error('[API:Vacation] 서버 응답 오류:', response.data.error)
      return []
    }
  } catch (error) {
    console.error('[API:Vacation] 서버 조회 중 오류:', error)
    return []
  }
}
