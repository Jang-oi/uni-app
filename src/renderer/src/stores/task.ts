/**
 * 업무 데이터 Zustand 스토어
 */

import { create } from 'zustand'

export interface Task {
  SR_IDX: string
  REQ_TITLE: string
  CM_NAME: string
  STATUS: string
  WRITER: string
  REQ_DATE_ALL: string
  priority?: 'high' | 'medium' | 'low' // UI용 추가 필드
  assignee?: string // UI용 담당자
  status?: 'pending' | 'in-progress' | 'completed' // UI용 상태
  dueDate?: string // UI용 마감일
}

export interface TaskAlert {
  type: 'new' | 'updated' | 'status-changed'
  task: Task
  timestamp: string
}

interface TaskStore {
  tasks: Task[]
  alerts: TaskAlert[]
  setTasks: (tasks: Task[]) => void
  addAlert: (alert: TaskAlert) => void
  clearAlerts: () => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  alerts: [],
  setTasks: (tasks) => set({ tasks }),
  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  clearAlerts: () => set({ alerts: [] })
}))
