/**
 * 알림 데이터 Zustand 스토어
 */

import { BASE_URL } from '@shared/api/client'
import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
type NotificationType = 'task-check' | 'task-support' | 'vm-request'

export interface Notification {
  id: string
  type: NotificationType
  senderHostname: string
  senderName: string
  receiverHostname: string
  receiverName: string
  message: string
  timestamp: string
  isRead: boolean
  // 업무 관련 (task-check, task-support 타입일 때 사용)
  taskId?: string
  taskTitle?: string
  // VM 관련 (vm-request 타입일 때 사용)
  vmName?: string
}

export interface VMRequestDialogData {
  vmName: string
  requesters: Array<{
    notificationId: string
    name: string
    hostname: string
    timestamp: string
    isFirst: boolean
  }>
  isOpen: boolean
}

interface NotificationStore {
  // 데이터
  notifications: Notification[]
  unreadCount: number

  // Socket
  socket: Socket | null
  connectionStatus: ConnectionStatus

  // Actions
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  updateNotification: (notification: Notification) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  setConnectionStatus: (status: ConnectionStatus) => void
  initSocket: (onError?: () => void) => void

  // VM 요청 집계
  aggregateVMRequests: (vmName: string) => VMRequestDialogData
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
  socket: null,
  connectionStatus: 'disconnected',

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length
    set({ notifications, unreadCount })
    // 배지 카운트 업데이트
    const badgeData = createClearRedBadge(unreadCount)
    window.api.setBadgeCount(unreadCount, badgeData).catch((err) => console.error('[Badge] 업데이트 실패:', err))
  },

  addNotification: (notification) => {
    set((state) => {
      const newNotifications = [notification, ...state.notifications]
      const unreadCount = newNotifications.filter((n) => !n.isRead).length
      // 배지 카운트 업데이트
      const badgeData = createClearRedBadge(unreadCount)
      window.api.setBadgeCount(unreadCount, badgeData).catch((err) => console.error('[Badge] 업데이트 실패:', err))
      return { notifications: newNotifications, unreadCount }
    })
  },

  updateNotification: (notification) => {
    set((state) => {
      const notifications = state.notifications.map((n) => (n.id === notification.id ? notification : n))
      const unreadCount = notifications.filter((n) => !n.isRead).length
      // 배지 카운트 업데이트
      const badgeData = createClearRedBadge(unreadCount)
      window.api.setBadgeCount(unreadCount, badgeData).catch((err) => console.error('[Badge] 업데이트 실패:', err))
      return { notifications, unreadCount }
    })
  },

  markAsRead: (notificationId) => {
    const socket = get().socket
    if (!socket) return

    // 서버에 읽음 처리 요청
    window.api.getHostname().then((hostname) => {
      socket.emit('notification:read', { notificationId, hostname })
    })
  },

  markAllAsRead: () => {
    const socket = get().socket
    if (!socket) return

    // 서버에 전체 읽음 처리 요청
    window.api.getHostname().then((hostname) => {
      socket.emit('notification:read-all', { hostname })
    })
  },

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  initSocket: (onError?: () => void) => {
    // 이미 연결되어 있다면 재연결 방지
    if (get().socket) return

    set({ connectionStatus: 'connecting' })

    const newSocket = io(BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3
    })

    // 연결 성공
    newSocket.on('connect', () => {
      console.log('[Notification] Socket.io 연결 성공')
      set({ connectionStatus: 'connected' })

      // 연결 성공 시 사용자 등록
      window.api.getHostname().then((hostname) => {
        newSocket.emit('register:user', { hostname })
      })
    })

    // 연결 오류
    newSocket.on('connect_error', (error) => {
      console.error('[Notification] Socket.io 연결 오류:', error)
      set({ connectionStatus: 'error' })
      if (onError) {
        onError()
      }
    })

    // 연결 끊김
    newSocket.on('disconnect', (reason) => {
      console.warn('[Notification] Socket.io 연결 끊김:', reason)
      set({ connectionStatus: 'disconnected' })
      if (reason === 'io server disconnect') {
        newSocket.connect()
      }
    })

    // 초기 알림 데이터 수신
    newSocket.on('notification:initial', (notifications: Notification[]) => {
      console.log('[Notification] 초기 알림 데이터 수신:', notifications.length, '건')
      get().setNotifications(notifications)
    })

    // 새 알림 수신
    newSocket.on('notification:new', (notification: Notification) => {
      console.log('[Notification] 새 알림 수신:', notification)
      get().addNotification(notification)

      // Windows 토스트 알림 표시
      window.api.showUniNotification({
        title:
          notification.type === 'task-check' ? '업무 확인 요청' : notification.type === 'task-support' ? '업무 지원 요청' : 'VM 사용 요청',
        body: notification.message,
        taskId: notification.taskId // 알림 클릭 시 URL 열기용 taskId 전달
      })
    })

    // 알림 업데이트 수신
    newSocket.on('notification:updated', (notification: Notification) => {
      console.log('[Notification] 알림 업데이트 수신:', notification.id)
      get().updateNotification(notification)
    })

    // 전체 읽음 처리 완료
    newSocket.on('notification:all-read', (notifications: Notification[]) => {
      console.log('[Notification] 전체 읽음 처리 완료:', notifications.length, '건')
      notifications.forEach((n) => {
        get().updateNotification(n)
      })
    })

    // 알림 삭제 수신 (VM 요청 취소 시)
    newSocket.on('notification:removed', (notificationId: string) => {
      console.log('[Notification] 알림 삭제 수신:', notificationId)
      set((state) => {
        const notifications = state.notifications.filter((n) => n.id !== notificationId)
        const unreadCount = notifications.filter((n) => !n.isRead).length
        // 배지 카운트 업데이트
        const badgeData = createClearRedBadge(unreadCount)
        window.api.setBadgeCount(unreadCount, badgeData).catch((err) => console.error('[Badge] 업데이트 실패:', err))
        return { notifications, unreadCount }
      })
    })

    set({ socket: newSocket })
  },

  aggregateVMRequests: (vmName) => {
    const { notifications } = get()

    // 해당 VM의 읽지 않은 요청 알림만 필터링하고 timestamp 기준 정렬
    const vmNotifications = notifications
      .filter((n) => n.type === 'vm-request' && n.vmName === vmName && !n.isRead)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    return {
      vmName,
      requesters: vmNotifications.map((n, idx) => ({
        notificationId: n.id,
        name: n.senderName,
        hostname: n.senderHostname,
        timestamp: n.timestamp,
        isFirst: idx === 0 // FIFO: 첫 번째 요청자 표시
      })),
      isOpen: true
    }
  }
}))
