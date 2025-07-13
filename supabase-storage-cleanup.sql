-- 기존 Storage 정책 삭제 후 새로 생성

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "authenticated_users_can_select_settlements" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_insert_settlements" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_update_settlements" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_delete_settlements" ON storage.objects;

-- 2. 새 정책 생성 (간단한 버전)
CREATE POLICY "authenticated_users_can_select_settlements"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'settlements');

CREATE POLICY "authenticated_users_can_insert_settlements"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'settlements');

CREATE POLICY "authenticated_users_can_update_settlements"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'settlements');

CREATE POLICY "authenticated_users_can_delete_settlements"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'settlements');