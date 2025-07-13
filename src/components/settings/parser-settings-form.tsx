'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, Save, Loader2 } from 'lucide-react'
import { UserProfile } from '@/lib/supabase/types'
import { savePlatformSettings, getPlatformSettings } from '@/app/dashboard/settings/parser/actions'

interface ColumnMapping {
  column: string
  field: string
}

interface SheetRule {
  sheetName: string
  startRow: number
  dataType: string
  columnMapping: ColumnMapping[]
}

interface ParsingRule {
  fileNamePattern: string
  sheets: SheetRule[]
}

interface ParserSettingsFormProps {
  userProfile: UserProfile
}

const PLATFORM_OPTIONS = [
  { value: '배민커넥트비즈', label: '배민커넥트비즈' },
  { value: '쿠팡이츠플러스', label: '쿠팡이츠플러스' },
  { value: '요기요플러스', label: '요기요플러스' },
  { value: '배달의민족', label: '배달의민족' },
  { value: '기타', label: '기타' }
]

const DATA_TYPE_OPTIONS = [
  { value: 'settlement', label: '정산 데이터' },
  { value: 'fee', label: '배달료' },
  { value: 'deduction', label: '공제' },
  { value: 'insurance', label: '보험료' },
  { value: 'promotion', label: '프로모션' },
  { value: 'bonus', label: '보너스' },
  { value: 'penalty', label: '패널티' }
]

const COMMON_FIELDS = [
  // 기본 정보
  { value: 'rider_id', label: '라이더 ID' },
  { value: 'rider_name', label: '라이더명' },
  { value: 'process_count', label: '처리건수' },
  
  // 배달료 정보
  { value: 'delivery_fee', label: '배달료' },
  { value: 'additional_payment', label: '추가할증' },
  { value: 'branch_promotion', label: '지점프로모션' },
  
  // 보험 및 공제 항목
  { value: 'hourly_insurance', label: '시급보험' },
  { value: 'employment_insurance', label: '고용보험' },
  { value: 'accident_insurance', label: '산재보험' },
  { value: 'employment_retroactive', label: '고용보험 소급' },
  { value: 'accident_retroactive', label: '산재보험 소급' },
  
  // 사용자 입력 항목
  { value: 'commission', label: '수수료' },
  { value: 'rebate', label: '리스비' },
  
  // 계산 항목
  { value: 'total_delivery_fee', label: '총 배달료' },
  { value: 'settlement_amount', label: '정산금액' },
  { value: 'withholding_tax', label: '원천징수세액' },
  { value: 'final_payment', label: '최종 지급액' },
  
  // 기타
  { value: 'amount', label: '금액(기타)' }
]

