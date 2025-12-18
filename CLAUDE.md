# uni-app 프로젝트 규칙

## 프로젝트 개요

**uni-app**은 구독4팀에서 사용하는 Electron 기반 Desktop 애플리케이션입니다.

### 주요 기능

- 📅 **휴가/일정 공유**: 팀원들의 휴가와 일정을 실시간으로 확인
- 📋 **업무 조회 및 알림**: 팀 업무를 조회하고 중요한 업데이트 알림
- 💻 **HyperV 사용 현황**: 가상머신 사용 현황 공유 및 사용 요청

### 시스템 구성

- **Master App** (1대): 크롤링 + 스케줄링 + 일반 기능
- **Client App** (팀원): 조회 + 알림 + HyperV 모니터링
- **Express Server** (공용 PC): REST API + Socket.io

---

## 개발 환경 규칙

### 1. 패키지 매니저

**✅ 항상 pnpm 사용**

```bash
# 올바른 방법
pnpm add [package]
pnpm add -D [package]
pnpm install

# ❌ 절대 사용 금지
npm install
yarn add
```

### 2. 코드 포맷팅

**Prettier 자동 적용**

- `.prettierrc.yaml` 설정 준수
- 저장 시 자동 포맷팅 권장
- Import 정렬: react → 서드파티 → @/ → 상대경로

```yaml
# 주요 설정
singleQuote: true # 작은따옴표 사용
semi: false # 세미콜론 제거
printWidth: 140 # 한 줄 최대 140자
trailingComma: none # 후행 쉼표 없음
```

### 3. TypeScript

- **strict 모드** 활성화
- any 타입 사용 최소화
- 모든 함수에 반환 타입 명시 권장

### 4. 파일/디렉토리 명명 규칙

```
src/
├── main/              # Electron 메인 프로세스 (PascalCase 클래스, camelCase 파일)
│   ├── config.ts
│   ├── socket/
│   ├── crawler/
│   └── hyperv/
├── preload/           # Preload 스크립트
└── renderer/          # React 앱
    └── src/
        ├── components/   # PascalCase 컴포넌트
        ├── pages/       # kebab-case-page.tsx
        ├── stores/      # camelCase.ts
        └── lib/         # 유틸리티
```

---

## 커뮤니케이션 규칙

### 1. 응답 언어

**✅ 모든 응답은 한국어로 작성**

- 코드 주석: 한국어
- 커밋 메시지: 한국어
- 문서: 한국어
- 설명 및 가이드: 한국어

**예외**: 코드 내 변수명, 함수명은 영어 사용

### 2. 설명 스타일

- 간결하고 명확하게
- 기술적 용어는 영문 병기 (예: "상태 관리 (State Management)")
- 이모지 활용으로 가독성 향상

---

## 코딩 컨벤션

### 1. React 컴포넌트

```typescript
// ✅ 올바른 방식
export function ComponentName() {
  // Hooks at top
  const [state, setState] = useState()

  // Event handlers
  const handleClick = () => {}

  // Render
  return <div>...</div>
}

// ❌ 잘못된 방식
export default function() { ... }  // 익명 함수 금지
const Component = () => { ... }    // 화살표 함수 지양
```

### 2. Import 순서

```typescript
// 1. React
import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
// 2. 외부 라이브러리
import { motion } from 'motion/react'
// 3. 내부 모듈 (@/)
import { Button } from '@/components/ui/button'
import { useTaskStore } from '@/stores/task'
// 4. 상대 경로
import { utils } from '../lib/utils'
```

### 3. 아이콘 사용

**@hugeicons/react 사용**

```typescript
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon } from '@hugeicons/core-free-icons'

<HugeiconsIcon icon={Calendar03Icon} className="w-5 h-5" />
```

### 4. 상태 관리

**Zustand 사용 예정**

```typescript
// stores/task.ts
import { create } from 'zustand'

interface TaskStore {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks })
}))
```

---

## Electron 개발 규칙

### 1. Master vs Client 모드

```typescript
// 환경 변수로 모드 구분
const isMaster = process.env.APP_MODE === 'master'

if (isMaster) {
  // 크롤러, 스케줄러 시작 (Master만)
  crawlerScheduler.start()
}

// 공통 기능 (모든 앱)
hypervMonitor.start()
socketClient.connect()
```

### 2. IPC 통신 패턴

```typescript
// Main → Renderer
mainWindow?.webContents.send('event-name', data)

// Renderer → Main (preload를 통해)
window.electron.invokeMethod(args)
```

### 3. 보안

- **contextIsolation: true** 필수
- **nodeIntegration: false** 필수
- preload 스크립트를 통한 안전한 API 노출

---

## 환경 변수 관리

### .env 구조

```env
# 앱 모드 (필수)
APP_MODE=client              # client | master

# 서버 연결 (필수)
SERVER_URL=http://192.168.x.x:3000

# Master 전용 (Master 모드일 때만 필요)
VACATION_SITE_URL=https://vacation.company.com
TASK_SITE_URL=https://task.company.com
TEAM_MEMBERS=홍길동,김철수,이영희,박민수,최지원,정다희
```

### 환경 변수 접근

```typescript
// Main 프로세스
const serverUrl = process.env.SERVER_URL

// Renderer 프로세스 (vite가 자동 주입)
const serverUrl = import.meta.env.VITE_SERVER_URL
```

---

## Git 워크플로우

### 1. 커밋 메시지

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 설정 변경

# 예시
feat: Socket.io 클라이언트 구현
fix: HyperV 모니터 연결 오류 수정
docs: IMPLEMENTATION_GUIDE.md 업데이트
```

### 2. 브랜치 전략

```
main           # 프로덕션
develop        # 개발 통합
feature/*      # 기능 개발
fix/*          # 버그 수정
```

---

## 디버깅 및 로깅

### 1. 로그 레벨

```typescript
// Main 프로세스
console.log('[Main]', message)
console.error('[Main] Error:', error)

// Renderer 프로세스
console.log('[Renderer]', message)
console.error('[Renderer] Error:', error)

// 크롤러
console.log('[Crawler:Vacation]', message)
console.log('[Crawler:Task]', message)
```

### 2. Electron DevTools

```typescript
// 개발 모드에서만 DevTools 자동 열기
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools()
}
```

---

## 주요 명령어

```bash
# 개발 서버 시작
pnpm dev

# 프로덕션 빌드
pnpm build

# Windows 배포 파일 생성
pnpm build:win

# 코드 포맷팅
npx prettier --write "src/**/*.{ts,tsx}"

# 타입 체크
pnpm typecheck

# 린트 검사
pnpm lint
```

---

## 문제 해결 가이드

### 1. Socket.io 연결 안 됨

- 서버 URL 확인 (`.env` 파일)
- 서버가 실행 중인지 확인
- 방화벽 설정 확인

### 2. 크롤러 작동 안 됨

- `APP_MODE=master` 설정 확인
- 크롤링 대상 사이트 URL 확인
- BrowserWindow show: true로 디버깅

### 3. HyperV 감지 안 됨

- PowerShell 실행 권한 확인
- HyperV 연결 상태 확인 (vmconnect 실행 중?)
- Port 2179 사용 여부 확인 (netstat)

---

## 참고 문서

- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Phase별 구현 가이드
- [4team_dashboard_system.txt](./4team_dashboard_system.txt) - 상세 기획서
- [Electron 공식 문서](https://www.electronjs.org/docs)
- [Electron-Vite 문서](https://electron-vite.org/)

---

## 업데이트 이력

- 2025-01-XX: 초기 규칙 작성
