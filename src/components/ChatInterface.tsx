'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  interviewId: string;
}

export default function ChatInterface({ interviewId }: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch(`/api/interview/${interviewId}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data.messages || []))
      .catch(console.error);
  }, [interviewId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`/api/interview/${interviewId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage })
      });

      const data = await response.json() as { response: string; isEnd: boolean };

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString()
      }]);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        createdAt: new Date().toISOString()
      }]);

      if (data.isEnd) {
        setIsEnded(true);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    setLoading(true);
    try {
      await fetch(`/api/interview/${interviewId}/end`, { method: 'POST' });
      router.push(`/result/${interviewId}`);
    } catch (err) {
      console.error('Failed to end interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '12px'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: msg.role === 'user' ? '#0070f3' : '#e5e5e5',
                color: msg.role === 'user' ? 'white' : '#333',
                whiteSpace: 'pre-wrap'
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!isEnded ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <textarea
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的回答..."
            style={{ flex: 1, minHeight: '60px' }}
            disabled={loading}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              发送
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleEnd}
              disabled={loading}
            >
              结束面试
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '12px' }}>面试已结束，正在生成评估报告...</p>
          <button
            className="btn"
            onClick={() => router.push(`/result/${interviewId}`)}
          >
            查看评估报告
          </button>
        </div>
      )}
    </div>
  );
}
