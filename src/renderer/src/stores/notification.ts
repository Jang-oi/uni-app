/**
 * 알림 데이터 Zustand 스토어
 */

import { create } from 'zustand'
import { useHypervStore } from './hyperv'
import { useSocketStore } from './socket'
import { useUserStore } from './user'

type NotificationType = 'task-check' | 'task-support' | 'vm-request' | 'dinner-confirmed'

export interface Notification {
  id: string
  type: NotificationType
  senderHostname: string
  senderName: string
  receiverHostname: string
  receiverName: string
  title: string
  message: string
  timestamp: string
  isRead: boolean
  // 업무 관련 (task-check, task-support 타입일 때 사용)
  taskId?: string
  taskTitle?: string
  // VM 관련 (vm-request 타입일 때 사용)
  vmName?: string
  expiresAt?: string // VM 요청 만료 시간 (30초 후)
  isCancelled?: boolean // 요청자가 취소한 요청 여부
  isProcessed?: boolean // 이미 승인/거절 처리된 요청 여부
}

interface NotificationStore {
  // 데이터
  notifications: Notification[]
  unreadCount: number

  // Actions
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  updateNotification: (notification: Notification) => void
  removeNotification: (notificationId: string) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  initListeners: () => void
  cleanupListeners: () => void
}

const createClearRedBadge = (count: number): string | null => {
  if (count <= 0) return null

  const size = 32 // 오버레이 아이콘 표준 크기
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 20, 0, Math.PI * 2) // 원 크기를 15로 키움 (여백 최소화)
  ctx.fillStyle = '#FF0000'
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 숫자가 10 이상이면 폰트 크기 조절
  const fontSize = count > 9 ? '22px' : '24px'
  ctx.font = `${fontSize} Arial, sans-serif`

  const displayText = count > 99 ? '99' : count.toString()
  ctx.fillText(displayText, size / 2, size / 2 + 1) // 위치 미세 조정

  return canvas.toDataURL('image/png')
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length
    set({ notifications, unreadCount })
    // 배지 카운트 업데이트
    const badgeData = createClearRedBadge(unreadCount)
    window.api.setBadgeCount(unreadCount, badgeData).catch((err) => console.error('[Badge] 업데이트 실패:', err))
  },

  addNotification: (notification) => {
    if (!notification) return
    set((state) => {
      // 중복 알림 방지: 같은 ID가 이미 존재하면 업데이트만 수행
      const existingIndex = state.notifications.findIndex((n) => n.id === notification.id)
      let newNotifications

      if (existingIndex >= 0) {
        newNotifications = state.notifications.map((n) => (n.id === notification.id ? notification : n))
      } else {
        // VM 요청 알림의 경우, 같은 VM에 대한 이전 요청 알림 삭제
        if (notification.type === 'vm-request' && notification.vmName) {
          newNotifications = [
            notification,
            ...state.notifications.filter((n) => !(n.type === 'vm-request' && n.vmName === notification.vmName && n.id !== notification.id))
          ]
        } else {
          newNotifications = [notification, ...state.notifications]
        }
      }

      const unreadCount = newNotifications.filter((n) => !n.isRead).length
      // 배지 카운트 업데이트
      const badgeData = createClearRedBadge(unreadCount)
      window.api.setBadgeCount(unreadCount, badgeData).catch((err) => console.error('[Badge] 업데이트 실패:', err))
      return { notifications: newNotifications, unreadCount }
    })
  },

  updateNotification: (notification) => {
    if (!notification) return
    set((state) => {
      const notifications = state.notifications.map((n) => (n.id === notification.id ? notification : n))
      const unreadCount = notifications.filter((n) => !n.isRead).length
      // 배지 카운트 업데이트
      const badgeData = createClearRedBadge(unreadCount)
      window.api.setBadgeCount(unreadCount, badgeData).catch((err) => console.error('[Badge] 업데이트 실패:', err))
      return { notifications, unreadCount }
    })
  },

  removeNotification: (notificationId) => {
    if (!notificationId) return
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== notificationId)
      const unreadCount = notifications.filter((n) => !n.isRead).length
      // 배지 카운트 업데이트
      const badgeData = createClearRedBadge(unreadCount)
      window.api.setBadgeCount(unreadCount, badgeData).catch((err) => console.error('[Badge] 업데이트 실패:', err))
      return { notifications, unreadCount }
    })
  },

  markAsRead: (notificationId) => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[Notification] 공유 소켓이 없습니다')
      return
    }
    const { userHostName } = useUserStore.getState()
    // 서버에 읽음 처리 요청
    socket.emit('notification:read', { notificationId, hostname: userHostName })
  },

  markAllAsRead: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[Notification] 공유 소켓이 없습니다')
      return
    }

    const { userHostName } = useUserStore.getState()
    // 서버에 전체 읽음 처리 요청
    socket.emit('notification:read-all', { hostname: userHostName })
  },

  initListeners: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[Notification] 공유 소켓이 없습니다')
      return
    }

    // 초기 알림 데이터 수신
    socket.on('notification:initial', (notifications: Notification[]) => {
      if (!notifications) return
      get().setNotifications(notifications)
    })

    // 새 알림 수신
    socket.on('notification:new', async (notification: Notification) => {
      if (!notification) return
      get().addNotification(notification)

      // Windows 토스트 알림 표시
      window.api.showUniNotification({
        title: notification.title,
        body: notification.message,
        taskId: notification.taskId, // 알림 클릭 시 URL 열기용 taskId 전달
        vmName: notification.vmName, // VM 관련 알림의 경우 vmName 전달
        notificationType: notification.type, // 알림 타입 전달 (Actions 표시용)
        senderName: notification.senderName
      })
    })

    // 알림 업데이트 수신
    socket.on('notification:updated', (notification: Notification) => {
      if (!notification) return
      get().updateNotification(notification)
    })

    // 전체 읽음 처리 완료
    socket.on('notification:all-read', (notifications: Notification[]) => {
      if (!notifications) return
      notifications.forEach((n) => {
        get().updateNotification(n)
      })
    })

    // 알림 삭제 수신 (VM 요청 취소/만료/처리 완료 시)
    socket.on('notification:removed', (notificationId: string) => {
      if (!notificationId) return
      get().removeNotification(notificationId)
      useHypervStore.setState({ vmRequestDialog: null })
    })
  },

  cleanupListeners: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) return

    socket.off('notification:initial')
    socket.off('notification:new')
    socket.off('notification:updated')
    socket.off('notification:all-read')
    socket.off('notification:removed')
  }
}))
