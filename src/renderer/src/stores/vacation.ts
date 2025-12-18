/**
 * 휴가 데이터 Zustand 스토어
 */

import { create } from 'zustand'

export interface Vacation {
  id: number
  employeeName: string
  startDate: string
  endDate: string
  type: string
}

interface VacationStore {
  vacations: Vacation[]
  setVacations: (vacations: Vacation[]) => void
}

export const useVacationStore = create<VacationStore>((set) => ({
  vacations: [],
  setVacations: (vacations) => set({ vacations })
}))

// Socket 리스너 설정
if (typeof window !== 'undefined' && window.api) {
  window.api.onVacationUpdated((data) => {
    useVacationStore.getState().setVacations(data.vacations || [])
  })
}
