import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./styles/main.css";
import Footer from "./components/layout/footer";

export const metadata: Metadata = {
  title: "Bitcoin Balance Checker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <main className="bg-black min-h-screen text-white flex flex-col items-center justify-center pb-24">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
