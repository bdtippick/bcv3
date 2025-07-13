-- Supabase Storage RLS Policies for settlements bucket

-- 간단한 정책으로 시작 - 인증된 사용자만 접근 허용
-- 복잡한 권한 체크는 나중에 추가

-- SELECT 정책: 인증된 사용자 모두 접근 가능
CREATE POLICY "authenticated_users_can_select_settlements"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'settlements');

-- INSERT 정책: 인증된 사용자 모두 업로드 가능
CREATE POLICY "authenticated_users_can_insert_settlements"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'settlements');

-- UPDATE 정책: 인증된 사용자 모두 수정 가능
CREATE POLICY "authenticated_users_can_update_settlements"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'settlements');

-- DELETE 정책: 인증된 사용자 모두 삭제 가능
CREATE POLICY "authenticated_users_can_delete_settlements"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'settlements');