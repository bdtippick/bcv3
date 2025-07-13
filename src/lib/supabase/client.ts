'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClientComponentClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

// 기본 클라이언트 인스턴스 (클라이언트 컴포넌트용)
export const supabase = createClientComponentClient()

// 사용자 정보 헬퍼 함수들
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      company:companies(*),
      branch:branches(*)
    `)
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

// 인증 상태 헬퍼
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

// 로그인/로그아웃 헬퍼
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signUp(email: string, password: string, userData?: {
  name: string
  company_id: string
  branch_id?: string
  role?: string
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}