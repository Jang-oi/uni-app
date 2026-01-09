/**
 * 업무 데이터 Zustand 스토어
 */

import { create } from 'zustand'

interface UserStore {
  userName: string
  userHostName: string
  initListeners: () => void
}
export const useUserStore = create<UserStore>((set) => ({
  userHostName: '',
  userName: '',
  initListeners: async () => {
    try {
      const response = await window.api.getUserInfo()
      if (response.success) {
        set({
          userName: response.data.userName,
          userHostName: response.data.hostname
        })
      }
    } catch (err) {
      console.error('[USER] getUserInfo 연결 실패:', err)
    }
  }
}))
