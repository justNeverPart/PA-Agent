export interface JobDescription {
  title: string;
  requirements: string;
  responsibilities: string;
  niceToHave?: string;
}

export interface Resume {
  name: string;
  education?: string;
  workExperience: WorkExperience[];
  projects?: Project[];
  skills: string[];
}

export interface WorkExperience {
  company: string;
  position: string;
  duration: string;
  description: string;
}

export interface Project {
  name: string;
  role: string;
  description: string;
}

export interface Interview {
  id: string;
  jobTitle: string;
  jobRequirements: string;
  candidateName: string;
  resumeContent: string;
  resumeSummary: string;
  interviewerStyle: 'strict' | 'friendly' | 'professional';
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  interviewId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface EvaluationReport {
  id: string;
  interviewId: string;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  experienceScore: number;
  potentialScore: number;
  strengths: string;
  risks: string;
  suggestions: string;
  questionReview: string;
  createdAt: string;
}

export interface AgentResponse {
  type: 'question' | 'followup' | 'ending';
  content: string;
  reasoning: string;
}

export interface StartInterviewRequest {
  jobTitle: string;
  jobRequirements: string;
  resumeText: string;
  interviewerStyle?: 'strict' | 'friendly' | 'professional';
}

export interface SendMessageRequest {
  content: string;
}