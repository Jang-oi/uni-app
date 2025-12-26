/**
 * 휴가 데이터 Zustand 스토어
 */

import { BASE_URL } from '@shared/api/client'
import { VacationRawData } from '@shared/types/data'
import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface VacationStore {
  vacations: VacationRawData[]
  vacationsByDate: Record<string, VacationRawData[]>
  socket: Socket | null
  connectionStatus: ConnectionStatus
  setVacations: (vacations: VacationRawData[]) => void
  setVacationsByDate: (vacationsByDate: Record<string, VacationRawData[]>) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  initSocket: (onError?: () => void) => void
}

export const useVacationStore = create<VacationStore>((set, get) => ({
  vacations: [],
  vacationsByDate: {},
  socket: null,
  connectionStatus: 'disconnected',

  setVacations: (vacations) => set({ vacations }),
  setVacationsByDate: (vacationsByDate) => set({ vacationsByDate }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  initSocket: (onError?: () => void) => {
    // 이미 연결되어 있다면 재연결 방지
    if (get().socket) return

    set({ connectionStatus: 'connecting' })

    const newSocket = io(BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3 // 무한 재시도 대신 3회로 제한
    })

    // 연결 성공
    newSocket.on('connect', () => {
      console.log('[Vacation] Socket.io 연결 성공')
      set({ connectionStatus: 'connected' })
    })

    // 연결 오류
    newSocket.on('connect_error', (error) => {
      console.error('[Vacation] Socket.io 연결 오류:', error)
      set({ connectionStatus: 'error' })
      // 에러 콜백 실행
      if (onError) {
        onError()
      }
    })

    // 연결 끊김
    newSocket.on('disconnect', (reason) => {
      console.warn('[Vacation] Socket.io 연결 끊김:', reason)
      set({ connectionStatus: 'disconnected' })
      if (reason === 'io server disconnect') {
        // 서버에서 연결을 끊은 경우 수동으로 재연결
        newSocket.connect()
      }
    })

    // 서버가 쏴주는 'vacation:updated' 이벤트를 상시 감시
    newSocket.on('vacation:updated', (data: { vacationsByDate: Record<string, VacationRawData[]> }) => {
      set({ vacationsByDate: data.vacationsByDate })
    })

    set({ socket: newSocket })
  }
}))
