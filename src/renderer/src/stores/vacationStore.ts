/**
 * 휴가 데이터 상태 관리 스토어 (Zustand)
 * Supabase 직접 연동
 */

import { create } from 'zustand'

export type VacationDto = {
  useId: string
  usName: string
  deptName: string
  itemName: string
  useSdate: string // YYYY-MM-DD
  useEdate: string // YYYY-MM-DD
  useStime: string | null
  useEtime: string | null
  useDesc: string
  useTimeTypeName?: string
}

type VacationStore = {
  // 상태
  vacations: VacationDto[]
  isLoading: boolean
  error: string | null
  currentYear: number
  currentMonth: number

  // 액션
  setYearMonth: (year: number, month: number) => void
  fetchVacations: (year: number, month: number) => Promise<void>
  clearError: () => void
}

export const useVacationStore = create<VacationStore>((set) => ({
  // 초기 상태
  vacations: [],
  isLoading: false,
  error: null,
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,

  // 연도/월 설정
  setYearMonth: (year: number, month: number) => {
    set({ currentYear: year, currentMonth: month })
  },

  // 휴가 데이터 조회 (Supabase 직접 호출)
  fetchVacations: async (year: number, month: number) => {
    set({ isLoading: true, error: null })

    try {
      const response = await window.api.getVacations(year.toString(), month.toString())

      if (response.success && response.data) {
        set({
          vacations: response.data as VacationDto[],
          currentYear: year,
          currentMonth: month,
          isLoading: false
        })
      } else {
        set({
          error: response.error || '휴가 데이터를 불러오는데 실패했습니다',
          isLoading: false
        })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        isLoading: false
      })
    }
  },

  // 에러 초기화
  clearError: () => {
    set({ error: null })
  }
}))
