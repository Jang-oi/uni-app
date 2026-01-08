/**
 * 회식 일정 투표 Zustand 스토어 (Socket 통신)
 */

import { DinnerSchedule } from '@shared/types/dinner'
import { toast } from 'sonner'
import { create } from 'zustand'
import { useSocketStore } from './socket'
import { useUserStore } from './user'

interface DinnerStore {
  currentSchedule: DinnerSchedule | null
  MyAvailableDates: string[] // 내가 투표한 날짜 목록 (가능한 날짜)
  myUnavailableVotes: string[] // 내가 선택한 안되는 날짜 목록
  setCurrentSchedule: (schedule: DinnerSchedule | null) => void
  setMyAvailableDates: (votes: string[], unavailableVotes: string[]) => void
  vote: (hostname: string, availableDates: string[], unavailableDates: string[]) => Promise<void>
  confirmDate: (hostname: string, date: string) => Promise<void>
  initListeners: () => void
  cleanupListeners: () => void
}

export const useDinnerStore = create<DinnerStore>((set) => ({
  currentSchedule: null,
  MyAvailableDates: [],
  myUnavailableVotes: [],

  setCurrentSchedule: (schedule) => set({ currentSchedule: schedule }),
  setMyAvailableDates: (availableDates, unavailableVotes) =>
    set({ MyAvailableDates: availableDates, myUnavailableVotes: unavailableVotes }),

  /**
   * 투표하기 (가능한 날짜 + 안되는 날짜)
   */
  vote: async (hostname: string, availableDates: string[], unavailableDates: string[]) => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[Dinner] 공유 소켓이 없습니다')
      throw new Error('소켓 연결이 필요합니다')
    }

    try {
      // Socket으로 투표 전송
      socket.emit('dinner:vote', {
        hostname,
        availableDates,
        unavailableDates
      })

      // 로컬 상태 즉시 업데이트 (낙관적 업데이트)
      set({ MyAvailableDates: availableDates, myUnavailableVotes: unavailableDates })
      console.log('[Dinner] 투표 전송 - 가능:', availableDates, '/ 불가:', unavailableDates)
    } catch (error) {
      console.error('[Dinner] 투표 오류:', error)
      throw error
    }
  },

  /**
   * 일정 확정 (Master 전용 - pc-lovestar1124 또는 local-jang)
   */
  confirmDate: async (hostname: string, confirmedDate: string) => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[Dinner] 공유 소켓이 없습니다')
      throw new Error('소켓 연결이 필요합니다')
    }

    try {
      socket.emit('dinner:confirm', {
        hostname,
        confirmedDate
      })
    } catch (error) {
      console.error('[Dinner] 일정 확정 오류:', error)
      throw error
    }
  },

  /**
   * Socket 이벤트 리스너 등록
   */
  initListeners: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[Dinner] 공유 소켓이 없습니다')
      return
    }

    // 새 투표 생성 알림
    socket.on('dinner:schedule-created', (schedule: DinnerSchedule) => {
      set({ currentSchedule: schedule, MyAvailableDates: [], myUnavailableVotes: [] })

      // Toast 알림
      toast.success('회식 일정 투표', {
        description: `${schedule.month} 회식 일정 투표가 시작되었습니다!`
      })
    })

    // 일정 업데이트 (연결 시 초기 데이터 + 실시간 업데이트)
    socket.on('dinner:schedule-updated', (schedule: DinnerSchedule) => {
      set({ currentSchedule: schedule })
      const { userHostName } = useUserStore.getState()
      console.log(userHostName)
      const MyAvailableDates = schedule.candidates.filter((c) => c.availableVotes.includes(userHostName)).map((c) => c.date)
      const myUnavailableVotes = schedule.candidates.filter((c) => c.unavailableVotes.includes(userHostName)).map((c) => c.date)
      set({ MyAvailableDates, myUnavailableVotes })
    })

    // 투표 현황 실시간 업데이트
    socket.on('dinner:vote-updated', (schedule: DinnerSchedule) => {
      set({ currentSchedule: schedule })
    })

    // 일정 확정 알림
    socket.on('dinner:confirmed', (schedule: DinnerSchedule) => {
      set({ currentSchedule: schedule })

      // Toast 알림
      toast.success('회식 일정 확정', {
        description: `${schedule.confirmedDate} 회식이 확정되었습니다! 🎉`
      })
    })

    // 에러 처리
    socket.on('dinner:error', (error: { message: string }) => {
      console.error('[Dinner] 서버 오류:', error.message)

      // Toast 알림
      toast.error('회식 일정 오류', {
        description: error.message
      })
    })
  },

  /**
   * Socket 이벤트 리스너 제거
   */
  cleanupListeners: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) return

    console.log('[Dinner] 이벤트 리스너 제거')
    socket.off('dinner:schedule-created')
    socket.off('dinner:schedule-updated')
    socket.off('dinner:vote-updated')
    socket.off('dinner:confirmed')
    socket.off('dinner:error')
  }
}))
