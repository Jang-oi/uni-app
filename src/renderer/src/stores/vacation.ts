/**
 * 휴가 데이터 Zustand 스토어
 */

import { BASE_URL } from '@shared/api/client'
import { VacationRawData } from '@shared/types/data'
import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

interface VacationStore {
  vacations: VacationRawData[]
  vacationsByDate: Record<string, VacationRawData[]>
  socket: Socket | null
  setVacations: (vacations: VacationRawData[]) => void
  setVacationsByDate: (vacationsByDate: Record<string, VacationRawData[]>) => void
  initSocket: () => void
}

export const useVacationStore = create<VacationStore>((set, get) => ({
  vacations: [],
  vacationsByDate: {},
  socket: null,

  setVacations: (vacations) => set({ vacations }),
  setVacationsByDate: (vacationsByDate) => set({ vacationsByDate }),

  initSocket: () => {
    // 이미 연결되어 있다면 재연결 방지
    if (get().socket) return

    const newSocket = io(BASE_URL)

    // 서버가 쏴주는 'vacation:updated' 이벤트를 상시 감시
    newSocket.on('vacation:updated', (data: { vacationsByDate: Record<string, VacationRawData[]> }) => {
      set({ vacationsByDate: data.vacationsByDate })
    })

    set({ socket: newSocket })
  }
}))
