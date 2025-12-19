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
