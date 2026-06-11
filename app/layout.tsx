import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patch | Discount Tire IT Support",
  description: "Self-service IT support for Discount Tire associates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </body>
    </html>
  );
}
