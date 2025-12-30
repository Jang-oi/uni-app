/**
 * 사용자 hostname과 실제 이름 매핑
 * 새로운 팀원 추가 시 여기에 등록
 */
export const USER_NAME_MAP: Record<string, string> = {
  'local-jang': '장정호',
  'local-junsu': '임준수',
  dongk: '김동혁'
  // 추가 인원이 있다면 여기에 계속 등록하세요.
}

/**
 * 이름 → hostname 역방향 매핑
 * USER_NAME_MAP에서 자동 생성
 */
export const NAME_TO_HOSTNAME_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(USER_NAME_MAP).map(([hostname, name]) => [name, hostname])
)
