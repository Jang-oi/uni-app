/**
 * 공유 Socket.io 연결 관리 스토어
 * 모든 기능(calendar, task, hyperv, notification)이 하나의 소켓을 공유
 */

import { BASE_URL } from '@shared/api/client'
import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'
import { useUserStore } from './user'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface SocketStore {
  socket: Socket | null
  connectionStatus: ConnectionStatus
  initSocket: (onError?: () => void) => void
  getSocket: () => Socket | null
  disconnect: () => void
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connectionStatus: 'disconnected',

  initSocket: (onError?: () => void) => {
    // 이미 연결되어 있다면 재연결 방지
    if (get().socket) {
      console.log('[Socket] 이미 연결되어 있음')
      return
    }

    console.log('[Socket] 공유 소켓 연결 시작...')
    set({ connectionStatus: 'connecting' })

    const newSocket = io(BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3
    })

    // 연결 성공
    newSocket.on('connect', async () => {
      console.log('[Socket] ✅ 연결 성공 (Socket ID:', newSocket.id, ')')
      set({ connectionStatus: 'connected' })
      const { userHostName } = useUserStore.getState()
      newSocket.emit('register:user', { hostname: userHostName })
      console.log('[Socket] 사용자 등록:', userHostName)
    })

    // 연결 오류
    newSocket.on('connect_error', (error) => {
      console.error('[Socket] ❌ 연결 오류:', error.message)
      set({ connectionStatus: 'error' })
      if (onError) {
        onError()
      }
    })

    // 연결 끊김
    newSocket.on('disconnect', (reason) => {
      console.warn('[Socket] ⚠️ 연결 끊김:', reason)
      set({ connectionStatus: 'disconnected' })
      if (reason === 'io server disconnect') {
        // 서버에서 연결을 끊은 경우 수동으로 재연결
        newSocket.connect()
      }
    })

    // 재연결 시도
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] 🔄 재연결 시도:', attemptNumber)
    })

    // 재연결 성공
    newSocket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] ✅ 재연결 성공 (시도 횟수:', attemptNumber, ')')
      set({ connectionStatus: 'connected' })
    })

    set({ socket: newSocket })
  },

  getSocket: () => {
    return get().socket
  },

  disconnect: () => {
    const socket = get().socket
    if (socket) {
      console.log('[Socket] 연결 종료')
      socket.disconnect()
      set({ socket: null, connectionStatus: 'disconnected' })
    }
  }
}))
