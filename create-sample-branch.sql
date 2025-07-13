-- 샘플 지점 생성 스크립트

-- 현재 사용자의 회사 ID 확인
SELECT up.id, up.name, up.email, up.role, up.company_id, c.name as company_name
FROM user_profiles up
LEFT JOIN companies c ON c.id = up.company_id
ORDER BY up.created_at DESC;

-- 기존 지점 확인
SELECT b.id, b.name, b.code, b.company_id, c.name as company_name
FROM branches b
LEFT JOIN companies c ON c.id = b.company_id
ORDER BY b.created_at DESC;

-- 지점이 없다면 샘플 지점 생성 (company_id를 실제 값으로 변경하세요)
INSERT INTO branches (company_id, name, code, address, manager_name, phone) VALUES 
(
  (SELECT company_id FROM user_profiles WHERE email = 'hearpoint@gmail.com' LIMIT 1),
  '을지로 본점',
  'EULJI001', 
  '서울시 중구 을지로',
  '김관리자',
  '02-1234-5678'
);

-- 사용자의 branch_id 업데이트 (필요한 경우)
UPDATE user_profiles 
SET branch_id = (
  SELECT id FROM branches 
  WHERE company_id = user_profiles.company_id 
  LIMIT 1
)
WHERE branch_id IS NULL AND role IN ('branch_manager', 'company_admin', 'super_admin');

-- 결과 확인
SELECT up.id, up.name, up.email, up.role, up.company_id, up.branch_id, 
       c.name as company_name, b.name as branch_name, b.code as branch_code
FROM user_profiles up
LEFT JOIN companies c ON c.id = up.company_id
LEFT JOIN branches b ON b.id = up.branch_id
ORDER BY up.created_at DESC;