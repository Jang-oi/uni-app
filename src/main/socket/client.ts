/**
 * Socket.io 클라이언트
 * 서버와 양방향 실시간 통신
 */

import os from 'os'
import { BrowserWindow } from 'electron'
import { io, Socket } from 'socket.io-client'
import { config } from '../config'

class SocketClient {
  private socket: Socket | null = null
  private mainWindow: BrowserWindow | null = null

  /**
   * 메인 윈도우 설정 (IPC 통신용)
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * Socket.io 서버 연결
   */
  connect(): void {
    console.log('[Socket] 서버 연결 시도:', config.serverUrl)

    this.socket = io(config.serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    this.setupEventListeners()
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // 연결 성공
    this.socket.on('connect', () => {
      console.log('[Socket] 연결됨, ID:', this.socket?.id)

      // 클라이언트 정보 전송
      this.socket?.emit('client:connect', {
        hostname: os.hostname(),
        appMode: config.appMode,
        timestamp: new Date().toISOString()
      })
    })

    // 연결 끊김
    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] 연결 끊김:', reason)
    })

    // 연결 오류
    this.socket.on('connect_error', (error) => {
      console.error('[Socket] 연결 오류:', error.message)
    })

    // 재연결 시도
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log('[Socket] 재연결 시도:', attempt)
    })

    // 휴가 데이터 업데이트
    this.socket.on('vacation:updated', (data) => {
      console.log('[Socket] 휴가 데이터 업데이트')
      this.sendToRenderer('vacation:updated', data)
    })

    // 업무 데이터 업데이트
    this.socket.on('task:updated', (data) => {
      console.log('[Socket] 업무 데이터 업데이트')
      this.sendToRenderer('task:updated', data)
    })

    // 업무 알림 (신규/상태변경)
    this.socket.on('task:alert', (data) => {
      console.log('[Socket] 업무 알림:', data.type)
      this.sendToRenderer('task:alert', data)

      // TODO: Windows 알림 표시
    })

    // HyperV 전체 현황
    this.socket.on('hyperv:status', (data) => {
      console.log('[Socket] HyperV 현황 업데이트')
      this.sendToRenderer('hyperv:status', data)
    })

    // HyperV 사용 요청 수신
    this.socket.on('hyperv:request-received', (data) => {
      console.log('[Socket] HyperV 사용 요청:', data.vmName)
      this.sendToRenderer('hyperv:request-received', data)

      // TODO: Windows 알림 표시
    })
  }

  /**
   * Renderer 프로세스로 메시지 전송
   */
  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }

  /**
   * 서버로 이벤트 전송
   */
  emit(event: string, data: any): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('[Socket] 연결되지 않음, 이벤트 전송 실패:', event)
      return
    }

    this.socket.emit(event, data)
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback)
  }

  /**
   * 연결 해제
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[Socket] 연결 해제')
      this.socket.disconnect()
      this.socket = null
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

/**
 * 싱글톤 인스턴스
 */
export const socketClient = new SocketClient()
