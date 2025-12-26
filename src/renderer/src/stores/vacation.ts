/**
 * 휴가 데이터 Zustand 스토어
 */

import { BASE_URL } from '@shared/api/client'
import { VacationRawData } from '@shared/types/data'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
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
  initSocket: () => void
}

export const useVacationStore = create<VacationStore>((set, get) => ({
  vacations: [],
  vacationsByDate: {},
  socket: null,
  connectionStatus: 'disconnected',

  setVacations: (vacations) => set({ vacations }),
  setVacationsByDate: (vacationsByDate) => set({ vacationsByDate }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  initSocket: () => {
    // 이미 연결되어 있다면 재연결 방지
    if (get().socket) return

    set({ connectionStatus: 'connecting' })

    const newSocket = io(BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    })

    // 연결 성공
    newSocket.on('connect', () => {
      console.log('[Vacation] Socket.io 연결 성공')
      set({ connectionStatus: 'connected' })
      toast.success('휴가 데이터 서버 연결 완료')
    })

    // 연결 오류
    newSocket.on('connect_error', (error) => {
      console.error('[Vacation] Socket.io 연결 오류:', error)
      set({ connectionStatus: 'error' })
      toast.error('휴가 데이터 서버 연결 실패', {
        description: '서버 연결을 확인해주세요. 자동으로 재연결을 시도합니다.'
      })
    })

    // 연결 끊김
    newSocket.on('disconnect', (reason) => {
      console.warn('[Vacation] Socket.io 연결 끊김:', reason)
      set({ connectionStatus: 'disconnected' })
      if (reason === 'io server disconnect') {
        // 서버에서 연결을 끊은 경우 수동으로 재연결
        newSocket.connect()
      }
      toast.warning('휴가 데이터 서버 연결 끊김', {
        description: '재연결을 시도합니다.'
      })
    })

    // 서버가 쏴주는 'vacation:updated' 이벤트를 상시 감시
    newSocket.on('vacation:updated', (data: { vacationsByDate: Record<string, VacationRawData[]> }) => {
      set({ vacationsByDate: data.vacationsByDate })
    })

    set({ socket: newSocket })
  }
}))
