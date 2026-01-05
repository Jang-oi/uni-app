import { toast } from 'sonner'
import { create } from 'zustand'
import { useSocketStore } from './socket'

export interface ConnectedUser {
  hostname: string
  name: string
  socketId: string
  connectedAt: string
}

export interface HypervVM {
  vmName: string
  hostServer: string
  currentUser: string | null
  currentHostname: string | null // 현재 사용자 hostname (Socket.io room 식별용)
  isConnected: boolean
  lastUpdate: string
}

export interface VMRequestState {
  vmName: string
  requestId: string
  startTime: number // 요청 시작 시간 (밀리초)
  expiresAt: number // 만료 시간 (30초 후)
}

export interface VMRequestDialogState {
  isOpen: boolean
  vmName: string
  requesterName: string
  timestamp: string
}

export interface VMResponseDialogState {
  type: 'approved' | 'rejected'
  vmName: string
  isOpen: boolean
  hostServer?: string
  approverName?: string
}

interface HypervStore {
  vms: HypervVM[]
  connectedUsers: ConnectedUser[]
  vmRequestDialog: VMRequestDialogState | null // 추가
  vmResponseDialog: VMResponseDialogState | null
  activeRequest: VMRequestState | null // 현재 활성 요청 상태
  initListeners: () => void
  cleanupListeners: () => void
  setVMs: (vms: HypervVM[]) => void
  setConnectedUsers: (users: ConnectedUser[]) => void
  setVMRequestDialog: (state: VMRequestDialogState | null) => void // 추가
  setVMResponseDialog: (state: VMResponseDialogState | null) => void
  setActiveRequest: (state: VMRequestState | null) => void
  requestVM: (vmName: string, currentUserHostname: string) => void
  cancelVMRequest: (vmName: string) => void
}

export const useHypervStore = create<HypervStore>((set) => ({
  vms: [],
  connectedUsers: [],
  vmRequestDialog: null,
  vmResponseDialog: null,
  activeRequest: null,

  setVMs: (vms) => set({ vms }),
  setConnectedUsers: (users) => set({ connectedUsers: users }),
  setVMRequestDialog: (state) => set({ vmRequestDialog: state }),
  setVMResponseDialog: (state) => set({ vmResponseDialog: state }),
  setActiveRequest: (state) => set({ activeRequest: state }),

  initListeners: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[HyperV] 공유 소켓이 없습니다')
      return
    }
    // HyperV 상태 업데이트
    socket.on('hyperv:updated', (updatedVms: HypervVM[]) => {
      set({ vms: updatedVms })
    })

    // VM 요청 성공 (Lock 시작) - 요청자용
    socket.on('vm:request-sent', (data: { vmName: string; requestId: string }) => {
      console.log('[VM Request Sent]:', data)
      const now = Date.now()
      set({
        activeRequest: {
          vmName: data.vmName,
          requestId: data.requestId,
          startTime: now,
          expiresAt: now + 30000 // 30초 후
        }
      })
      toast.info(`${data.vmName} 사용 요청을 전송했습니다. (30초간 유효)`)
    })

    // VM 요청 Lock 상태 (다른 사람이 먼저 요청 중)
    socket.on('vm:request-locked', (data: { vmName: string; firstRequesterName: string }) => {
      toast.error(`이미 ${data.firstRequesterName}님이 요청 중입니다. (30초 동안 Lock)`)
    })

    // VM 요청 수신 (수신자용)
    socket.on('vm:request-received', (data: { vmName: string; requesterName: string; timestamp: string }) => {
      console.log('[VM Request Received]:', data)
      set({
        vmRequestDialog: {
          isOpen: true,
          vmName: data.vmName,
          requesterName: data.requesterName,
          timestamp: data.timestamp
        }
      })
    })

    // VM 승인 수신
    socket.on('vm:approved', (data: { vmName: string; hostServer: string; approverName: string }) => {
      console.log('[VM Approved]:', data)
      set({
        activeRequest: null, // 요청 완료
        vmResponseDialog: {
          type: 'approved',
          vmName: data.vmName,
          isOpen: true,
          hostServer: data.hostServer,
          approverName: data.approverName
        }
      })

      // Windows 네이티브 알림 표시
      window.api.showUniNotification({
        title: 'VM 사용 승인',
        body: `${data.approverName}님이 ${data.vmName} 사용을 승인했습니다!`,
        vmName: data.vmName,
        notificationType: 'vm-approved'
      })
    })

    // VM 거부 수신
    socket.on('vm:rejected', (data: { vmName: string }) => {
      console.log('[VM Rejected]:', data)
      set({
        activeRequest: null, // 요청 완료
        vmResponseDialog: {
          type: 'rejected',
          vmName: data.vmName,
          isOpen: true
        }
      })

      // Windows 네이티브 알림 표시
      window.api.showUniNotification({
        title: 'VM 사용 거부',
        body: `${data.vmName} 사용 요청이 거부되었습니다.`,
        vmName: data.vmName,
        notificationType: 'vm-rejected'
      })
    })

    // VM 요청 타임아웃
    socket.on('vm:timeout', (data: { vmName: string; notificationId?: string }) => {
      console.log('[VM Timeout]:', data)
      set({ activeRequest: null, vmResponseDialog: null, vmRequestDialog: null })
      toast.warning(`${data.vmName} 요청이 30초간 응답이 없어 만료되었습니다.`)

      if (data.notificationId) {
        console.log('[VM Timeout] 알림 삭제 대상:', data.notificationId)
      }
    })

    // 접속자 목록 업데이트 수신
    socket.on('users:connected', (users: ConnectedUser[]) => {
      console.log('[HyperV] 접속자 목록 업데이트:', users.length, '명')
      set({ connectedUsers: users })
    })
  },

  cleanupListeners: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) return

    console.log('[HyperV] 이벤트 리스너 제거')
    socket.off('hyperv:updated')
    socket.off('vm:request-sent')
    socket.off('vm:request-locked')
    socket.off('vm:request-received')
    socket.off('vm:approved')
    socket.off('vm:rejected')
    socket.off('vm:timeout')
    socket.off('users:connected')
  },

  // VM 사용 요청 메서드
  requestVM: (vmName: string, currentHostname: string) => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[VM Request] 공유 소켓이 없습니다')
      return
    }

    // 요청자 hostname 가져오기
    window.api.getHostname().then((requestedByHostname) => {
      socket.emit('vm:request', {
        vmName,
        requestedByHostname,
        currentHostname
      })

      console.log('[VM Request] 요청 전송:', { vmName, requestedByHostname, currentHostname })
    })
  },

  // VM 요청 취소 메서드
  cancelVMRequest: (vmName: string) => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[VM Cancel] 공유 소켓이 없습니다')
      return
    }

    window.api.getHostname().then((requesterHostname) => {
      socket.emit('vm:cancel-request', {
        vmName,
        requesterHostname
      })

      console.log('[VM Cancel] 요청 취소:', { vmName, requesterHostname })

      // 상태 초기화
      set({ activeRequest: null, vmResponseDialog: null })
    })
  }
}))
