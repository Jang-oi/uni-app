# 서버 API 설계 문서

## 개요

uni-app 서버는 Express + Socket.io 기반으로 휴가/일정 데이터를 관리하고 실시간으로 클라이언트에 전달합니다.

## 기술 스택

- **런타임**: Node.js (v18+)
- **프레임워크**: Express.js
- **실시간 통신**: Socket.io
- **데이터베이스**: PostgreSQL (권장) 또는 MySQL
- **ORM**: Prisma (권장) 또는 TypeORM
- **타입 안전성**: TypeScript

---

## 데이터베이스 스키마

### 1. vacations 테이블

크롤러에서 수집한 원본 휴가 데이터를 저장합니다.

```sql
CREATE TABLE vacations (
  -- 기본 식별자
  use_id VARCHAR(50) PRIMARY KEY,           -- 휴가 고유 ID
  belong_year VARCHAR(4) NOT NULL,          -- 귀속 연도

  -- 사용자 정보
  us_id VARCHAR(50) NOT NULL,               -- 사용자 ID
  emp_no VARCHAR(20) NOT NULL,              -- 사번
  us_name VARCHAR(50) NOT NULL,             -- 사용자 이름
  dept_name VARCHAR(100) NOT NULL,          -- 부서명

  -- 휴가 타입 정보
  item_id VARCHAR(50) NOT NULL,             -- 휴가 항목 ID
  item_name VARCHAR(50) NOT NULL,           -- 휴가 종류 (연차, 대체휴가 등)
  item_type VARCHAR(10) NOT NULL,           -- 휴가 타입 코드 (10: 연차, 50: 대체 등)

  -- 휴가 기간
  use_sdate DATE NOT NULL,                  -- 시작일
  use_edate DATE NOT NULL,                  -- 종료일
  use_stime VARCHAR(2),                     -- 시작 시간 (예: "09", "14")
  use_etime VARCHAR(2),                     -- 종료 시간 (예: "18", "17")

  -- 휴가 사용량
  use_min VARCHAR(10),                      -- 사용 분
  use_day_cnt VARCHAR(10) NOT NULL,         -- 사용 일수

  -- 시간 타입 정보
  use_time_type VARCHAR(10),                -- 시간 타입 (AM/PM)
  use_time_type_name VARCHAR(20),           -- 시간 타입명 (오전/오후)
  time_unit VARCHAR(10),                    -- 시간 단위 (HOUR/DAY)

  -- 승인 정보
  aprv_doc_sts VARCHAR(1) NOT NULL,         -- 승인 문서 상태 (S: 승인)
  proc_sts VARCHAR(1) NOT NULL,             -- 처리 상태
  aprv_title TEXT,                          -- 승인 제목
  last_aprv_us_name VARCHAR(50),            -- 최종 승인자명
  last_aprv_date VARCHAR(20),               -- 최종 승인일시

  -- 설명
  use_desc TEXT,                            -- 사용 사유

  -- 메타 정보
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 인덱스
  INDEX idx_use_date (use_sdate, use_edate),
  INDEX idx_user (us_id, us_name),
  INDEX idx_dept (dept_name),
  INDEX idx_year (belong_year)
);
```

### 2. tasks 테이블 (향후 업무 관리용)

```sql
CREATE TABLE tasks (
  task_id VARCHAR(50) PRIMARY KEY,
  us_id VARCHAR(50) NOT NULL,
  us_name VARCHAR(50) NOT NULL,
  dept_name VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL,
  priority VARCHAR(20),
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user (us_id),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);
```

---

## REST API 엔드포인트

### 휴가 관련 API

#### 1. GET `/api/vacations`
월별 휴가 데이터 조회

**Query Parameters:**
```typescript
{
  year: string,    // 필수: 연도 (예: "2025")
  month: string    // 필수: 월 (예: "12")
}
```

**Response:**
```typescript
{
  success: true,
  data: [
    {
      useId: string,
      usName: string,
      deptName: string,
      itemName: string,
      useSdate: string,      // YYYY-MM-DD
      useEdate: string,      // YYYY-MM-DD
      useStime: string | null,
      useEtime: string | null,
      useDesc: string
    }
  ]
}
```

