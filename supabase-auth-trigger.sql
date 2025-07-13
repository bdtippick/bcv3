-- ==============================================
-- 사용자 가입 시 프로필 자동 생성 트리거
-- ==============================================

-- 먼저 Supabase 설정에서 이메일 확인을 비활성화하는 것을 권장합니다
-- Dashboard > Authentication > Settings > Email Confirmations을 OFF로 설정

-- 새 사용자 가입 시 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    default_company_id UUID;
BEGIN
    -- 기본 회사가 있는지 확인 (없으면 생성)
    SELECT id INTO default_company_id 
    FROM companies 
    WHERE name = '기본 회사' 
    LIMIT 1;
    
    -- 기본 회사가 없으면 생성
    IF default_company_id IS NULL THEN
        INSERT INTO companies (name, created_at, updated_at)
        VALUES ('기본 회사', NOW(), NOW())
        RETURNING id INTO default_company_id;
    END IF;
    
    -- 사용자 프로필 생성
    INSERT INTO user_profiles (
        id, 
        company_id, 
        name, 
        email, 
        role, 
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        default_company_id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'user',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성 (auth.users 테이블에 새 레코드가 INSERT될 때 실행)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ==============================================
-- 관리자 계정을 위한 회사 및 지점 생성 (옵션)
-- ==============================================

-- 기본 회사가 없으면 생성하고 기본 지점도 함께 생성
DO $$
DECLARE
    default_company_id UUID;
    default_branch_id UUID;
BEGIN
    -- 기본 회사 확인/생성
    SELECT id INTO default_company_id 
    FROM companies 
    WHERE name = '기본 회사' 
    LIMIT 1;
    
    IF default_company_id IS NULL THEN
        INSERT INTO companies (name, business_number, created_at, updated_at)
        VALUES ('기본 회사', '000-00-00000', NOW(), NOW())
        RETURNING id INTO default_company_id;
        
        -- 기본 지점도 함께 생성
        INSERT INTO branches (
            company_id, 
            name, 
            code, 
            status, 
            created_at, 
            updated_at
        )
        VALUES (
            default_company_id,
            '본점',
            'MAIN',
            'active',
            NOW(),
            NOW()
        );
    END IF;
END $$;