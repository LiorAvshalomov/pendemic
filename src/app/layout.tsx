import type { Metadata } from "next"
import { Geist, Geist_Mono, Heebo } from "next/font/google"
import "./globals.css"
import AuthSync from "@/components/auth/AuthSync"
import SuspensionSync from "@/components/moderation/SuspensionSync"
import ClientChrome from "@/components/ClientChrome"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const heebo = Heebo({
  variable: "--font-editor-hebrew", 
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap"
})



export const metadata: Metadata = {
  title: "Tyuta - המקום לכל הגרסאות שלך",
  description: "Tyuta - המקום לכל הגרסאות שלך",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={`${heebo.variable} ${geistSans.variable} ${geistMono.variable}  antialiased bg-background text-foreground overflow-x-hidden`}>
        <AuthSync>
          <SuspensionSync>
            <ClientChrome>{children}</ClientChrome>
          </SuspensionSync>
        </AuthSync>
      </body>
    </html>
  )
}
