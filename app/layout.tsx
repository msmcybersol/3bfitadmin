// app/layout.tsx

import './globals.css'

export const metadata = {
  title: '3BFit Admin',
  description: '3BFit Administrative Console',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}