import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebForge | Schema-Driven Application Platform',
  description:
    'WebForge is a schema-driven no-code platform for compiling structured requirements into production web applications.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
