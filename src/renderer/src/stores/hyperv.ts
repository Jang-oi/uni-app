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
  expiresAt: number // 만료 시간 (60초 후)
}

export interface VMResponseDialogState {
  type: 'approved' | 'rejected'
  vmName: string
  isOpen: boolean
  hostServer?: string
  approverName?: string
  rejectionReason?: 'manual' | 'other-approved'
  approvedUserName?: string
}

interface HypervStore {
  vms: HypervVM[]
  connectedUsers: ConnectedUser[]
  vmResponseDialog: VMResponseDialogState | null
  activeRequest: VMRequestState | null // 현재 활성 요청 상태
  initListeners: () => void
  cleanupListeners: () => void
  setVMs: (vms: HypervVM[]) => void
  setConnectedUsers: (users: ConnectedUser[]) => void
  setVMResponseDialog: (state: VMResponseDialogState | null) => void
  setActiveRequest: (state: VMRequestState | null) => void
  requestVM: (vmName: string, currentUserHostname: string) => void
  cancelVMRequest: (vmName: string) => void
}

export const useHypervStore = create<HypervStore>((set) => ({
  vms: [],
  connectedUsers: [],
  vmResponseDialog: null,
  activeRequest: null,

  setVMs: (vms) => set({ vms }),
  setConnectedUsers: (users) => set({ connectedUsers: users }),
  setVMResponseDialog: (state) => set({ vmResponseDialog: state }),
  setActiveRequest: (state) => set({ activeRequest: state }),

  initListeners: () => {
    const socket = useSocketStore.getState().getSocket()
    if (!socket) {
      console.error('[HyperV] 공유 소켓이 없습니다')
      return
    }

    console.log('[HyperV] 이벤트 리스너 등록')

    // HyperV 상태 업데이트
    socket.on('hyperv:updated', (updatedVms: HypervVM[]) => {
      set({ vms: updatedVms })
    })

    // VM 요청 성공 (Lock 시작)
    socket.on('vm:request-sent', (data: { vmName: string; requestId: string }) => {
      console.log('[VM Request Sent]:', data)
      const now = Date.now()
      set({
        activeRequest: {
          vmName: data.vmName,
          requestId: data.requestId,
          startTime: now,
          expiresAt: now + 60000 // 60초 후
        }
      })
    })

    // VM 요청 Lock 상태 (다른 사람이 먼저 요청 중)
    socket.on('vm:request-locked', (data: { vmName: string; firstRequesterName: string }) => {
      console.log('[VM Request Locked]:', data)
      // Toast로 표시 (virtual-machines-page에서 처리)
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
    socket.on('vm:rejected', (data: { vmName: string; reason: 'manual' | 'other-approved'; approvedUserName?: string }) => {
      console.log('[VM Rejected]:', data)
      set({
        activeRequest: null, // 요청 완료
        vmResponseDialog: {
          type: 'rejected',
          vmName: data.vmName,
          isOpen: true,
          rejectionReason: data.reason,
          approvedUserName: data.approvedUserName
        }
      })

      // Windows 네이티브 알림 표시
      const rejectionMessage =
        data.reason === 'manual'
          ? `${data.vmName} 사용 요청이 거부되었습니다.`
          : `${data.vmName} 사용 요청이 거부되었습니다. (${data.approvedUserName}님이 승인받음)`

      window.api.showUniNotification({
        title: 'VM 사용 거부',
        body: rejectionMessage,
        vmName: data.vmName,
        notificationType: 'vm-rejected'
      })
    })

    // VM 중복 요청 감지
    socket.on('vm:request-duplicate', (data: { vmName: string; firstRequesterName: string }) => {
      console.log('[VM Request Duplicate]:', data)
      // Toast로 표시 (virtual-machines-page에서 처리)
    })

    // VM 요청 타임아웃
    socket.on('vm:timeout', (data: { vmName: string }) => {
      console.log('[VM Timeout]:', data)
      set({ activeRequest: null, vmResponseDialog: null })
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
    socket.off('vm:approved')
    socket.off('vm:rejected')
    socket.off('vm:request-duplicate')
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
