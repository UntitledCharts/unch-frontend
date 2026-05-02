import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./layout.css";
import ClientLayout from "./ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {assetCdn && <link rel="preconnect" href={assetCdn} crossOrigin="anonymous" />}
        <link rel="preconnect" href="https://ba14959b4680d4b81463a1d708c63691.untitledcharts.com" crossOrigin="anonymous" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1175503001380961"
          crossOrigin="anonymous"
        />
      </head>
      <ClientLayout variableClasses={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </ClientLayout>
    </html>
  );
}
