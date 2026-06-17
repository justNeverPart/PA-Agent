import ChatInterface from '@/components/ChatInterface';

interface InterviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { id } = await params;

  return (
    <main className="container">
      <h2 style={{ marginBottom: '24px' }}>面试进行中</h2>
      <ChatInterface interviewId={id} />
    </main>
  );
}
