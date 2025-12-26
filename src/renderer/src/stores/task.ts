/**
 * 업무 데이터 Zustand 스토어
 */

import { BASE_URL } from '@shared/api/client'
import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

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

interface TaskStore {
  tasks: TaskDisplayData[]
  alerts: TaskAlert[]
  socket: Socket | null
  setTasks: (tasks: TaskDisplayData[]) => void
  addAlert: (alert: TaskAlert) => void
  clearAlerts: () => void
  initSocket: () => void
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  alerts: [],
  socket: null,

  setTasks: (tasks) => set({ tasks }),
  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  clearAlerts: () => set({ alerts: [] }),

  initSocket: () => {
    // 이미 연결되어 있다면 재연결 방지
    if (get().socket) return

    const newSocket = io(BASE_URL)

    // 서버가 쏴주는 'task:updated' 이벤트를 상시 감시
    newSocket.on('task:updated', (tasks: TaskDisplayData[]) => {
      set({ tasks })
    })

    set({ socket: newSocket })
  }
}))
