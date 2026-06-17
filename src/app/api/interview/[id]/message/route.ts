import { NextRequest, NextResponse } from 'next/server';
import { getInterview, getMessages } from '@/services/database';
import { processAnswer } from '@/services/agent';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json() as { content: string };
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

    const messages = getMessages(id);
    const userTurns = messages.filter(m => m.role === 'user').length;

    if (userTurns >= 15) {
      return NextResponse.json(
        { error: 'Maximum interview turns exceeded' },
        { status: 400 }
      );
    }

    const result = await processAnswer(
      {
        interviewId: id,
        jobTitle: interview.jobTitle,
        jobRequirements: interview.jobRequirements,
        resumeSummary: interview.resumeSummary,
        interviewerStyle: interview.interviewerStyle
      },
      body.content
    );

    return NextResponse.json({
      response: result.response,
      isEnd: result.isEnd
    });
  } catch (error) {
    console.error('Failed to process message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}