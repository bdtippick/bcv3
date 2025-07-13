import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { filePath, branchId, platformName } = await request.json()

    if (!filePath || !branchId || !platformName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Supabase Edge Function 호출
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase.functions.invoke('excel-parser', {
      body: {
        filePath,
        branchId,
        platformName
      }
    })

    if (error) {
      console.error('Edge function error:', error)
      return NextResponse.json(
        { error: 'Failed to parse Excel file', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}