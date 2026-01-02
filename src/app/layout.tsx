import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ClearInputsOnRefresh from "@/components/ClearInputsOnRefresh";
import { clsx } from "clsx";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Excel Academy | Student & Academic Portal",
  description: "Official portal for Excel Academy. View student results, download academic materials, and stay updated with the latest school announcements.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={clsx(
          geistSans.className,
          geistMono.variable,
          "antialiased"
        )}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ToastProvider>
            <ClearInputsOnRefresh />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
