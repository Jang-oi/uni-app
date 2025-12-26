import os from 'os'

// 호스트네임과 실제 이름 매핑 객체
const USER_NAME_MAP: Record<string, string> = {
  'local-jang': '장정호',
  'local-junsu': '임준수',
  dongk: '김동혁'
  // 추가 인원이 있다면 여기에 계속 등록하세요.
}

/**
 * 현재 PC의 hostname을 조회하여 매핑된 사용자 이름을 반환합니다.
 * @returns 사용자 이름 (매핑되지 않은 경우 '알 수 없음')
 */
export function getUserName(): string {
  const hostname = os.hostname()
  const userName = USER_NAME_MAP[hostname]

  if (!userName) {
    console.warn(`[User] Unknown hostname: ${hostname}`)
    return '알 수 없음'
  }

  console.log(`[User] Hostname: ${hostname} → User: ${userName}`)
  return userName
}
