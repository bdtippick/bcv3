'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, File, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/providers/auth-provider'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export function SettlementFileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { profile } = useAuth()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 형식 확인
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ]

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.')
      setUploadStatus('error')
      return
    }

    // 파일 크기 확인 (10MB 제한)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setErrorMessage('파일 크기는 10MB를 초과할 수 없습니다.')
      setUploadStatus('error')
      return
    }

    setSelectedFile(file)
    setUploadStatus('idle')
    setErrorMessage('')
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('파일을 선택해주세요.')
      setUploadStatus('error')
      return
    }

    // 지점 ID 확인 - company_admin의 경우 첫 번째 지점 사용, branch_manager는 자신의 지점 사용
    let branchId = profile?.branch_id
    
    if (!branchId && (profile?.role === 'company_admin' || profile?.role === 'super_admin')) {
      // company_admin이나 super_admin인 경우 회사의 첫 번째 지점 사용
      try {
        const { data: branches } = await supabase
          .from('branches')
          .select('id')
          .eq('company_id', profile.company_id)
          .limit(1)
        
        if (branches && branches.length > 0) {
          branchId = branches[0].id
        }
      } catch (error) {
        console.error('Error fetching branch:', error)
      }
    }

    if (!branchId) {
      setErrorMessage('지점 정보를 찾을 수 없습니다. 관리자에게 문의하세요.')
      setUploadStatus('error')
      return
    }

    setUploadStatus('uploading')
    setUploadProgress(0)

    try {
      // 파일명 생성 (타임스탬프 포함)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileExtension = selectedFile.name.split('.').pop()
      const fileName = `settlement_${timestamp}.${fileExtension}`
      
      // Supabase Storage 경로
      const filePath = `settlements/${branchId}/${fileName}`

      // 파일 업로드
      const { data, error } = await supabase.storage
        .from('settlements') // 버킷 이름
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        throw new Error(error.message || '파일 업로드 중 오류가 발생했습니다.')
      }

      setUploadStatus('success')
      setUploadProgress(100)
      
      // 업로드 성공 후 파일 정보 초기화
      setTimeout(() => {
        setSelectedFile(null)
        setUploadStatus('idle')
        setUploadProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 3000)

    } catch (error: any) {
      console.error('Upload failed:', error)
      setErrorMessage(error.message || '파일 업로드 중 오류가 발생했습니다.')
      setUploadStatus('error')
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setUploadStatus('idle')
    setUploadProgress(0)
    setErrorMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* 파일 선택 영역 */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            클릭하여 파일을 선택하거나 여기에 드래그하세요
          </p>
          <p className="text-xs text-gray-500">
            Excel 파일만 지원 (.xlsx, .xls) - 최대 10MB
          </p>
        </label>
      </div>

      {/* 선택된 파일 정보 */}
      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <File className="h-8 w-8 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {uploadStatus === 'idle' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                제거
              </Button>
            )}
          </div>

          {/* 업로드 진행률 */}
          {uploadStatus === 'uploading' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>업로드 중...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 상태 메시지 */}
      {uploadStatus === 'success' && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">파일이 성공적으로 업로드되었습니다!</span>
        </div>
      )}

      {uploadStatus === 'error' && errorMessage && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* 업로드 버튼 */}
      <Button 
        onClick={handleUpload}
        disabled={!selectedFile || uploadStatus === 'uploading'}
        className="w-full"
      >
        {uploadStatus === 'uploading' ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            업로드 중...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            정산 파일 업로드
          </>
        )}
      </Button>

      {/* 도움말 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 업로드된 파일은 settlements/ 경로에 지점별로 저장됩니다</p>
        <p>• 파일명에는 업로드 시간이 자동으로 포함됩니다</p>
        <p>• 업로드 후 자동으로 파일 데이터가 처리됩니다</p>
      </div>
    </div>
  )
}