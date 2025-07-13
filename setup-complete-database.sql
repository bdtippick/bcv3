-- ===================================================================
-- 배달 라이더 정산 시스템 - 완전한 데이터베이스 스키마
-- ===================================================================
-- 이 파일은 원본 database.sql을 기반으로 한 통합 스키마입니다.
-- 모든 테이블, 인덱스, RLS 정책, 트리거를 포함합니다.
-- ===================================================================

-- ==============================================
-- 1. 사용자 및 권한 관리
-- ==============================================

-- 회사/사업자 테이블
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    business_number VARCHAR(20) UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE "companies" IS '최상위 테넌트 단위인 회사 정보';

-- 지점 테이블
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    manager_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE "branches" IS '회사의 하위 단위인 지점 정보';

-- 사용자 프로필 테이블 (Supabase Auth와 연동)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('super_admin', 'company_admin', 'branch_manager', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE "user_profiles" IS 'Supabase Auth 사용자와 연동되며, 테넌트 및 역할 정보를 가짐';

-- ==============================================
-- 2. 플랫폼 및 정산 설정
-- ==============================================

-- 배달 플랫폼 테이블
CREATE TABLE IF NOT EXISTS delivery_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE "delivery_platforms" IS '배민, 쿠팡이츠 등 배달 플랫폼 마스터 데이터';

-- 초기 플랫폼 데이터 삽입
INSERT INTO delivery_platforms (name, code, description) VALUES
('배민커넥트비즈', 'baemin_connect', '배달의민족 커넥트 비즈니스 플랫폼'),
('쿠팡이츠플러스', 'coupang_eats', '쿠팡이츠 플러스 배달 플랫폼')
ON CONFLICT (code) DO NOTHING;

-- 플랫폼별 정산 설정 테이블
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES delivery_platforms(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}', -- 예: {"start_row": 20, "column_mapping": {...}}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, branch_id, platform_id)
);
COMMENT ON TABLE "platform_settings" IS '지점별, 플랫폼별 엑셀 파싱 설정 등 저장';

-- ==============================================
-- 3. 라이더 관리
-- ==============================================

-- 라이더 테이블
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    rider_id VARCHAR(100) NOT NULL, -- 플랫폼에서 사용하는 라이더 ID
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    hire_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, branch_id, rider_id)
);
COMMENT ON TABLE "riders" IS '지점 소속 라이더 정보';

-- ==============================================
-- 4. 정산 데이터 관리
-- ==============================================

-- 정산 기간 테이블
CREATE TABLE IF NOT EXISTS settlement_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES delivery_platforms(id) ON DELETE CASCADE,
    period_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE "settlement_periods" IS '정산 작업의 단위가 되는 기간 정보';

