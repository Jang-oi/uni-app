/**
 * HyperV 현황 Zustand 스토어
 */

import { create } from 'zustand'

export interface HypervVM {
  vmName: string
  currentUser: string | null
  userHostname: string | null
  isConnected: boolean
  lastUpdate: string
}

export interface HypervRequest {
  vmName: string
  requester: string
  requestTime: string
  status: 'pending' | 'approved' | 'rejected'
}

interface HypervStore {
  vms: HypervVM[]
  requests: HypervRequest[]
  setVMs: (vms: HypervVM[]) => void
  addRequest: (request: HypervRequest) => void
  clearRequests: () => void
}

export const useHypervStore = create<HypervStore>((set) => ({
  vms: [],
  requests: [],
  setVMs: (vms) => set({ vms }),
  addRequest: (request) => set((state) => ({ requests: [...state.requests, request] })),
  clearRequests: () => set({ requests: [] })
}))

// Socket 리스너 설정
if (typeof window !== 'undefined' && window.api) {
  window.api.onHypervStatus((data) => {
    useHypervStore.getState().setVMs(
      (Array.isArray(data) ? data : []).map((vm) => ({
        ...vm,
        lastUpdate: new Date().toISOString()
      }))
    )
  })

  window.api.onHypervRequest((data) => {
    useHypervStore.getState().addRequest({
      vmName: data.vmName,
      requester: data.requester || 'Unknown',
      requestTime: new Date().toISOString(),
      status: 'pending'
    })
  })
}
