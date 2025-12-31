/**
 * IPC 핸들러 통합 모듈
 * 모든 핸들러를 한 곳에서 등록
 */

import { registerBadgeHandlers } from './badgeHandler'
import { registerNotificationHandlers } from './notificationHandler'
import { registerShellHandlers } from './shellHandler'
import { registerSystemHandlers } from './systemHandler'
import { registerUserHandlers } from './userHandler'
import { registerVersionHandlers } from './versionHandler'

/**
 * 모든 IPC 핸들러 등록
 */
export function registerAllHandlers() {
  registerVersionHandlers()
  registerUserHandlers()
  registerShellHandlers()
  registerNotificationHandlers()
  registerSystemHandlers()
  registerBadgeHandlers()

  console.log('[Handlers] 모든 IPC 핸들러 등록 완료')
}
