import os from 'os'

/**
 * 현재 PC의 hostname을 반환합니다.
 * @returns hostname 문자열
 */
export function getHostname(): string {
  const hostname = os.hostname()
  console.log(`[System] Hostname: ${hostname}`)
  return hostname
}
