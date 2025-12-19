/**
 * Socket.io 클라이언트 (함수형 프로그래밍)
 * 서버와 양방향 실시간 통신
 */

import os from 'os'
import { BrowserWindow } from 'electron'
import { io, Socket } from 'socket.io-client'
import { appConfig } from '../config'

/**
 * Socket 클라이언트 상태
 */
type SocketClientState = {
  socket: Socket | null
  mainWindow: BrowserWindow | null
}

let clientState: SocketClientState = {
  socket: null,
  mainWindow: null
}

/**
 * 메인 윈도우 설정 (IPC 통신용)
 */
export const setMainWindow = (window: BrowserWindow): void => {
  clientState = { ...clientState, mainWindow: window }
}

/**
 * 이벤트 리스너 설정
 */
const setupEventListeners = (socket: Socket): void => {
  // 연결 성공
  socket.on('connect', () => {
    console.log('[Socket] 연결됨, ID:', socket.id)

    // 클라이언트 정보 전송
    socket.emit('client:connect', {
      hostname: os.hostname(),
      timestamp: new Date().toISOString()
    })
  })

  // 연결 끊김
  socket.on('disconnect', (reason) => {
    console.log('[Socket] 연결 끊김:', reason)
  })

  // 연결 오류
  socket.on('connect_error', (error) => {
    console.error('[Socket] 연결 오류:', error.message)
  })

  // 재연결 시도
  socket.on('reconnect_attempt', (attempt) => {
    console.log('[Socket] 재연결 시도:', attempt)
  })

  // 휴가 데이터 업데이트
  socket.on('vacation:updated', (data) => {
    console.log('[Socket] 휴가 데이터 업데이트')
    sendToRenderer('vacation:updated', data)
  })

  // 업무 데이터 업데이트
  socket.on('task:updated', (data) => {
    console.log('[Socket] 업무 데이터 업데이트')
    sendToRenderer('task:updated', data)
  })

  // 업무 알림 (신규/상태변경)
  socket.on('task:alert', (data) => {
    console.log('[Socket] 업무 알림:', data.type)
    sendToRenderer('task:alert', data)
    // TODO: Windows 알림 표시
  })

  // HyperV 전체 현황
  socket.on('hyperv:status', (data) => {
    console.log('[Socket] HyperV 현황 업데이트')
    sendToRenderer('hyperv:status', data)
  })

  // HyperV 사용 요청 수신
  socket.on('hyperv:request-received', (data) => {
    console.log('[Socket] HyperV 사용 요청:', data.vmName)
    sendToRenderer('hyperv:request-received', data)
    // TODO: Windows 알림 표시
  })

  // Master 권한 강제 해제 (다른 PC가 Master 요청)
  socket.on('master:revoked', (data) => {
    console.log('[Socket] Master 권한이 다른 PC에게 넘어감:', data.newMasterHostname)
    sendToRenderer('master:revoked', data)
  })
}

/**
 * Renderer 프로세스로 메시지 전송
 */
const sendToRenderer = (channel: string, data: unknown): void => {
  const { mainWindow } = clientState
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}

/**
 * Socket.io 서버 연결
 */
export const connect = (): void => {
  console.log('[Socket] 서버 연결 시도:', appConfig.serverUrl)

  const socket = io(appConfig.serverUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  })

  setupEventListeners(socket)

  clientState = { ...clientState, socket }
}

/**
 * Master 권한 요청
 */
export const claimMaster = async (): Promise<boolean> => {
  const { socket } = clientState

  if (!socket || !socket.connected) {
    console.warn('[Socket] 서버 연결되지 않음')
    return false
  }

  return new Promise((resolve) => {
    socket.emit('master:claim', { hostname: os.hostname() }, (response: { success: boolean }) => {
      if (response.success) {
        console.log('[Socket] Master 권한 획득 성공')
        resolve(true)
      } else {
        console.log('[Socket] Master 권한 획득 실패 (다른 PC가 실행 중)')
        resolve(false)
      }
    })
  })
}

/**
 * Master 권한 반납
 */
export const releaseMaster = (): void => {
  const { socket } = clientState

  if (!socket || !socket.connected) {
    return
  }

  socket.emit('master:release', { hostname: os.hostname() })
  console.log('[Socket] Master 권한 반납')
}

/**
 * 서버로 이벤트 전송
 */
export const emit = (event: string, data: unknown): void => {
  const { socket } = clientState

  if (!socket || !socket.connected) {
    console.warn('[Socket] 연결되지 않음, 이벤트 전송 실패:', event)
    return
  }

  socket.emit(event, data)
}

/**
 * 이벤트 리스너 등록
 */
export const on = (event: string, callback: (data: unknown) => void): void => {
  const { socket } = clientState
  socket?.on(event, callback)
}

/**
 * 연결 해제
 */
export const disconnect = (): void => {
  const { socket } = clientState

  if (socket) {
    console.log('[Socket] 연결 해제')
    socket.disconnect()
    clientState = { ...clientState, socket: null }
  }
}

/**
 * 연결 상태 확인
 */
export const isConnected = (): boolean => {
  const { socket } = clientState
  return socket?.connected || false
}

/**
 * 레거시 호환성을 위한 객체 export (기존 코드가 socketClient.method() 방식으로 호출)
 */
export const socketClient = {
  setMainWindow,
  connect,
  claimMaster,
  releaseMaster,
  emit,
  on,
  disconnect,
  isConnected
}