-- 정산 데이터 메인 테이블
CREATE TABLE IF NOT EXISTS settlement_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_period_id UUID NOT NULL REFERENCES settlement_periods(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES delivery_platforms(id) ON DELETE CASCADE,
    
    -- 기본 정보 (엑셀 파싱)
    rider_code VARCHAR(100) NOT NULL,
    rider_name VARCHAR(255) NOT NULL,
    process_count INTEGER DEFAULT 0,
    
    -- 배달료 관련 (배민커넥트비즈 기준)
    delivery_fee DECIMAL(12,2) DEFAULT 0,
    additional_payment DECIMAL(12,2) DEFAULT 0,
    branch_promotion DECIMAL(12,2) DEFAULT 0,
    
    -- 공제 항목
    employment_insurance DECIMAL(12,2) DEFAULT 0,
    accident_insurance DECIMAL(12,2) DEFAULT 0,
    hourly_insurance DECIMAL(12,2) DEFAULT 0,
    employment_retroactive DECIMAL(12,2) DEFAULT 0,
    accident_retroactive DECIMAL(12,2) DEFAULT 0,
    
    -- 사용자 입력 항목
    commission DECIMAL(12,2) DEFAULT 0,
    rebate DECIMAL(12,2) DEFAULT 0,
    
    -- 자동 계산 항목 (트리거로 계산됨)
    total_delivery_fee DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(delivery_fee, 0) + COALESCE(additional_payment, 0) + COALESCE(branch_promotion, 0) - COALESCE(commission, 0)) STORED,
    settlement_amount DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(delivery_fee, 0) + COALESCE(additional_payment, 0) + COALESCE(branch_promotion, 0) - COALESCE(commission, 0) - COALESCE(employment_insurance, 0) - COALESCE(accident_insurance, 0) - COALESCE(hourly_insurance, 0) - COALESCE(employment_retroactive, 0) - COALESCE(accident_retroactive, 0)) STORED,
    withholding_tax DECIMAL(12,2) GENERATED ALWAYS AS ((COALESCE(delivery_fee, 0) + COALESCE(additional_payment, 0) + COALESCE(branch_promotion, 0) - COALESCE(commission, 0)) * 0.033) STORED,
    final_payment DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(delivery_fee, 0) + COALESCE(additional_payment, 0) + COALESCE(branch_promotion, 0) - COALESCE(commission, 0) - COALESCE(employment_insurance, 0) - COALESCE(accident_insurance, 0) - COALESCE(hourly_insurance, 0) - COALESCE(employment_retroactive, 0) - COALESCE(accident_retroactive, 0) - ((COALESCE(delivery_fee, 0) + COALESCE(additional_payment, 0) + COALESCE(branch_promotion, 0) - COALESCE(commission, 0)) * 0.033) - COALESCE(rebate, 0)) STORED,
    
    -- 플랫폼별 추가 데이터를 위한 JSONB 필드
    platform_data JSONB DEFAULT '{}',
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(settlement_period_id, rider_id)
);
COMMENT ON TABLE "settlement_records" IS '라이더별 최종 정산 내역';

-- ==============================================
-- 5. 파일 및 데이터 관리
-- ==============================================

-- 업로드된 파일 정보 테이블
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    settlement_period_id UUID NOT NULL REFERENCES settlement_periods(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES delivery_platforms(id) ON DELETE CASCADE,
    
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Supabase Storage Path
    file_size INTEGER,
    mime_type VARCHAR(100),
    upload_status VARCHAR(20) DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'processing', 'processed', 'error')),
    
    -- 파싱 결과 정보
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    processing_log JSONB DEFAULT '{}',
    
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE "uploaded_files" IS '업로드된 정산 엑셀 파일의 메타데이터 및 처리 상태';

-- ==============================================
-- 6. 감사 로그
-- ==============================================

-- 데이터 변경 이력 테이블
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    identity UUID REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    table_name TEXT NOT NULL,
    record_id UUID,
    old_record JSONB,
    new_record JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE "audit_logs" IS '주요 데이터의 변경 이력을 기록하는 감사 테이블';

-- ==============================================
-- 7. 인덱스 생성
-- ==============================================

