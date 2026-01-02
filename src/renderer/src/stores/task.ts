/**
 * 업무 데이터 Zustand 스토어
 */

import { create } from 'zustand'
import { useSocketStore } from './socket'

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

  // Actions
  setTeamTasks: (tasks: TaskDisplayData[]) => void
  setMemberTasks: (members: Record<string, TaskDisplayData[]>) => void
  setCurrentUser: (userName: string) => void
  addAlert: (alert: TaskAlert) => void
  clearAlerts: () => void
  initListeners: () => void
  cleanupListeners: () => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  teamTasks: [],
  memberTasks: {},
  lastUpdated: '',
  currentUser: '',
  alerts: [],

  setTeamTasks: (tasks) => set({ teamTasks: tasks }),
  setMemberTasks: (members) => set({ memberTasks: members }),
  setCurrentUser: (userName) => set({ currentUser: userName }),
  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  clearAlerts: () => set({ alerts: [] }),

  initListeners: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[Task] 공유 소켓이 없습니다')
      return
    }

    console.log('[Task] 이벤트 리스너 등록')

    // 업무 업데이트 이벤트 리스너
    socket.on('task:updated', (data: TaskSocketData) => {
      console.log('[Task] 업무 업데이트 수신')
      set({
        teamTasks: data.team,
        memberTasks: data.members,
        lastUpdated: data.lastUpdated
      })
    })
  },

  cleanupListeners: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) return

    console.log('[Task] 이벤트 리스너 제거')
    socket.off('task:updated')
  }
}))
