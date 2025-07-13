import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

// 서버 컴포넌트용 Supabase 클라이언트
export async function createServerComponentClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Route Handler용 Supabase 클라이언트
export async function createRouteHandlerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// 서비스 롤 키를 사용한 관리자 클라이언트 (서버 사이드 전용)
export function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service role client')
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for service role client
        },
      },
    }
  )
}

// 서버에서 현재 사용자 정보 가져오기
export async function getCurrentUser() {
  const supabase = await createServerComponentClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return user
}

// 서버에서 현재 사용자 프로필 가져오기
export async function getCurrentUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createServerComponentClient()
  
  // 먼저 기본 프로필만 가져오기
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error getting user profile:', {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code,
      userId: user.id
    })
    return null
  }

  if (!profile) return null

  // 회사 정보 별도로 가져오기
  let company = null
  if (profile.company_id) {
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()
    
    if (!companyError) {
      company = companyData
    }
  }

  // 지점 정보 별도로 가져오기
  let branch = null
  if (profile.branch_id) {
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .eq('id', profile.branch_id)
      .single()
    
    if (!branchError) {
      branch = branchData
    }
  }

  return {
    ...profile,
    company,
    branch
  }
}

// 사용자 권한 확인 헬퍼 함수들
export async function hasCompanyAccess(companyId: string) {
  const profile = await getCurrentUserProfile()
  if (!profile) return false
  
  return profile.company_id === companyId || profile.role === 'super_admin'
}

export async function hasBranchAccess(branchId: string) {
  const profile = await getCurrentUserProfile()
  if (!profile) return false
  
  // Super admin과 company admin은 모든 지점 접근 가능
  if (profile.role === 'super_admin' || profile.role === 'company_admin') {
    return true
  }
  
  // Branch manager는 자신의 지점만 접근 가능
  if (profile.role === 'branch_manager') {
    return profile.branch_id === branchId
  }
  
  return false
}

export async function isCompanyAdmin() {
  const profile = await getCurrentUserProfile()
  return profile?.role === 'company_admin' || profile?.role === 'super_admin'
}

export async function isBranchManager() {
  const profile = await getCurrentUserProfile()
  return profile?.role === 'branch_manager' || 
         profile?.role === 'company_admin' || 
         profile?.role === 'super_admin'
}

// 회사 관리자가 소속 회사의 모든 지점 조회
export async function getCompanyBranches() {
  const profile = await getCurrentUserProfile()
  if (!profile || !profile.company_id) return []

  // company_admin만 접근 가능
  if (profile.role !== 'company_admin' && profile.role !== 'super_admin') {
    return []
  }

  const supabase = await createServerComponentClient()
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting company branches:', error)
    return []
  }

  return data || []
}

// 지점 관리자가 자신의 지점 라이더 조회
export async function getBranchRiders() {
  const profile = await getCurrentUserProfile()
  if (!profile || !profile.company_id) return []

  // branch_manager, company_admin, super_admin만 접근 가능
  const allowedRoles = ['branch_manager', 'company_admin', 'super_admin']
  if (!allowedRoles.includes(profile.role || '')) {
    return []
  }

  const supabase = await createServerComponentClient()
  
  let query = supabase
    .from('riders')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  // branch_manager는 자신의 지점만, company_admin과 super_admin은 모든 지점
  if (profile.role === 'branch_manager' && profile.branch_id) {
    query = query.eq('branch_id', profile.branch_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error getting branch riders:', error)
    return []
  }

  return data || []
}