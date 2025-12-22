import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'
import { API_BASE_URL } from '../lib/api'

export interface HypervVM {
  vmName: string
  currentUser: string | null
  isConnected: boolean
  lastUpdate: string
}

interface HypervStore {
  vms: HypervVM[]
  socket: Socket | null
  initSocket: () => void
  setVMs: (vms: HypervVM[]) => void
}

export const useHypervStore = create<HypervStore>((set, get) => ({
  vms: [],
  socket: null,

  setVMs: (vms) => set({ vms }),

  initSocket: () => {
    // 이미 연결되어 있다면 재연결 방지
    if (get().socket) return

    const newSocket = io(API_BASE_URL)

    // 서버가 쏴주는 'hyperv:status_changed' 이벤트를 상시 감시
    newSocket.on('hyperv:status_changed', (updatedVms: HypervVM[]) => {
      set({ vms: updatedVms })
    })

    set({ socket: newSocket })
  }
}))