#### 2. POST `/api/vacations/sync`
크롤러에서 수집한 데이터 동기화 (Master 앱 전용)

**Request Body:**
```typescript
{
  vacations: Array<VacationRawData>  // 크롤러 원본 데이터
}
```

**Response:**
```typescript
{
  success: true,
  inserted: number,
  updated: number,
  total: number
}
```

**처리 로직:**
1. 기존 데이터와 비교 (use_id 기준)
2. 신규 데이터 INSERT
3. 변경된 데이터 UPDATE
4. Socket.io로 `vacation:updated` 이벤트 브로드캐스트

---

## Socket.io 이벤트

### Client → Server

#### 1. `client:connect`
클라이언트 연결 시 정보 전송

**Data:**
```typescript
{
  hostname: string,
  timestamp: string
}
```

#### 2. `master:claim`
Master 권한 요청

**Data:**
```typescript
{
  hostname: string
}
```

**Response (Callback):**
```typescript
{
  success: boolean
}
```

#### 3. `master:release`
Master 권한 반납

**Data:**
```typescript
{
  hostname: string
}
```

### Server → Client

#### 1. `vacation:updated`
휴가 데이터 업데이트 알림

**Data:**
```typescript
{
  year: string,
  month: string,
  count: number
}
```

#### 2. `task:updated`
업무 데이터 업데이트 알림

**Data:**
```typescript
{
  count: number
}
```

#### 3. `task:alert`
업무 알림 (신규/상태 변경)

**Data:**
```typescript
{
  type: "new" | "status_changed",
  task: TaskData
}
```

#### 4. `master:revoked`
Master 권한 강제 해제

**Data:**
```typescript
{
  newMasterHostname: string
}
```

---

## 데이터 가공 로직

### 1. 크롤러 데이터 → DB 저장

**파일**: `src/services/vacationService.ts`

```typescript
export const syncVacations = async (rawData: VacationRawData[]) => {
  const operations = {
    inserted: 0,
    updated: 0
  }

  for (const item of rawData) {
    // 필수 필드만 추출하여 DB에 저장
    const vacation = {
      useId: item.useId,
      belongYear: item.belongYear,
      usId: item.usId,
      empNo: item.empNo,
      usName: item.usName,
      deptName: item.deptName,
      itemId: item.itemId,
      itemName: item.itemName,
      itemType: item.itemType,
      useSdate: item.useSdate,
      useEdate: item.useEdate,
      useStime: item.useStime,
      useEtime: item.useEtime,
      useMin: item.useMin,
      useDayCnt: item.useDayCnt,
      useTimeType: item.useTimeType,
      useTimeTypeName: item.useTimeTypeName,
      timeUnit: item.timeUnit,
      aprvDocSts: item.aprvDocSts,
      procSts: item.procSts,
      aprvTitle: item.aprvTitle,
      lastAprvUsName: item.lastAprvUsName,
      lastAprvDate: item.lastAprvDate,
      useDesc: item.useDesc
    }

    // UPSERT (존재하면 UPDATE, 없으면 INSERT)
    const existing = await db.vacation.findUnique({
      where: { useId: vacation.useId }
    })

    if (existing) {
      await db.vacation.update({
        where: { useId: vacation.useId },
        data: vacation
      })
      operations.updated++
    } else {
      await db.vacation.create({ data: vacation })
      operations.inserted++
    }
  }

  return operations
}
```

### 2. DB → 프론트엔드 전달

**파일**: `src/controllers/vacationController.ts`

```typescript
export const getVacations = async (req, res) => {
  const { year, month } = req.query

  if (!year || !month) {
    return res.status(400).json({
      success: false,
      error: 'year와 month는 필수입니다'
    })
  }

  // 해당 월의 시작일과 종료일
  const startDate = `${year}-${month.padStart(2, '0')}-01`
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
  const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`

  // DB에서 조회 (해당 월에 겹치는 모든 휴가)
  const vacations = await db.vacation.findMany({
    where: {
      OR: [
        {
          AND: [
            { useSdate: { gte: startDate } },
            { useSdate: { lte: endDate } }
          ]
        },
        {
          AND: [
            { useEdate: { gte: startDate } },
            { useEdate: { lte: endDate } }
          ]
        },
        {
          AND: [
            { useSdate: { lt: startDate } },
            { useEdate: { gt: endDate } }
          ]
        }
      ]
    },
    select: {
      useId: true,
      usName: true,
      deptName: true,
      itemName: true,
      useSdate: true,
      useEdate: true,
      useStime: true,
      useEtime: true,
      useDesc: true,
      useTimeTypeName: true
    },
    orderBy: [
      { useSdate: 'asc' },
      { usName: 'asc' }
    ]
  })

  res.json({
    success: true,
    data: vacations
  })
}
```

---

## 환경 변수 (.env)

```env
# 서버 포트
PORT=3000

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/uniapp

