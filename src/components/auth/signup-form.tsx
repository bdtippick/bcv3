'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'

interface SignUpFormProps {
  onSuccess?: () => void
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            email: formData.email
          }
        }
      })

      if (signUpError) {
        console.error('Signup error details:', signUpError)
        if (signUpError.message.includes('already_registered')) {
          setError('이미 등록된 이메일입니다.')
        } else if (signUpError.message.includes('Password')) {
          setError('비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.')
        } else if (signUpError.message.includes('email')) {
          setError('유효하지 않은 이메일 형식입니다.')
        } else {
          setError(`회원가입 오류: ${signUpError.message}`)
        }
        return
      }

      if (data.user && !data.session) {
        // 이메일 확인이 필요한 경우
        setSuccess(true)
      } else if (data.session) {
        // 즉시 로그인되는 경우
        router.push('/dashboard')
      }

    } catch (err: any) {
      console.error('Sign up error:', err)
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold">이메일을 확인해주세요</h3>
          <p className="text-sm text-muted-foreground">
            회원가입을 완료하기 위해 이메일을 확인해주세요
          </p>
        </div>
        <div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {formData.email}로 확인 이메일을 보냈습니다. 
              이메일의 링크를 클릭하여 계정을 활성화해주세요.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                onSuccess?.()
                router.push('/auth')
              }}
              className="w-full"
            >
              로그인 페이지로 이동
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">이메일 *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="이메일을 입력하세요"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호 *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="비밀번호를 입력하세요 (최소 6자)"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                가입 중...
              </>
            ) : (
              '회원가입'
            )}
          </Button>
        </form>
  )
}