/**
 * 업무 데이터 Zustand 스토어
 */

import { create } from 'zustand'

export interface Task {
  id: string
  title: string
  assignee: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
  dueDate: string
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

// Socket 리스너 설정
if (typeof window !== 'undefined' && window.api) {
  window.api.onTaskUpdated((data) => {
    useTaskStore.getState().setTasks(data.tasks || [])
  })

  window.api.onTaskAlert((data) => {
    useTaskStore.getState().addAlert({
      type: data.type,
      task: data.task,
      timestamp: new Date().toISOString()
    })
  })
}
