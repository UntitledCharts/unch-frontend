import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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

const siteUrl = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3001';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'UntitledCharts',
  description: 'The Community Platform for Sonolus',
  openGraph: {
    title: 'UntitledCharts',
    description: 'The Community Platform for Sonolus',
    url: siteUrl,
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
  const assetCdn = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {assetCdn && <link rel="preconnect" href={assetCdn} crossOrigin="anonymous" />}
        <link rel="dns-prefetch" href="https://ba14959b4680d4b81463a1d708c63691.untitledcharts.com" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1175503001380961"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <ClientLayout variableClasses={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </ClientLayout>
    </html>
  );
}
