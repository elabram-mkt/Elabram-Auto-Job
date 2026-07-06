import '../index.css';

export const metadata = {
  title: 'VacancyAI',
  description: 'An AI-powered job vacancy generator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
