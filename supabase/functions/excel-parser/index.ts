import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as XLSX from "https://esm.sh/xlsx@0.18.5"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedData {
  sheetName: string
  dataType: string
  rows: Record<string, any>[]
}

interface ParsingRule {
  fileNamePattern: string
  sheets: {
    sheetName: string
    startRow: number
    dataType: string
    columnMapping: Record<string, string>
  }[]
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { filePath, branchId, platformName } = await req.json()

    if (!filePath || !branchId || !platformName) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 1. 파싱 규칙 가져오기
    const { data: settingsData, error: settingsError } = await supabaseClient
      .from('platform_settings')
      .select('settings')
      .eq('branch_id', branchId)
      .eq('platform_name', platformName)
      .eq('is_active', true)
      .single()

    if (settingsError || !settingsData) {
      console.error('Settings error:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Parsing rules not found for this platform' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const parsingRule: ParsingRule = settingsData.settings

    // 2. Storage에서 파일 다운로드
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('settlements')
      .download(filePath)

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError)
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 3. 엑셀 파일 파싱
    const arrayBuffer = await fileData.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    const parsedData: ParsedData[] = []

    // 각 시트 규칙에 따라 파싱
    for (const sheetRule of parsingRule.sheets) {
      const { sheetName, startRow, dataType, columnMapping } = sheetRule

      // 시트 존재 확인
      if (!workbook.SheetNames.includes(sheetName)) {
        console.warn(`Sheet '${sheetName}' not found in workbook`)
        continue
      }

      const worksheet = workbook.Sheets[sheetName]
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

      const rows: Record<string, any>[] = []

      // 시작 행부터 데이터 읽기 (Excel은 1부터 시작, 배열은 0부터 시작)
      for (let rowNum = startRow - 1; rowNum <= range.e.r; rowNum++) {
        const rowData: Record<string, any> = {}
        let hasData = false

        // 컬럼 매핑에 따라 데이터 추출
        for (const [excelColumn, fieldName] of Object.entries(columnMapping)) {
          const cellAddress = `${excelColumn}${rowNum + 1}`
          const cell = worksheet[cellAddress]
          
          if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
            rowData[fieldName] = cell.v
            hasData = true
          }
        }

        // 데이터가 있는 행만 추가
        if (hasData) {
          rows.push({
            ...rowData,
            row_number: rowNum + 1 // 원본 행 번호 기록
          })
        }
      }

      if (rows.length > 0) {
        parsedData.push({
          sheetName,
          dataType,
          rows
        })
      }
    }

    // 4. 파일명에서 메타데이터 추출
    const fileName = filePath.split('/').pop() || ''
    let extractedMetadata: Record<string, string> = {}

    try {
      const regex = new RegExp(parsingRule.fileNamePattern)
      const match = fileName.match(regex)
      if (match && match.length > 1) {
        // 첫 번째 캡처 그룹을 날짜로 가정
        extractedMetadata.date = match[1]
      }
    } catch (error) {
      console.warn('Failed to extract metadata from filename:', error)
    }

    // 5. 결과를 database에 저장
    const settlementPeriodData = {
      branch_id: branchId,
      platform_name: platformName,
      period_start: extractedMetadata.date ? 
        new Date(`20${extractedMetadata.date.slice(0,2)}-${extractedMetadata.date.slice(2,4)}-${extractedMetadata.date.slice(4,6)}`) : 
        new Date(),
      period_end: extractedMetadata.date ? 
        new Date(`20${extractedMetadata.date.slice(0,2)}-${extractedMetadata.date.slice(2,4)}-${extractedMetadata.date.slice(4,6)}`) : 
        new Date(),
      file_path: filePath,
      status: 'processing'
    }

    const { data: periodData, error: periodError } = await supabaseClient
      .from('settlement_periods')
      .insert(settlementPeriodData)
      .select()
      .single()

