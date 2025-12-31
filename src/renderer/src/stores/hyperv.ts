import { BASE_URL } from '@shared/api/client'
import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

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
  socket: Socket | null
  connectionStatus: ConnectionStatus
  vmResponseDialog: VMResponseDialogState | null
  initSocket: (onError?: () => void) => void
  setVMs: (vms: HypervVM[]) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setVMResponseDialog: (state: VMResponseDialogState | null) => void
  requestVM: (vmName: string, currentUserHostname: string) => void
  cancelVMRequest: (vmName: string) => void
}

export const useHypervStore = create<HypervStore>((set, get) => ({
  vms: [],
  socket: null,
  connectionStatus: 'disconnected',
  vmResponseDialog: null,

  setVMs: (vms) => set({ vms }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setVMResponseDialog: (state) => set({ vmResponseDialog: state }),

  initSocket: (onError?: () => void) => {
    // 이미 연결되어 있다면 재연결 방지
    if (get().socket) return

    set({ connectionStatus: 'connecting' })

    const newSocket = io(BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3 // 무한 재시도 대신 3회로 제한
    })

    // 연결 성공
    newSocket.on('connect', async () => {
      console.log('[HyperV] Socket.io 연결 성공')
      set({ connectionStatus: 'connected' })

      // hostname 등록
      const hostname = await window.api.getHostname()
      newSocket.emit('register:user', { hostname })
      console.log('[HyperV] hostname 등록:', hostname)
    })

    // 연결 오류
    newSocket.on('connect_error', (error) => {
      console.error('[HyperV] Socket.io 연결 오류:', error)
      set({ connectionStatus: 'error' })
      // 에러 콜백 실행
      if (onError) {
        onError()
      }
    })

    // 연결 끊김
    newSocket.on('disconnect', (reason) => {
      console.warn('[HyperV] Socket.io 연결 끊김:', reason)
      set({ connectionStatus: 'disconnected' })
      if (reason === 'io server disconnect') {
        // 서버에서 연결을 끊은 경우 수동으로 재연결
        newSocket.connect()
      }
    })

    // 서버가 쏴주는 'hyperv:updated' 이벤트를 상시 감시
    newSocket.on('hyperv:updated', (updatedVms: HypervVM[]) => {
      set({ vms: updatedVms })
    })

    // VM 사용 요청 알림 수신 (기존 - 제거 예정, notification store에서 처리)
    newSocket.on('vm:notification', async (data: { vmName: string; requestedBy: string; message: string }) => {
      console.log('[VM Notification]:', data)
    })

    // VM 대기 상태 수신
    newSocket.on('vm:queue-status', (data: { vmName: string; queuePosition: number; totalWaiting: number; estimatedWaitMessage: string }) => {
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
    newSocket.on('vm:queue-updated', (data: { vmName: string; queuePosition: number; totalWaiting: number }) => {
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
    newSocket.on('vm:approved', (data: { vmName: string; hostServer: string; approverName: string }) => {
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
    newSocket.on('vm:rejected', (data: { vmName: string; reason: 'manual' | 'other-approved'; approvedUserName?: string }) => {
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

    set({ socket: newSocket })
  },

  // VM 사용 요청 메서드
  requestVM: (vmName: string, currentHostname: string) => {
    const socket = get().socket
    if (!socket) {
      console.error('[VM Request] Socket이 연결되지 않음')
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
    const socket = get().socket
    if (!socket) {
      console.error('[VM Cancel] Socket이 연결되지 않음')
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
