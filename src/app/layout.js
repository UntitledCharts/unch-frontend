import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./layout.css";
import ClientLayout from "./ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://unch.untitledcharts.com'),
  title: 'UntitledCharts',
  description: 'The Community Platform for Sonolus',
  openGraph: {
    title: 'UntitledCharts',
    description: 'The Community Platform for Sonolus',
    url: 'https://unch.untitledcharts.com',
    siteName: 'UntitledCharts',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UntitledCharts',
    description: 'The Community Platform for Sonolus',
    images: ['/opengraph-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ClientLayout variableClasses={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </ClientLayout>
    </html>
  );
}
