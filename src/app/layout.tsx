import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RaffleProvider } from "@/contexts/RaffleContext";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MOTO ISLA - Rifas de Productos Motociclistas",
  description: "Participa en nuestras rifas de productos motociclistas de las mejores marcas. Boletos desde $50 pesos. ¡Gana increíbles premios para tu moto!",
  keywords: "rifas, motocicletas, productos motociclistas, premios, sorteos, moto isla",
  authors: [{ name: "MOTO ISLA" }],
  creator: "MOTO ISLA",
  publisher: "MOTO ISLA",
  openGraph: {
    title: "MOTO ISLA - Rifas de Productos Motociclistas",
    description: "Participa en nuestras rifas de productos motociclistas de las mejores marcas. ¡Gana increíbles premios para tu moto!",
    url: "https://rifas.motoisla.com",
    siteName: "MOTO ISLA Rifas",
    images: [
      {
        url: "/images/motisla.png",
        width: 800,
        height: 600,
        alt: "MOTO ISLA Logo",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MOTO ISLA - Rifas de Productos Motociclistas",
    description: "Participa en nuestras rifas de productos motociclistas de las mejores marcas. ¡Gana increíbles premios para tu moto!",
    images: ["/images/motisla.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RaffleProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </RaffleProvider>
      </body>
    </html>
  );
}
