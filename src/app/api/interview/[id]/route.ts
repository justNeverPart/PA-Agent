import { NextRequest, NextResponse } from 'next/server';
import { getInterview } from '@/services/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const interview = getInterview(id);

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Failed to get interview:', error);
    return NextResponse.json(
      { error: 'Failed to get interview' },
      { status: 500 }
    );
  }
}