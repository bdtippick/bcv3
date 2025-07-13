-- ==============================================
-- 1. 사용자 및 권한 관리
-- ==============================================

-- 회사/사업자 테이블
CREATE TABLE companies (
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
CREATE TABLE branches (
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
CREATE TABLE user_profiles (
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

-- 사용자 역할 정보를 가져오는 헬퍼 함수
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT)
RETURNS JSONB AS $$
    SELECT coalesce(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> claim, null);
$$ LANGUAGE sql STABLE;

-- ==============================================
-- 2. 플랫폼 및 정산 설정
-- ==============================================

-- 배달 플랫폼 테이블
CREATE TABLE delivery_platforms (
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
('쿠팡이츠플러스', 'coupang_eats', '쿠팡이츠 플러스 배달 플랫폼');

-- 플랫폼별 정산 설정 테이블
CREATE TABLE platform_settings (
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
-- NOTE: 한 라이더가 여러 지점에서 일하는 시나리오가 필요하다면, 이 테이블을 회사 단위로 통합하고
--       'branch_riders' 같은 중간 테이블(Many-to-Many)을 두는 구조 변경을 고려할 수 있습니다.
CREATE TABLE riders (
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
CREATE TABLE settlement_periods (
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
CREATE TABLE settlement_records (
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
-- NOTE: 복잡한 계산 로직은 트리거 대신 `GENERATED ALWAYS AS (...) STORED`를 사용하여 성능과 관리 용이성을 높였습니다.

-- ==============================================
-- 5. 파일 및 데이터 관리
-- ==============================================

-- 업로드된 파일 정보 테이블
CREATE TABLE uploaded_files (
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
CREATE TABLE audit_logs (
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
CREATE INDEX idx_companies_business_number ON companies(business_number);
CREATE INDEX idx_branches_company_id ON branches(company_id);
CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_branch_id ON user_profiles(branch_id);
CREATE INDEX idx_riders_company_branch ON riders(company_id, branch_id);
CREATE INDEX idx_settlement_periods_company_branch ON settlement_periods(company_id, branch_id);
CREATE INDEX idx_settlement_records_period_id ON settlement_records(settlement_period_id);
CREATE INDEX idx_settlement_records_rider_id ON settlement_records(rider_id);
CREATE INDEX idx_uploaded_files_company_branch ON uploaded_files(company_id, branch_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- ==============================================
-- 8. Row Level Security (RLS) 설정
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

-- 헬퍼 함수: 현재 사용자의 역할, 회사ID, 지점ID를 가져옴
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE(role TEXT, company_id UUID, branch_id UUID) AS $$
  SELECT
    CASE 
      WHEN get_my_claim('user_role') IS NOT NULL
      THEN (get_my_claim('user_role') ->> 0)::TEXT
      ELSE NULL
    END,
    CASE 
      WHEN get_my_claim('company_id') IS NOT NULL
      THEN (get_my_claim('company_id') ->> 0)::UUID
      ELSE NULL
    END,
    CASE 
      WHEN get_my_claim('branch_id') IS NOT NULL
      THEN (get_my_claim('branch_id') ->> 0)::UUID
      ELSE NULL
    END
$$ LANGUAGE sql STABLE;

-- 정책: companies
CREATE POLICY "회사 관계자만 자신의 회사 정보를 볼 수 있습니다." ON companies
    FOR SELECT USING (id = (SELECT company_id FROM get_current_user_info()));
CREATE POLICY "회사 관리자만 자신의 회사 정보를 수정할 수 있습니다." ON companies
    FOR UPDATE USING (id = (SELECT company_id FROM get_current_user_info()) AND (SELECT role FROM get_current_user_info()) = 'company_admin');

-- 정책: branches
CREATE POLICY "회사 관계자는 소속 회사의 지점들을 볼 수 있습니다." ON branches
    FOR SELECT USING (company_id = (SELECT company_id FROM get_current_user_info()));
CREATE POLICY "지점 관리자는 자신의 지점 정보만 수정할 수 있습니다." ON branches
    FOR UPDATE USING (id = (SELECT branch_id FROM get_current_user_info()) AND (SELECT role FROM get_current_user_info()) = 'branch_manager');
CREATE POLICY "회사 관리자는 소속 회사의 모든 지점을 관리할 수 있습니다." ON branches
    FOR ALL USING (company_id = (SELECT company_id FROM get_current_user_info()) AND (SELECT role FROM get_current_user_info()) = 'company_admin');

-- 정책: riders
CREATE POLICY "회사 관계자는 소속 회사의 라이더 정보를 관리할 수 있습니다." ON riders
    FOR ALL USING (company_id = (SELECT company_id FROM get_current_user_info()))
    WITH CHECK (
        -- 지점 관리자는 자기 지점의 라이더만 추가/수정 가능
        (SELECT role FROM get_current_user_info()) = 'company_admin' OR
        ((SELECT role FROM get_current_user_info()) = 'branch_manager' AND branch_id = (SELECT branch_id FROM get_current_user_info()))
    );

-- 정책: settlement_periods (정산 기간)
CREATE POLICY "회사 관계자는 소속 회사의 정산 기간 정보를 관리할 수 있습니다." ON settlement_periods
    FOR ALL USING (company_id = (SELECT company_id FROM get_current_user_info()))
    WITH CHECK (
        -- 지점 관리자는 자기 지점의 정산 기간만 추가/수정 가능
        (SELECT role FROM get_current_user_info()) = 'company_admin' OR
        ((SELECT role FROM get_current_user_info()) = 'branch_manager' AND branch_id = (SELECT branch_id FROM get_current_user_info()))
    );

-- 정책: settlement_records (정산 기록)
CREATE POLICY "회사/지점 관리자는 권한에 따라 정산 기록을 볼 수 있습니다." ON settlement_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM settlement_periods sp
            WHERE sp.id = settlement_records.settlement_period_id
              AND sp.company_id = (SELECT company_id FROM get_current_user_info())
              AND (
                -- 회사 관리자는 모든 지점 조회 가능
                (SELECT role FROM get_current_user_info()) = 'company_admin' OR
                -- 지점 관리자는 자기 지점만 조회 가능
                sp.branch_id = (SELECT branch_id FROM get_current_user_info())
              )
        )
    );
-- NOTE: 정산 기록의 수정/삭제는 복잡한 비즈니스 로직을 따를 가능성이 높으므로,
--       RLS로는 조회만 제한하고, 수정/삭제는 Edge Function을 통해 로직을 통제하는 것을 권장합니다.


-- ==============================================
-- 9. 트리거 및 함수
-- ==============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON riders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settlement_periods_updated_at BEFORE UPDATE ON settlement_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settlement_records_updated_at BEFORE UPDATE ON settlement_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==============================================
-- 10. 함수 및 프로시저 (보안 강화)
-- ==============================================

-- 정산 기간 생성 함수
-- NOTE: SECURITY INVOKER (기본값)로 변경. 함수를 호출하는 사용자의 RLS 정책이 그대로 적용됩니다.
CREATE OR REPLACE FUNCTION create_settlement_period(
    p_branch_id UUID,
    p_platform_id UUID,
    p_period_name VARCHAR(100),
    p_start_date DATE,
    p_end_date DATE
) RETURNS UUID AS $$
DECLARE
    new_period_id UUID;
    v_company_id UUID;
BEGIN
    -- 함수를 호출한 사용자의 회사 ID를 조회
    SELECT company_id INTO v_company_id FROM branches WHERE id = p_branch_id;

    -- RLS 정책에 의해 권한이 없는 사용자는 여기서 실패함
    INSERT INTO settlement_periods (company_id, branch_id, platform_id, period_name, start_date, end_date, created_by)
    VALUES (v_company_id, p_branch_id, p_platform_id, p_period_name, p_start_date, p_end_date, auth.uid())
    RETURNING id INTO new_period_id;
    
    RETURN new_period_id;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION "create_settlement_period" IS '호출한 사용자의 권한으로 정산 기간을 생성합니다 (SECURITY INVOKER).';