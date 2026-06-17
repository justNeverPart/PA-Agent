import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '智能招聘助手',
  description: 'AI 驱动的面试助手，自动生成面试问题并评估候选人',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