export function ParserSettingsForm({ userProfile }: ParserSettingsFormProps) {
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [parsingRule, setParsingRule] = useState<ParsingRule>({
    fileNamePattern: '',
    sheets: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 플랫폼 변경 시 기존 설정 로드
  useEffect(() => {
    if (selectedPlatform && userProfile.branch_id) {
      loadPlatformSettings()
    }
  }, [selectedPlatform, userProfile.branch_id])

  const loadPlatformSettings = async () => {
    if (!selectedPlatform || !userProfile.branch_id) return
    
    setIsLoading(true)
    try {
      const settings = await getPlatformSettings(userProfile.branch_id, selectedPlatform)
      if (settings) {
        setParsingRule(settings)
      } else {
        // 기본값으로 리셋
        setParsingRule({
          fileNamePattern: '',
          sheets: []
        })
      }
    } catch (error) {
      console.error('Failed to load platform settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addSheetRule = () => {
    setParsingRule(prev => ({
      ...prev,
      sheets: [...prev.sheets, {
        sheetName: '',
        startRow: 1,
        dataType: 'fee',
        columnMapping: [{ column: 'B', field: 'rider_name' }] // 기본 매핑 추가
      }]
    }))
  }

  // 빠른 설정 템플릿
  const applyQuickTemplate = (templateName: string) => {
    const templates = {
      '배민커넥트비즈': {
        fileNamePattern: '(\\d{8})~(\\d{8})_(.+)_(.+)_(.+)\\.xlsx',
        sheets: [
          {
            sheetName: '을지_협력사 소속 라이더 정산 확인용',
            startRow: 20,
            dataType: 'settlement',
            columnMapping: [
              { column: 'B', field: 'rider_id' },
              { column: 'C', field: 'rider_name' },
              { column: 'D', field: 'process_count' },
              { column: 'E', field: 'delivery_fee' },
              { column: 'F', field: 'additional_payment' },
              { column: 'H', field: 'hourly_insurance' },
              { column: 'L', field: 'employment_insurance' },
              { column: 'N', field: 'accident_insurance' },
              { column: 'Q', field: 'employment_retroactive' },
              { column: 'T', field: 'accident_retroactive' }
            ]
          }
        ]
      },
      '쿠팡이츠플러스': {
        fileNamePattern: 'COUPANG_(\\d{6}).xlsx',
        sheets: [
          {
            sheetName: '배달료',
            startRow: 3,
            dataType: 'fee',
            columnMapping: [
              { column: 'A', field: 'rider_code' },
              { column: 'B', field: 'rider_name' },
              { column: 'D', field: 'delivery_fee' }
            ]
          }
        ]
      }
    }

    const template = templates[templateName as keyof typeof templates]
    if (template) {
      setParsingRule(template)
    }
  }

  const removeSheetRule = (index: number) => {
    setParsingRule(prev => ({
      ...prev,
      sheets: prev.sheets.filter((_, i) => i !== index)
    }))
  }

  const updateSheetRule = (index: number, field: keyof SheetRule, value: any) => {
    setParsingRule(prev => ({
      ...prev,
      sheets: prev.sheets.map((sheet, i) => 
        i === index ? { ...sheet, [field]: value } : sheet
      )
    }))
  }

  const addColumnMapping = (sheetIndex: number) => {
    setParsingRule(prev => ({
      ...prev,
      sheets: prev.sheets.map((sheet, i) => 
        i === sheetIndex 
          ? { ...sheet, columnMapping: [...sheet.columnMapping, { column: '', field: '' }] }
          : sheet
      )
    }))
  }

  const removeColumnMapping = (sheetIndex: number, mappingIndex: number) => {
    setParsingRule(prev => ({
      ...prev,
      sheets: prev.sheets.map((sheet, i) => 
        i === sheetIndex 
          ? { ...sheet, columnMapping: sheet.columnMapping.filter((_, j) => j !== mappingIndex) }
          : sheet
      )
    }))
  }

  const updateColumnMapping = (sheetIndex: number, mappingIndex: number, field: keyof ColumnMapping, value: string) => {
    setParsingRule(prev => ({
      ...prev,
      sheets: prev.sheets.map((sheet, i) => 
        i === sheetIndex 
          ? { 
              ...sheet, 
              columnMapping: sheet.columnMapping.map((mapping, j) => 
                j === mappingIndex ? { ...mapping, [field]: value } : mapping
              )
            }
          : sheet
      )
    }))
  }

  const handleSave = async () => {
    if (!selectedPlatform) {
      alert('플랫폼을 선택해주세요.')
      return
    }

    if (!userProfile.branch_id) {
      alert('지점 정보가 없습니다.')
      return
    }

    if (!parsingRule.fileNamePattern.trim()) {
      alert('파일명 패턴을 입력해주세요.')
      return
    }

    if (parsingRule.sheets.length === 0) {
      alert('최소 하나의 시트 규칙을 추가해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const result = await savePlatformSettings({
        branchId: userProfile.branch_id,
        platformName: selectedPlatform,
        settings: parsingRule
      })

      if (result.success) {
        alert('파싱 규칙이 성공적으로 저장되었습니다.')
      } else {
        alert(result.error || '저장 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 플랫폼 선택 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform" className="text-base font-medium">1️⃣ 배달 플랫폼 선택</Label>
              <p className="text-sm text-gray-600 mt-1">어떤 플랫폼의 엑셀 파일을 처리할지 선택하세요</p>
            </div>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="플랫폼을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedPlatform && (
        <>
          {/* 빠른 설정 템플릿 */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">2️⃣ 빠른 설정 (추천)</Label>
                  <p className="text-sm text-gray-600 mt-1">미리 준비된 템플릿을 사용하여 빠르게 설정하세요</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => applyQuickTemplate(selectedPlatform)}
                    className="bg-white"
                  >
                    🚀 {selectedPlatform} 기본 템플릿 적용
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? '🔼 고급 설정 숨기기' : '🔽 고급 설정 보기'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 고급 설정 (접을 수 있음) */}
          {showAdvanced && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3️⃣ 고급 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 파일명 패턴 */}
                <div className="space-y-2">
                  <Label htmlFor="fileNamePattern">파일명 패턴 (정규식)</Label>
                  <Input
                    id="fileNamePattern"
                    value={parsingRule.fileNamePattern}
                    onChange={(e) => setParsingRule(prev => ({ ...prev, fileNamePattern: e.target.value }))}
                    placeholder="예: EULJI001_(\\d{6}).xlsx"
                    disabled={isLoading}
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">
                    파일명에서 날짜 등을 추출하는 패턴입니다. 기본 템플릿으로도 충분합니다.
                  </p>
                </div>

                {/* 시트 규칙들 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">시트 규칙</Label>
                    <Button type="button" onClick={addSheetRule} disabled={isLoading} variant="outline" className="bg-white">
                      <Plus className="h-4 w-4 mr-2" />
                      시트 규칙 추가
                    </Button>
                  </div>

                  {parsingRule.sheets.map((sheet, sheetIndex) => (
                    <Card key={sheetIndex} className="bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">📊 시트 #{sheetIndex + 1}: {sheet.sheetName || '새 시트'}</CardTitle>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSheetRule(sheetIndex)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                <CardContent className="space-y-4">
                  {/* 시트 기본 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>시트 이름</Label>
                      <Input
                        value={sheet.sheetName}
                        onChange={(e) => updateSheetRule(sheetIndex, 'sheetName', e.target.value)}
                        placeholder="예: 기본 배달료"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>시작 행</Label>
                      <Input
                        type="number"
                        min="1"
                        value={sheet.startRow}
                        onChange={(e) => updateSheetRule(sheetIndex, 'startRow', parseInt(e.target.value) || 1)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>데이터 종류</Label>
                      <Select 
                        value={sheet.dataType} 
                        onValueChange={(value) => updateSheetRule(sheetIndex, 'dataType', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATA_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 컬럼 매핑 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">컬럼 매핑</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addColumnMapping(sheetIndex)}
                        disabled={isLoading}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        매핑 추가
                      </Button>
                    </div>

                    {sheet.columnMapping.map((mapping, mappingIndex) => (
                      <div key={mappingIndex} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            value={mapping.column}
                            onChange={(e) => updateColumnMapping(sheetIndex, mappingIndex, 'column', e.target.value.toUpperCase())}
                            placeholder="열 (A, B, C...)"
                            maxLength={3}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="text-center">→</div>
                        <div className="flex-2">
                          <Select
                            value={mapping.field}
                            onValueChange={(value) => updateColumnMapping(sheetIndex, mappingIndex, 'field', value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="필드 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_FIELDS.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeColumnMapping(sheetIndex, mappingIndex)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 저장 버튼 - 항상 보이도록 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">4️⃣ 설정 저장</h3>
                  <p className="text-sm text-gray-600">설정을 저장하면 엑셀 파일 업로드 시 자동으로 적용됩니다</p>
                </div>
                <Button onClick={handleSave} disabled={isLoading || isSaving || !parsingRule.fileNamePattern} size="lg">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      💾 파싱 규칙 저장
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}