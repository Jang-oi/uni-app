/**
 * IPC 핸들러 통합 모듈
 * 모든 핸들러를 한 곳에서 등록
 */

import { registerAdminHandlers } from './adminHandler'
import { registerCrawlerHandlers } from './crawlerHandler'
import { registerCredentialsHandlers } from './credentialsHandler'
import { registerVersionHandlers } from './versionHandler'

/**
 * 모든 IPC 핸들러 등록
 */
export function registerAllHandlers() {
  registerAdminHandlers()
  registerCredentialsHandlers()
  registerCrawlerHandlers()
  registerVersionHandlers()

  console.log('[Handlers] 모든 IPC 핸들러 등록 완료')
}
