import UploadForm from '@/components/UploadForm';

export default function HomePage() {
  return (
    <main className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>
        智能招聘助手
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px' }}>
        上传 JD 和简历，AI 面试官将进行多轮对话并生成评估报告
      </p>
      <UploadForm />
    </main>
  );
}
