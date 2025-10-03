import { NextRequest, NextResponse } from 'next/server';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API is working correctly',
    timestamp: new Date().toISOString()
  });
}
