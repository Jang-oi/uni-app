/**
 * 일정 데이터 Zustand 스토어 (범용)
 */

import { ProcessedEvent } from '@shared/types/calendar'
import { create } from 'zustand'
import { useSocketStore } from './socket'

interface CalendarStore {
  events: ProcessedEvent[]
  eventsByDate: Record<string, ProcessedEvent[]>
  setEvents: (events: ProcessedEvent[]) => void
  setEventsByDate: (eventsByDate: Record<string, ProcessedEvent[]>) => void
  initListeners: () => void
  cleanupListeners: () => void
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  events: [],
  eventsByDate: {},

  setEvents: (events) => set({ events }),
  setEventsByDate: (eventsByDate) => set({ eventsByDate }),

  initListeners: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[Calendar] 공유 소켓이 없습니다')
      return
    }

    console.log('[Calendar] 이벤트 리스너 등록')

    // 일정 업데이트 이벤트 리스너
    socket.on('calendar:updated', (data: { vacationsDate: Record<string, ProcessedEvent[]> }) => {
      console.log('[Calendar] 일정 업데이트 수신')
      set({ eventsByDate: data.vacationsDate })
    })
  },

  cleanupListeners: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) return

    console.log('[Calendar] 이벤트 리스너 제거')
    socket.off('calendar:updated')
  }
}))
