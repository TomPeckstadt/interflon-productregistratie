import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
  icons: {
    icon: "/dematic-logo.png",
    apple: "/dematic-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/dematic-logo.png" />
        <link rel="icon" type="image/png" href="/dematic-logo.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