    if (periodError) {
      console.error('Period insert error:', periodError)
      return new Response(
        JSON.stringify({ error: 'Failed to create settlement period' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 6. 파싱된 데이터를 settlement_records에 저장
    const recordsToInsert = []
    
    for (const sheetData of parsedData) {
      for (const row of sheetData.rows) {
        // 라이더 찾기 (rider_code, rider_id, rider_name 순으로 시도)
        let riderId = null
        
        if (row.rider_code) {
          const { data: riderData } = await supabaseClient
            .from('riders')
            .select('id')
            .eq('rider_id', row.rider_code)
            .eq('branch_id', branchId)
            .single()
          riderId = riderData?.id
        }
        
        if (!riderId && row.rider_id) {
          const { data: riderData } = await supabaseClient
            .from('riders')
            .select('id')
            .eq('rider_id', row.rider_id)
            .eq('branch_id', branchId)
            .single()
          riderId = riderData?.id
        }
        
        if (!riderId && row.rider_name) {
          const { data: riderData } = await supabaseClient
            .from('riders')
            .select('id')
            .eq('name', row.rider_name)
            .eq('branch_id', branchId)
            .single()
          riderId = riderData?.id
        }

        // 배민커넥트비즈 정산 계산 로직
        let calculatedData = { ...row }
        
        if (sheetData.dataType === 'settlement') {
          // 숫자 필드들을 안전하게 파싱
          const deliveryFee = parseFloat(row.delivery_fee) || 0
          const additionalPayment = parseFloat(row.additional_payment) || 0
          const branchPromotion = parseFloat(row.branch_promotion) || 0
          const commission = parseFloat(row.commission) || 0
          const hourlyInsurance = parseFloat(row.hourly_insurance) || 0
          const employmentInsurance = parseFloat(row.employment_insurance) || 0
          const accidentInsurance = parseFloat(row.accident_insurance) || 0
          const employmentRetroactive = parseFloat(row.employment_retroactive) || 0
          const accidentRetroactive = parseFloat(row.accident_retroactive) || 0
          const rebate = parseFloat(row.rebate) || 0

          // 총 배달료 = 배달료 + 추가할증 + 지점프로모션 - 수수료
          const totalDeliveryFee = deliveryFee + additionalPayment + branchPromotion - commission
          
          // 총 공제 항목들
          const totalDeductions = hourlyInsurance + employmentInsurance + accidentInsurance + 
                                 employmentRetroactive + accidentRetroactive
          
          // 라이더 정산금액 = 총 배달료 - 공제성 항목들
          const settlementAmount = totalDeliveryFee - totalDeductions
          
          // 원천징수세액 = 총 배달료 × 3.3%
          const withholdingTax = totalDeliveryFee * 0.033
          
          // 최종 지급액 = 라이더 정산금액 - 원천징수세액 - 리스비
          const finalPayment = settlementAmount - withholdingTax - rebate

          // 계산된 값들을 추가
          calculatedData = {
            ...calculatedData,
            total_delivery_fee: totalDeliveryFee,
            total_deductions: totalDeductions,
            settlement_amount: settlementAmount,
            withholding_tax: withholdingTax,
            final_payment: finalPayment
          }
        }

        // 최종 금액 설정 (정산 데이터의 경우 최종 지급액, 그 외엔 기존 로직)
        let totalAmount = 0
        if (sheetData.dataType === 'settlement') {
          totalAmount = calculatedData.final_payment || 0
        } else {
          const amountFields = ['delivery_fee', 'employment_insurance', 'accident_insurance', 'branch_promotion', 'platform_promotion', 'amount']
          for (const field of amountFields) {
            if (row[field] && typeof row[field] === 'number') {
              totalAmount += row[field]
            }
          }
        }

        recordsToInsert.push({
          settlement_period_id: periodData.id,
          rider_id: riderId,
          sheet_name: sheetData.sheetName,
          data_type: sheetData.dataType,
          raw_data: calculatedData, // 계산된 데이터 저장
          amount: totalAmount,
          rider_identifier: row.rider_code || row.rider_id || row.rider_name || 'unknown'
        })
      }
    }

    if (recordsToInsert.length > 0) {
      const { error: recordsError } = await supabaseClient
        .from('settlement_records')
        .insert(recordsToInsert)

      if (recordsError) {
        console.error('Records insert error:', recordsError)
        // settlement_period 상태를 error로 업데이트
        await supabaseClient
          .from('settlement_periods')
          .update({ status: 'error' })
          .eq('id', periodData.id)
      } else {
        // settlement_period 상태를 completed로 업데이트
        await supabaseClient
          .from('settlement_periods')
          .update({ 
            status: 'completed',
            records_count: recordsToInsert.length
          })
          .eq('id', periodData.id)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        settlement_period_id: periodData.id,
        records_processed: recordsToInsert.length,
        sheets_processed: parsedData.length,
        parsed_data: parsedData.map(sheet => ({
          sheetName: sheet.sheetName,
          dataType: sheet.dataType,
          rowCount: sheet.rows.length
        }))
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Excel parser error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})