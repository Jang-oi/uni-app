/**
 * 알림 시스템 타입 정의
 */

export type NotificationType = 'task-check' | 'task-support' | 'vm-request'

export interface Notification {
  id: string // UUID
  type: NotificationType // 요청 타입
  senderHostname: string // 발신자 호스트네임
  senderName: string // 발신자 이름
  receiverHostname: string // 수신자 호스트네임
  receiverName: string // 수신자 이름
  message: string // 알림 메시지
  timestamp: string // ISO 8601 형식
  isRead: boolean // 읽음 여부

  // 업무 관련 (task-check, task-support 타입일 때 사용)
  taskId?: string // SR_IDX
  taskTitle?: string // 업무 제목

  // VM 관련 (vm-request 타입일 때 사용)
  vmName?: string // VM 이름
}
