'use server'

import { createServerComponentClient, createServerActionClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// 컬럼 매핑 스키마
const ColumnMappingSchema = z.object({
  column: z.string().min(1, '컬럼을 입력해주세요'),
  field: z.string().min(1, '필드를 선택해주세요')
})

// 시트 규칙 스키마
const SheetRuleSchema = z.object({
  sheetName: z.string().min(1, '시트 이름을 입력해주세요'),
  startRow: z.number().min(1, '시작 행은 1 이상이어야 합니다'),
  dataType: z.string().min(1, '데이터 종류를 선택해주세요'),
  columnMapping: z.array(ColumnMappingSchema).min(1, '최소 하나의 컬럼 매핑이 필요합니다')
})

// 파싱 규칙 스키마
const ParsingRuleSchema = z.object({
  fileNamePattern: z.string().min(1, '파일명 패턴을 입력해주세요'),
  sheets: z.array(SheetRuleSchema).min(1, '최소 하나의 시트 규칙이 필요합니다')
})

// 저장 요청 스키마
const SavePlatformSettingsSchema = z.object({
  branchId: z.string().uuid('유효하지 않은 지점 ID입니다'),
  platformId: z.string().uuid('유효하지 않은 플랫폼 ID입니다'),
  settings: ParsingRuleSchema
})

export async function savePlatformSettings(data: z.infer<typeof SavePlatformSettingsSchema>) {
  try {
    console.log('=== savePlatformSettings 시작 ===')
    console.log('입력 데이터:', JSON.stringify(data, null, 2))
    
    // 입력 검증
    const validatedData = SavePlatformSettingsSchema.parse(data)
    console.log('검증된 데이터:', JSON.stringify(validatedData, null, 2))
    
    // 권한 확인
    const profile = await getCurrentUserProfile()
    console.log('사용자 프로필:', profile)
    
    if (!profile) {
      console.log('❌ 프로필 없음')
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const allowedRoles = ['branch_manager', 'company_admin', 'super_admin']
    if (!allowedRoles.includes(profile.role || '')) {
      console.log('❌ 권한 없음, 사용자 역할:', profile.role)
      return { success: false, error: '권한이 없습니다.' }
    }

    // 지점 접근 권한 확인
    if (profile.role === 'branch_manager' && profile.branch_id !== validatedData.branchId) {
      console.log('❌ 지점 권한 없음')
      return { success: false, error: '해당 지점에 대한 권한이 없습니다.' }
    }

    console.log('🔧 Supabase 클라이언트 생성 중...')
    const supabase = await createServerActionClient()
    console.log('✅ Supabase 클라이언트 생성 완료')

    // 기존 설정이 있는지 확인
    console.log('🔍 기존 설정 확인 중...', {
      branchId: validatedData.branchId,
      platformId: validatedData.platformId
    })
    
    const { data: existingSettings, error: selectError } = await supabase
      .from('platform_settings')
      .select('id')
      .eq('branch_id', validatedData.branchId)
      .eq('platform_id', validatedData.platformId)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ 기존 설정 조회 오류:', selectError)
      return { success: false, error: '기존 설정을 확인하는 중 오류가 발생했습니다.' }
    }

    console.log('기존 설정 조회 결과:', { existingSettings, selectError })

    if (existingSettings) {
      // 업데이트
      console.log('🔄 기존 설정 업데이트 중...', existingSettings.id)
      const { error: updateError } = await supabase
        .from('platform_settings')
        .update({
          settings: validatedData.settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)

      if (updateError) {
        console.error('❌ 업데이트 오류:', updateError)
        return { success: false, error: '설정 업데이트 중 오류가 발생했습니다: ' + updateError.message }
      }
      console.log('✅ 설정 업데이트 완료')
    } else {
      // 새로 생성
      console.log('➕ 새 설정 생성 중...')
      const { error: insertError } = await supabase
        .from('platform_settings')
        .insert({
          company_id: profile.company_id,
          branch_id: validatedData.branchId,
          platform_id: validatedData.platformId,
          settings: validatedData.settings
        })

      if (insertError) {
        console.error('❌ 삽입 오류:', insertError)
        return { success: false, error: '설정 저장 중 오류가 발생했습니다: ' + insertError.message }
      }
      console.log('✅ 새 설정 생성 완료')
    }

    revalidatePath('/dashboard/settings/parser')
    console.log('🎉 설정 저장 성공!')
    return { success: true }

  } catch (error) {
    console.error('❌ Save platform settings error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      console.error('Zod 검증 오류:', firstError)
      return { success: false, error: firstError.message }
    }
    
    console.error('예상치 못한 오류:', error)
    return { success: false, error: '알 수 없는 오류가 발생했습니다: ' + (error as Error).message }
  }
}

export async function getPlatformSettings(branchId: string, platformId: string) {
  try {
    // 권한 확인
    const profile = await getCurrentUserProfile()
    if (!profile) {
      throw new Error('로그인이 필요합니다.')
    }

    const allowedRoles = ['branch_manager', 'company_admin', 'super_admin']
    if (!allowedRoles.includes(profile.role || '')) {
      throw new Error('권한이 없습니다.')
    }

    // 지점 접근 권한 확인
    if (profile.role === 'branch_manager' && profile.branch_id !== branchId) {
      throw new Error('해당 지점에 대한 권한이 없습니다.')
    }

    const supabase = await createServerActionClient()

    const { data, error } = await supabase
      .from('platform_settings')
      .select('settings')
      .eq('branch_id', branchId)
      .eq('platform_id', platformId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116은 데이터가 없음을 의미
      console.error('Get platform settings error:', error)
      throw new Error('설정을 불러오는 중 오류가 발생했습니다.')
    }

    return data?.settings || null

  } catch (error) {
    console.error('Get platform settings error:', error)
    throw error
  }
}

export async function deletePlatformSettings(branchId: string, platformId: string) {
  try {
    // 권한 확인
    const profile = await getCurrentUserProfile()
    if (!profile) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const allowedRoles = ['branch_manager', 'company_admin', 'super_admin']
    if (!allowedRoles.includes(profile.role || '')) {
      return { success: false, error: '권한이 없습니다.' }
    }

    // 지점 접근 권한 확인
    if (profile.role === 'branch_manager' && profile.branch_id !== branchId) {
      return { success: false, error: '해당 지점에 대한 권한이 없습니다.' }
    }

    const supabase = await createServerActionClient()

    const { error } = await supabase
      .from('platform_settings')
      .delete()
      .eq('branch_id', branchId)
      .eq('platform_id', platformId)

    if (error) {
      console.error('Delete platform settings error:', error)
      return { success: false, error: '설정 삭제 중 오류가 발생했습니다.' }
    }

    revalidatePath('/dashboard/settings/parser')
    return { success: true }

  } catch (error) {
    console.error('Delete platform settings error:', error)
    return { success: false, error: '알 수 없는 오류가 발생했습니다.' }
  }
}