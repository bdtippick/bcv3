'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Building2 } from 'lucide-react'
import { SignUpForm } from '@/components/auth/signup-form'

export default function AuthPage() {
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'forgot_password'>('sign_in')
  const [redirectTo, setRedirectTo] = useState('')
  const router = useRouter()

  useEffect(() => {
    // 클라이언트 사이드에서만 window 객체 사용
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect')
      const callbackUrl = `${window.location.origin}/auth/callback`
      
      if (redirect) {
        setRedirectTo(`${callbackUrl}?next=${encodeURIComponent(redirect)}`)
      } else {
        setRedirectTo(callbackUrl)
      }
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // URL 파라미터에서 redirect 경로 확인
        const params = new URLSearchParams(window.location.search)
        const redirectPath = params.get('redirect') || '/dashboard'
        router.push(redirectPath)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 min-h-[calc(100vh-3.5rem)]">
      <div className="w-full max-w-md space-y-6">
        {/* 로고 및 제목 */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            배달 라이더 정산 시스템
          </h1>
          <p className="text-slate-600">
            계정에 로그인하여 시스템을 사용하세요
          </p>
        </div>

        {/* 인증 카드 */}
        <Card>
          <CardHeader className="space-y-1">
            <Tabs value={view} onValueChange={(value) => setView(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign_in">로그인</TabsTrigger>
                <TabsTrigger value="sign_up">회원가입</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sign_in" className="space-y-4 mt-4">
                <div className="space-y-2 text-center">
                  <CardTitle>로그인</CardTitle>
                  <CardDescription>
                    이메일과 비밀번호로 로그인하세요
                  </CardDescription>
                </div>
              </TabsContent>
              
              <TabsContent value="sign_up" className="space-y-4 mt-4">
                {/* 회원가입 탭에서는 타이틀을 제거 (커스텀 폼에 포함됨) */}
              </TabsContent>
            </Tabs>
          </CardHeader>
          
          <CardContent>
            {!redirectTo ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : view === 'sign_up' ? (
              <div className="mt-4">
                <SignUpForm onSuccess={() => setView('sign_in')} />
              </div>
            ) : view === 'forgot_password' ? (
              <div className="space-y-4">
                <div className="space-y-2 text-center">
                  <CardTitle>비밀번호 재설정</CardTitle>
                  <CardDescription>
                    등록된 이메일로 재설정 링크를 보내드립니다
                  </CardDescription>
                </div>
                <Auth
                  supabaseClient={supabase}
                  view="forgotten_password"
                  appearance={{
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: '#3b82f6',
                          brandAccent: '#2563eb',
                        },
                      },
                    },
                    className: {
                      container: 'space-y-4',
                      button: 'w-full',
                      input: 'w-full',
                    },
                  }}
                  localization={{
                    variables: {
                      forgotten_password: {
                        email_label: '이메일',
                        password_label: '비밀번호',
                        email_input_placeholder: '이메일을 입력하세요',
                        button_label: '재설정 링크 보내기',
                        loading_button_label: '전송 중...',
                        link_text: '비밀번호를 잊으셨나요?',
                        confirmation_text: '재설정 링크를 확인하세요',
                      },
                    },
                  }}
                  redirectTo={redirectTo}
                />
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView('sign_in')}
                  >
                    로그인으로 돌아가기
                  </Button>
                </div>
              </div>
            ) : (
              <Auth
                supabaseClient={supabase}
                view={view === 'sign_up' ? 'sign_up' : 'sign_in'}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#3b82f6',
                        brandAccent: '#2563eb',
                      },
                    },
                  },
                  className: {
                    container: 'space-y-4',
                    button: 'w-full',
                    input: 'w-full',
                  },
                }}
                localization={{
                  variables: {
                    sign_in: {
                      email_label: '이메일',
                      password_label: '비밀번호',
                      email_input_placeholder: '이메일을 입력하세요',
                      password_input_placeholder: '비밀번호를 입력하세요',
                      button_label: '로그인',
                      loading_button_label: '로그인 중...',
                      social_provider_text: '{{provider}}로 로그인',
                      link_text: '이미 계정이 있으신가요? 로그인',
                    },
                    sign_up: {
                      email_label: '이메일',
                      password_label: '비밀번호',
                      email_input_placeholder: '이메일을 입력하세요',
                      password_input_placeholder: '비밀번호를 입력하세요',
                      button_label: '회원가입',
                      loading_button_label: '가입 중...',
                      social_provider_text: '{{provider}}로 가입',
                      link_text: '계정이 없으신가요? 회원가입',
                      confirmation_text: '이메일을 확인해주세요',
                    },
                  },
                }}
                redirectTo={redirectTo}
              />
            )}
            
            {redirectTo && view !== 'forgot_password' && (
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setView('forgot_password')}
                  className="text-sm text-slate-600 hover:text-slate-800"
                >
                  비밀번호를 잊으셨나요?
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 도움말 */}
        <div className="text-center text-sm text-slate-600">
          <p>
            계정 관련 문의사항이 있으시면{' '}
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
              고객지원
            </a>
            으로 연락해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}