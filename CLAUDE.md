# 프로젝트 개발 규칙

## 핵심 데이터베이스 스키마
- 이 프로젝트의 핵심 데이터베이스 스키마는 `database.sql` 파일에 있습니다.
- 모든 백엔드 로직과 타입 정의는 이 파일을 기준으로 해야 합니다.

## 개발 규칙
1. **프론트엔드**: 모든 프론트엔드 코드는 Next.js App Router 기반으로 작성합니다.
2. **상태 관리**: React Query(TanStack Query)를 우선적으로 사용합니다.
3. **UI 컴포넌트**: shadcn/ui 라이브러리를 기반으로 만듭니다.
4. **Supabase 분리**: 
   - 클라이언트 관련 코드는 `/lib/supabase/client.ts`에 관리
   - 서버 관련 코드는 `/lib/supabase/server.ts`에 관리
5. **타입 정의**: 모든 타입 정의는 `database.sql` 스키마를 참고하여 자동 생성하거나 직접 만듭니다.

## 프로젝트 구조
```
src/
├── app/                    # Next.js App Router 페이지
├── components/
│   ├── ui/                # shadcn/ui 기본 컴포넌트
│   └── ...                # 비즈니스 컴포넌트
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # 클라이언트 사이드 Supabase
│   │   └── server.ts      # 서버 사이드 Supabase
│   └── utils.ts           # 유틸리티 함수
├── providers/             # React Context Providers
├── types/
│   └── supabase.ts        # 데이터베이스 타입 정의
└── hooks/                 # React Query 훅들
```

## 환경 변수
필수 환경 변수는 `.env.local` 파일에 설정:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 사이드 작업용 서비스 롤 키 (선택사항)

## 데이터베이스 테이블 구조
주요 테이블들:
- `companies`: 회사 정보 (최상위 테넌트)
- `branches`: 지점 정보 
- `user_profiles`: 사용자 프로필 (Supabase Auth 연동)
- `delivery_platforms`: 배달 플랫폼 마스터 데이터
- `riders`: 라이더 정보
- `settlement_periods`: 정산 기간
- `settlement_records`: 정산 기록
- `uploaded_files`: 업로드 파일 정보
- `audit_logs`: 감사 로그

## 권한 관리
Row Level Security(RLS) 기반 권한 제어:
- `super_admin`: 시스템 전체 관리
- `company_admin`: 회사 내 모든 지점 관리
- `branch_manager`: 자신의 지점만 관리
- `user`: 기본 사용자

## 명령어
- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run lint`: ESLint 실행
- `npm run type-check`: TypeScript 타입 체크

## Supabase 타입 생성
```bash
# Supabase CLI로 타입 생성 (프로젝트 설정 후)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```