/**
 * 휴가 데이터 Zustand 스토어
 */

import { VacationRawData } from '@shared/types/data'
import { create } from 'zustand'

interface VacationStore {
  vacations: VacationRawData[]
  vacationsByDate: Record<string, VacationRawData[]>
  setVacations: (vacations: VacationRawData[]) => void
  setVacationsByDate: (vacationsByDate: Record<string, VacationRawData[]>) => void
}

export const useVacationStore = create<VacationStore>((set) => ({
  vacations: [],
  vacationsByDate: {},
  setVacations: (vacations) => set({ vacations }),
  setVacationsByDate: (vacationsByDate) => set({ vacationsByDate })
}))
