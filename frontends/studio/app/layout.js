import './globals.css';

export const metadata = { title: 'Netflix Studio' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <a href="/" className="logo">NETFLIX</a>
          <span className="tag">Studio</span>
          <nav>
            <a href="/studio">Titles</a>
            <a href="/">Back to app</a>
          </nav>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
