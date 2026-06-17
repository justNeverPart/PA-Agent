import EvaluationReport from '@/components/EvaluationReport';

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;

  return (
    <main className="container">
      <h2 style={{ marginBottom: '24px' }}>面试结果</h2>
      <EvaluationReport interviewId={id} />
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <a href="/" className="btn" style={{ textDecoration: 'none' }}>
          开始新面试
        </a>
      </div>
    </main>
  );
}
