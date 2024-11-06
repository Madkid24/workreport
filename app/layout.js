import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Generate Worksheet",
  description: "Generate Worksheet",
  icons: {
    icon: '/favicon.ico', // This points to the favicon in the public directory
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}