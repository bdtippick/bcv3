'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile, createServerComponentClient } from '@/lib/supabase/server'

// 지점 추가 폼 스키마
const createBranchSchema = z.object({
  name: z.string().min(1, '지점명을 입력해주세요').max(255, '지점명은 255자 이하여야 합니다'),
  code: z.string().min(1, '지점 코드를 입력해주세요').max(50, '지점 코드는 50자 이하여야 합니다').regex(/^[A-Z0-9_]+$/, '지점 코드는 영문 대문자, 숫자, 언더스코어만 사용 가능합니다'),
  address: z.string().optional(),
  phone: z.string().optional(),
  manager_name: z.string().optional()
})

export type CreateBranchFormData = z.infer<typeof createBranchSchema>

export async function createBranch(data: CreateBranchFormData) {
  try {
    // 현재 사용자 프로필 확인
    const profile = await getCurrentUserProfile()
    
    if (!profile) {
      throw new Error('사용자 프로필을 찾을 수 없습니다')
    }

    // company_admin 권한 확인
    if (profile.role !== 'company_admin' && profile.role !== 'super_admin') {
      throw new Error('지점을 추가할 권한이 없습니다')
    }

    if (!profile.company_id) {
      throw new Error('소속 회사 정보를 찾을 수 없습니다')
    }

    // 데이터 유효성 검사
    const validatedData = createBranchSchema.parse(data)

    // Supabase 클라이언트 생성
    const supabase = await createServerComponentClient()

    // 지점 코드 중복 확인
    const { data: existingBranch } = await supabase
      .from('branches')
      .select('id')
      .eq('code', validatedData.code)
      .single()

    if (existingBranch) {
      throw new Error('이미 존재하는 지점 코드입니다')
    }

    // 지점 생성
    const { data: newBranch, error } = await supabase
      .from('branches')
      .insert({
        company_id: profile.company_id,
        name: validatedData.name,
        code: validatedData.code,
        address: validatedData.address || null,
        phone: validatedData.phone || null,
        manager_name: validatedData.manager_name || null,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating branch:', error)
      throw new Error('지점 생성 중 오류가 발생했습니다')
    }

    // 페이지 재검증
    revalidatePath('/dashboard/branches')

    return {
      success: true,
      data: newBranch,
      message: '지점이 성공적으로 추가되었습니다'
    }

  } catch (error: any) {
    console.error('Create branch error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }

    return {
      success: false,
      error: error.message || '지점 추가 중 오류가 발생했습니다'
    }
  }
}