-- 성능 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_companies_business_number ON companies(business_number);
CREATE INDEX IF NOT EXISTS idx_branches_company_id ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch_id ON user_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_riders_company_branch ON riders(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_settlement_periods_company_branch ON settlement_periods(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_settlement_records_period_id ON settlement_records(settlement_period_id);
CREATE INDEX IF NOT EXISTS idx_settlement_records_rider_id ON settlement_records(rider_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_company_branch ON uploaded_files(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_platform_settings_company_branch_platform ON platform_settings(company_id, branch_id, platform_id);

-- ==============================================
-- 8. 헬퍼 함수
-- ==============================================

-- 사용자 역할 정보를 가져오는 헬퍼 함수
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT)
RETURNS JSONB AS $$
    SELECT coalesce(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> claim, null);
$$ LANGUAGE sql STABLE;

-- 헬퍼 함수: 현재 사용자의 프로필 정보를 가져옴
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE(role TEXT, company_id UUID, branch_id UUID) AS $$
  SELECT
    up.role,
    up.company_id,
    up.branch_id
  FROM user_profiles up
  WHERE up.id = auth.uid()
$$ LANGUAGE sql STABLE;

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 9. Row Level Security (RLS) 설정
-- ==============================================

-- RLS 활성화
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "회사 관계자만 자신의 회사 정보를 볼 수 있습니다." ON companies;
DROP POLICY IF EXISTS "회사 관리자만 자신의 회사 정보를 수정할 수 있습니다." ON companies;
DROP POLICY IF EXISTS "회사 관계자는 소속 회사의 지점들을 볼 수 있습니다." ON branches;
DROP POLICY IF EXISTS "지점 관리자는 자신의 지점 정보만 수정할 수 있습니다." ON branches;
DROP POLICY IF EXISTS "회사 관리자는 소속 회사의 모든 지점을 관리할 수 있습니다." ON branches;
DROP POLICY IF EXISTS "회사 관계자는 소속 회사의 라이더 정보를 관리할 수 있습니다." ON riders;
DROP POLICY IF EXISTS "회사 관계자는 소속 회사의 정산 기간 정보를 관리할 수 있습니다." ON settlement_periods;
DROP POLICY IF EXISTS "회사/지점 관리자는 권한에 따라 정산 기록을 볼 수 있습니다." ON settlement_records;

-- 새로운 정책들 삭제 (있다면)
DROP POLICY IF EXISTS "user_profiles_policy" ON user_profiles;
DROP POLICY IF EXISTS "companies_policy" ON companies;
DROP POLICY IF EXISTS "branches_policy" ON branches;
DROP POLICY IF EXISTS "riders_policy" ON riders;
DROP POLICY IF EXISTS "platform_settings_select_policy" ON platform_settings;
DROP POLICY IF EXISTS "platform_settings_insert_policy" ON platform_settings;
DROP POLICY IF EXISTS "platform_settings_update_policy" ON platform_settings;
DROP POLICY IF EXISTS "platform_settings_delete_policy" ON platform_settings;
DROP POLICY IF EXISTS "settlement_periods_policy" ON settlement_periods;
DROP POLICY IF EXISTS "settlement_records_policy" ON settlement_records;
DROP POLICY IF EXISTS "uploaded_files_policy" ON uploaded_files;

-- 간단한 RLS 정책 (사용자 프로필 기반)
CREATE POLICY "user_profiles_policy" ON user_profiles
FOR ALL TO authenticated
USING (id = auth.uid());

CREATE POLICY "companies_policy" ON companies
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid() AND up.company_id = companies.id
    )
);

CREATE POLICY "branches_policy" ON branches
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid() 
        AND (
            up.company_id = branches.company_id OR
            up.role IN ('super_admin')
        )
    )
);

CREATE POLICY "riders_policy" ON riders
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid() 
        AND (
            (up.role = 'branch_manager' AND up.branch_id = riders.branch_id) OR
            (up.role IN ('company_admin', 'super_admin') AND up.company_id = riders.company_id)
        )
    )
);

CREATE POLICY "platform_settings_select_policy" ON platform_settings
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN branches b ON b.id = platform_settings.branch_id
        WHERE up.id = auth.uid()
        AND (
            (up.role = 'branch_manager' AND up.branch_id = platform_settings.branch_id) OR
            (up.role IN ('company_admin', 'super_admin') AND up.company_id = b.company_id)
        )
    )
);

CREATE POLICY "platform_settings_insert_policy" ON platform_settings
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN branches b ON b.id = platform_settings.branch_id
        WHERE up.id = auth.uid()
        AND up.role IN ('branch_manager', 'company_admin', 'super_admin')
        AND (
            (up.role = 'branch_manager' AND up.branch_id = platform_settings.branch_id) OR
            (up.role IN ('company_admin', 'super_admin') AND up.company_id = b.company_id)
        )
    )
);

CREATE POLICY "platform_settings_update_policy" ON platform_settings
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN branches b ON b.id = platform_settings.branch_id
        WHERE up.id = auth.uid()
        AND up.role IN ('branch_manager', 'company_admin', 'super_admin')
        AND (
            (up.role = 'branch_manager' AND up.branch_id = platform_settings.branch_id) OR
            (up.role IN ('company_admin', 'super_admin') AND up.company_id = b.company_id)
        )
    )
);

