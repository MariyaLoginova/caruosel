import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'carousel-gen',
  description: 'Generate carousel slides from references and bulk text.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
