import { NextRequest, NextResponse } from 'next/server';
import { getInterview } from '@/services/database';
import { getInterviewEvaluation } from '@/services/evaluator';

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

    const evaluation = getInterviewEvaluation(id);

    if (!evaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Failed to get evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to get evaluation' },
      { status: 500 }
    );
  }
}