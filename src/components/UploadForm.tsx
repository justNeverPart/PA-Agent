'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadForm() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [interviewerStyle, setInterviewerStyle] = useState<'strict' | 'friendly' | 'professional'>('professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    // Dynamically import PDF.js to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');

    // Point to local worker file
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPdf(file);
        setResumeText(text);
        setPdfPreview(file.name);
      } else {
        setError('请上传 PDF 格式的文件');
      }
    } catch (err) {
      setError('PDF 解析失败，请尝试粘贴文本');
      console.error('PDF parse error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!resumeText.trim()) {
      setError('简历内容不能为空');
      setLoading(false);
      return;
    }

    if (!jobTitle.trim()) {
      setError('职位名称不能为空');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          jobRequirements,
          resumeText,
          interviewerStyle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start interview');
      }

      const data = await response.json() as { interviewId: string };
      router.push(`/interview/${data.interviewId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>创建新面试</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">职位名称</label>
          <input
            type="text"
            className="input"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            placeholder="例如：新媒体运营"
            required
          />
        </div>

        <div className="form-group">
          <label className="label">职位要求（可选）</label>
          <textarea
            className="input textarea"
            value={jobRequirements}
            onChange={e => setJobRequirements(e.target.value)}
            placeholder="请输入职位的详细要求..."
          />
        </div>

        <div className="form-group">
          <label className="label">上传简历（PDF）</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="input"
            style={{ padding: '8px' }}
          />
          {pdfPreview && (
            <div style={{ marginTop: '8px', color: '#4caf50', fontSize: '14px' }}>
              已上传: {pdfPreview}
            </div>
          )}
          {loading && <div style={{ marginTop: '8px', color: '#666' }}>正在解析 PDF...</div>}
        </div>

        <div className="form-group">
          <label className="label">或直接粘贴简历内容</label>
          <textarea
            className="input textarea"
            value={resumeText}
            onChange={e => {
              setResumeText(e.target.value);
              setPdfPreview(null);
            }}
            placeholder="请粘贴简历内容..."
            required={!pdfPreview}
          />
        </div>

        <div className="form-group">
          <label className="label">面试官风格</label>
          <select
            className="input"
            value={interviewerStyle}
            onChange={e => setInterviewerStyle(e.target.value as typeof interviewerStyle)}
          >
            <option value="professional">专业中立</option>
            <option value="friendly">亲切友好</option>
            <option value="strict">严厉技术导向</option>
          </select>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn" disabled={loading || (!resumeText.trim() && !pdfPreview)}>
          {loading ? '创建中...' : '开始面试'}
        </button>
      </form>
    </div>
  );
}