CREATE POLICY "platform_settings_delete_policy" ON platform_settings
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN branches b ON b.id = platform_settings.branch_id
        WHERE up.id = auth.uid()
        AND up.role IN ('branch_manager', 'company_admin', 'super_admin')
        AND (
            (up.role = 'branch_manager' AND up.branch_id = platform_settings.branch_id) OR
            (up.role IN ('company_admin', 'super_admin') AND up.company_id = b.company_id)
        )
    )
);

CREATE POLICY "settlement_periods_policy" ON settlement_periods
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid() 
        AND (
            (up.role = 'branch_manager' AND up.branch_id = settlement_periods.branch_id) OR
            (up.role IN ('company_admin', 'super_admin') AND up.company_id = settlement_periods.company_id)
        )
    )
);

CREATE POLICY "settlement_records_policy" ON settlement_records
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM settlement_periods sp
        JOIN user_profiles up ON up.id = auth.uid()
        WHERE sp.id = settlement_records.settlement_period_id
        AND (
            (up.role = 'branch_manager' AND up.branch_id = sp.branch_id) OR
            (up.role IN ('company_admin', 'super_admin') AND up.company_id = sp.company_id)
        )
    )
);

CREATE POLICY "uploaded_files_policy" ON uploaded_files
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid() 
        AND (
            (up.role = 'branch_manager' AND up.branch_id = uploaded_files.branch_id) OR
            (up.role IN ('company_admin', 'super_admin') AND up.company_id = uploaded_files.company_id)
        )
    )
);

-- ==============================================
-- 10. 트리거 설정
-- ==============================================

-- 기존 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_branches_updated_at ON branches;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_riders_updated_at ON riders;
DROP TRIGGER IF EXISTS update_settlement_periods_updated_at ON settlement_periods;
DROP TRIGGER IF EXISTS update_settlement_records_updated_at ON settlement_records;
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;

-- 각 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON riders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settlement_periods_updated_at BEFORE UPDATE ON settlement_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settlement_records_updated_at BEFORE UPDATE ON settlement_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 11. 기본 데이터 및 사용자 생성
-- ==============================================

-- 기본 회사 생성
INSERT INTO companies (name, business_number, address)
SELECT '시원컴퍼니', '123-45-67890', '서울시 강남구'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = '시원컴퍼니');

-- 기본 지점 생성
INSERT INTO branches (company_id, name, code, address, manager_name)
SELECT 
  c.id,
  '표준경남창원성산A지점',
  'DP2506195453',
  '경남 창원시',
  'hearpoint'
FROM companies c
WHERE c.name = '시원컴퍼니'
AND NOT EXISTS (
  SELECT 1 FROM branches b 
  WHERE b.company_id = c.id AND b.code = 'DP2506195453'
);

-- 사용자 프로필 자동 생성 (hearpoint@gmail.com 사용자용)
INSERT INTO user_profiles (id, company_id, name, email, role, branch_id)
SELECT 
  u.id,
  c.id as company_id,
  COALESCE(u.raw_user_meta_data->>'name', 'hearpoint') as name,
  u.email,
  'company_admin' as role,
  b.id as branch_id
FROM auth.users u
CROSS JOIN companies c
JOIN branches b ON b.company_id = c.id
WHERE u.email = 'hearpoint@gmail.com'
AND c.name = '시원컴퍼니'
AND b.code = 'DP2506195453'
AND NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = u.id
)
LIMIT 1;

-- ==============================================
-- 12. 최종 확인
-- ==============================================

-- 테이블 목록 확인
SELECT 
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 중요한 데이터 확인
SELECT 'Companies count:' as info, COUNT(*) as count FROM companies
UNION ALL
SELECT 'Branches count:' as info, COUNT(*) as count FROM branches
UNION ALL
SELECT 'User profiles count:' as info, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'Delivery platforms count:' as info, COUNT(*) as count FROM delivery_platforms;