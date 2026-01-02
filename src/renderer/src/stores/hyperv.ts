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

export interface VMResponseDialogState {
  type: 'approved' | 'rejected' | 'waiting'
  vmName: string
  isOpen: boolean
  hostServer?: string
  approverName?: string
  rejectionReason?: 'manual' | 'other-approved'
  approvedUserName?: string
  queuePosition?: number
  totalWaiting?: number
}

interface HypervStore {
  vms: HypervVM[]
  connectedUsers: ConnectedUser[]
  vmResponseDialog: VMResponseDialogState | null
  initListeners: () => void
  cleanupListeners: () => void
  setVMs: (vms: HypervVM[]) => void
  setConnectedUsers: (users: ConnectedUser[]) => void
  setVMResponseDialog: (state: VMResponseDialogState | null) => void
  requestVM: (vmName: string, currentUserHostname: string) => void
  cancelVMRequest: (vmName: string) => void
}

export const useHypervStore = create<HypervStore>((set, get) => ({
  vms: [],
  connectedUsers: [],
  vmResponseDialog: null,

  setVMs: (vms) => set({ vms }),
  setConnectedUsers: (users) => set({ connectedUsers: users }),
  setVMResponseDialog: (state) => set({ vmResponseDialog: state }),

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

    // VM 대기 상태 수신
    socket.on('vm:queue-status', (data: { vmName: string; queuePosition: number; totalWaiting: number; estimatedWaitMessage: string }) => {
      console.log('[VM Queue Status]:', data)
      set({
        vmResponseDialog: {
          type: 'waiting',
          vmName: data.vmName,
          isOpen: true,
          queuePosition: data.queuePosition,
          totalWaiting: data.totalWaiting
        }
      })
    })

    // VM 큐 업데이트 수신 (순번 변경)
    socket.on('vm:queue-updated', (data: { vmName: string; queuePosition: number; totalWaiting: number }) => {
      console.log('[VM Queue Updated]:', data)
      const currentDialog = get().vmResponseDialog
      if (currentDialog && currentDialog.type === 'waiting' && currentDialog.vmName === data.vmName) {
        set({
          vmResponseDialog: {
            ...currentDialog,
            queuePosition: data.queuePosition,
            totalWaiting: data.totalWaiting
          }
        })
      }
    })

    // VM 승인 수신
    socket.on('vm:approved', (data: { vmName: string; hostServer: string; approverName: string }) => {
      console.log('[VM Approved]:', data)
      set({
        vmResponseDialog: {
          type: 'approved',
          vmName: data.vmName,
          isOpen: true,
          hostServer: data.hostServer,
          approverName: data.approverName
        }
      })
    })

    // VM 거부 수신
    socket.on('vm:rejected', (data: { vmName: string; reason: 'manual' | 'other-approved'; approvedUserName?: string }) => {
      console.log('[VM Rejected]:', data)
      set({
        vmResponseDialog: {
          type: 'rejected',
          vmName: data.vmName,
          isOpen: true,
          rejectionReason: data.reason,
          approvedUserName: data.approvedUserName
        }
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
      set({ vmResponseDialog: null })
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
    socket.off('vm:queue-status')
    socket.off('vm:queue-updated')
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

      // Dialog 닫기
      set({ vmResponseDialog: null })
    })
  }
}))
