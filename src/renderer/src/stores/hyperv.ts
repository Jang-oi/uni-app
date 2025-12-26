import { BASE_URL } from '@shared/api/client'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { create } from 'zustand'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface HypervVM {
  vmName: string
  currentUser: string | null
  isConnected: boolean
  lastUpdate: string
}

interface HypervStore {
  vms: HypervVM[]
  socket: Socket | null
  connectionStatus: ConnectionStatus
  initSocket: () => void
  setVMs: (vms: HypervVM[]) => void
  setConnectionStatus: (status: ConnectionStatus) => void
}

export const useHypervStore = create<HypervStore>((set, get) => ({
  vms: [],
  socket: null,
  connectionStatus: 'disconnected',

  setVMs: (vms) => set({ vms }),
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
      console.log('[HyperV] Socket.io 연결 성공')
      set({ connectionStatus: 'connected' })
      toast.success('HyperV 데이터 서버 연결 완료')
    })

    // 연결 오류
    newSocket.on('connect_error', (error) => {
      console.error('[HyperV] Socket.io 연결 오류:', error)
      set({ connectionStatus: 'error' })
      toast.error('HyperV 데이터 서버 연결 실패', {
        description: '서버 연결을 확인해주세요. 자동으로 재연결을 시도합니다.'
      })
    })

    // 연결 끊김
    newSocket.on('disconnect', (reason) => {
      console.warn('[HyperV] Socket.io 연결 끊김:', reason)
      set({ connectionStatus: 'disconnected' })
      if (reason === 'io server disconnect') {
        // 서버에서 연결을 끊은 경우 수동으로 재연결
        newSocket.connect()
      }
      toast.warning('HyperV 데이터 서버 연결 끊김', {
        description: '재연결을 시도합니다.'
      })
    })

    // 서버가 쏴주는 'hyperv:updated' 이벤트를 상시 감시
    newSocket.on('hyperv:updated', (updatedVms: HypervVM[]) => {
      set({ vms: updatedVms })
    })

    set({ socket: newSocket })
  }
}))
