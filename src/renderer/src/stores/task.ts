/**
 * 업무 데이터 Zustand 스토어
 */

import { BASE_URL } from '@shared/api/client'
import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface TaskDisplayData {
  SR_IDX: string
  REQ_TITLE: string
  CM_NAME: string
  REQ_DATE: string
  PROCESS_DATE: string
  WRITER: string
  STATUS: string
  REQ_DATE_ALL: string
  STATUS_CODE: string
}

export interface TaskAlert {
  type: 'new' | 'updated' | 'status-changed'
  task: TaskDisplayData
  timestamp: string
}

interface TaskSocketData {
  team: TaskDisplayData[]
  members: Record<string, TaskDisplayData[]>
  lastUpdated: string
}

interface TaskStore {
  // 데이터
  teamTasks: TaskDisplayData[]
  memberTasks: Record<string, TaskDisplayData[]>
  lastUpdated: string

  // 사용자 정보
  currentUser: string

  // 알림
  alerts: TaskAlert[]

  // Socket
  socket: Socket | null
  connectionStatus: ConnectionStatus

  // Actions
  setTeamTasks: (tasks: TaskDisplayData[]) => void
  setMemberTasks: (members: Record<string, TaskDisplayData[]>) => void
  setCurrentUser: (userName: string) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  addAlert: (alert: TaskAlert) => void
  clearAlerts: () => void
  initSocket: (onError?: () => void) => void
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  teamTasks: [],
  memberTasks: {},
  lastUpdated: '',
  currentUser: '',
  alerts: [],
  socket: null,
  connectionStatus: 'disconnected',

  setTeamTasks: (tasks) => set({ teamTasks: tasks }),
  setMemberTasks: (members) => set({ memberTasks: members }),
  setCurrentUser: (userName) => set({ currentUser: userName }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  clearAlerts: () => set({ alerts: [] }),

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
      console.log('[Task] Socket.io 연결 성공')
      set({ connectionStatus: 'connected' })
    })

    // 연결 오류
    newSocket.on('connect_error', (error) => {
      console.error('[Task] Socket.io 연결 오류:', error)
      set({ connectionStatus: 'error' })
      // 에러 콜백 실행
      if (onError) {
        onError()
      }
    })

    // 연결 끊김
    newSocket.on('disconnect', (reason) => {
      console.warn('[Task] Socket.io 연결 끊김:', reason)
      set({ connectionStatus: 'disconnected' })
      if (reason === 'io server disconnect') {
        // 서버에서 연결을 끊은 경우 수동으로 재연결
        newSocket.connect()
      }
    })

    // 서버가 쏴주는 'task:updated' 이벤트를 상시 감시 (팀 + 멤버 데이터)
    newSocket.on('task:updated', (data: TaskSocketData) => {
      set({
        teamTasks: data.team,
        memberTasks: data.members,
        lastUpdated: data.lastUpdated
      })
    })

    set({ socket: newSocket })
  }
}))
