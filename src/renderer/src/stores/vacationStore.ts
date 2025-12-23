/**
 * 휴가 데이터 Zustand 스토어
 */

import { create } from 'zustand'

export interface Vacation {
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

interface VacationStore {
  vacations: Vacation[]
  setVacations: (vacations: Vacation[]) => void
}

export const useVacationStore = create<VacationStore>((set) => ({
  vacations: [],
  setVacations: (vacations) => set({ vacations })
}))
