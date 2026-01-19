import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from './compoents/ClientLayout';

export const metadata: Metadata = {
  title: 'VIRA - Your AI Health Companion',
  description: 'Talk naturally about your symptoms, get intelligent health guidance, track medications, and manage your wellness journey with AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
