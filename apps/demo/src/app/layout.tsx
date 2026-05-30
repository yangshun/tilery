import type { Metadata } from 'next';
import '@tilery/react/style.css';

export const metadata: Metadata = {
  title: 'Tilery Demo',
  description: 'A tiling panel layout engine for React',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
