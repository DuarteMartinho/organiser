import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/toast-provider'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Football Dashboard',
  description: 'Organize football matches with your groups',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <ToastProvider />
        <ConfirmDialog />
      </body>
    </html>
  )
}