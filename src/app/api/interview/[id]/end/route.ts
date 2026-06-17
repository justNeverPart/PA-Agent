import { NextRequest, NextResponse } from 'next/server';
import { getInterview } from '@/services/database';
import { createEvaluationReport } from '@/services/evaluator';

export async function POST(
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

    if (interview.status === 'completed') {
      return NextResponse.json(
        { error: 'Interview already completed' },
        { status: 400 }
      );
    }

    const report = await createEvaluationReport({
      interviewId: id,
      jobTitle: interview.jobTitle,
      candidateName: interview.candidateName,
      resumeSummary: interview.resumeContent
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to end interview:', error);
    return NextResponse.json(
      { error: 'Failed to end interview' },
      { status: 500 }
    );
  }
}