# CORS (Electron 앱 허용)
ALLOWED_ORIGINS=http://localhost:*

# JWT (향후 인증용)
JWT_SECRET=your-secret-key

# Socket.io
SOCKET_CORS_ORIGIN=http://localhost:*
```

---

## 프로젝트 구조

```
server/
├── src/
│   ├── controllers/
│   │   ├── vacationController.ts
│   │   └── taskController.ts
│   ├── services/
│   │   ├── vacationService.ts
│   │   ├── taskService.ts
│   │   └── masterService.ts
│   ├── routes/
│   │   ├── vacation.routes.ts
│   │   ├── task.routes.ts
│   │   └── index.ts
│   ├── socket/
│   │   ├── handlers.ts
│   │   └── events.ts
│   ├── db/
│   │   ├── prisma.ts
│   │   └── migrations/
│   ├── types/
│   │   └── vacation.types.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
└── .env
```

---

## 구현 우선순위

### Phase 1: 기본 인프라 (1주)
- [x] Express 서버 설정
- [x] Socket.io 통합
- [x] PostgreSQL 연결
- [ ] Prisma 스키마 작성

### Phase 2: 휴가 API (1주)
- [ ] vacations 테이블 생성
- [ ] GET `/api/vacations` 구현
- [ ] POST `/api/vacations/sync` 구현
- [ ] Socket.io `vacation:updated` 이벤트

### Phase 3: Master 모드 관리 (3일)
- [x] Master 권한 요청/반납 로직
- [x] 중복 Master 방지
- [x] `master:revoked` 이벤트

### Phase 4: 업무 관리 (향후)
- [ ] tasks 테이블 생성
- [ ] 업무 CRUD API
- [ ] 업무 알림 시스템

---

## 보안 고려사항

1. **인증/인가**: 현재는 사내 네트워크 전용이지만, 향후 JWT 기반 인증 추가 고려
2. **입력 검증**: 모든 API 요청에 대해 joi 또는 zod로 검증
3. **SQL Injection**: Prisma ORM 사용으로 자동 방어
4. **CORS**: 특정 Origin만 허용 (Electron 앱)
5. **Rate Limiting**: express-rate-limit으로 API 남용 방지

---

## 모니터링 및 로깅

- **로깅**: winston 사용, 파일 및 콘솔 로그
- **에러 추적**: Sentry 또는 자체 에러 로그
- **성능 모니터링**: API 응답 시간, DB 쿼리 성능

---

## 테스트 전략

1. **단위 테스트**: Jest로 서비스 로직 테스트
2. **통합 테스트**: Supertest로 API 엔드포인트 테스트
3. **Socket.io 테스트**: socket.io-client로 실시간 이벤트 테스트

---

## 배포 전략

### 개발 환경
- 로컬 개발 서버 (nodemon)
- 개발용 PostgreSQL 인스턴스

### 프로덕션 환경
- PM2로 프로세스 관리
- Nginx 리버스 프록시
- PostgreSQL 백업 자동화
- 무중단 배포 (PM2 reload)

---

## 다음 단계

1. **서버 프로젝트 초기화**
   ```bash
   mkdir server && cd server
   pnpm init
   pnpm add express socket.io @prisma/client
   pnpm add -D typescript @types/express @types/node prisma ts-node-dev
   ```

2. **Prisma 스키마 작성** (prisma/schema.prisma)

3. **기본 Express + Socket.io 서버 구현**

4. **크롤러 연동 테스트**

5. **프론트엔드 API 연동**
