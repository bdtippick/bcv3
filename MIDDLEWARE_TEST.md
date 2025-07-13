# 미들웨어 테스트 가이드

## 🔒 보호된 경로 테스트

### 1. 로그인하지 않은 상태에서 테스트
```
브라우저에서 다음 URL에 접속해보세요:
- http://localhost:3003/dashboard
- http://localhost:3003/dashboard/settings
- http://localhost:3003/dashboard/any-path

결과: 모두 /auth 페이지로 리다이렉트되어야 함
```

### 2. 리다이렉트 기능 테스트
```
http://localhost:3003/dashboard/settings 접속 시
→ http://localhost:3003/auth?redirect=/dashboard/settings 로 리다이렉트
→ 로그인 성공 후 원래 페이지 (/dashboard/settings)로 돌아가야 함
```

### 3. 로그인된 상태에서 /auth 접속 테스트
```
로그인 후 http://localhost:3003/auth 접속 시
→ /dashboard로 자동 리다이렉트되어야 함
```

## 🛡️ 보호되는 경로 목록
- `/dashboard/*` - 모든 대시보드 경로
- `/settings/*` - 설정 관련 경로  
- `/profile/*` - 프로필 관련 경로

## 🔓 보호되지 않는 경로
- `/` - 홈페이지
- `/auth/*` - 인증 관련 페이지
- `/api/*` - API 경로
- 정적 파일들 (이미지, CSS, JS 등)

## 📋 테스트 순서
1. 로그아웃 상태에서 /dashboard 접속 → /auth로 리다이렉트 확인
2. 로그인 후 원래 페이지로 돌아가는지 확인
3. 로그인 상태에서 /auth 접속 → /dashboard로 리다이렉트 확인
4. 개발자 도구 콘솔에서 미들웨어 로그 확인