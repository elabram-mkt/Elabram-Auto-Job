import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VacancyAI - Job Listing Generator',
  description: 'Professional Job Listings in Seconds',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
