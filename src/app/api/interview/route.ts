import { NextRequest, NextResponse } from 'next/server';
import { createInterview } from '@/services/database';
import { parseJobDescription, parseResume, formatResumeSummary } from '@/services/parser';
import { generateOpening } from '@/services/agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      jobTitle?: string;
      jobRequirements?: string;
      resumeText: string;
      interviewerStyle?: string;
    };

    if (!body.resumeText || body.resumeText.trim() === '') {
      return NextResponse.json(
        { error: 'resumeText is required' },
        { status: 400 }
      );
    }

    const jd = parseJobDescription(body.jobRequirements || body.jobTitle || '未知职位');
    const jobTitle = jd.title;
    const jobRequirements = jd.requirements;

    const resume = await parseResume(body.resumeText);
    const resumeSummary = formatResumeSummary(resume);
    const candidateName = resume.name;

    const interview = createInterview({
      jobTitle,
      jobRequirements,
      candidateName,
      resumeContent: body.resumeText,
      resumeSummary,
      interviewerStyle: body.interviewerStyle || 'professional'
    });

    const opening = await generateOpening({
      interviewId: interview.id,
      jobTitle,
      jobRequirements,
      resumeSummary,
      interviewerStyle: interview.interviewerStyle
    });

    return NextResponse.json({
      interviewId: interview.id,
      opening,
      jobTitle,
      candidateName
    });
  } catch (error) {
    console.error('Failed to start interview:', error);
    return NextResponse.json(
      { error: 'Failed to start interview' },
      { status: 500 }
    );
  }
}