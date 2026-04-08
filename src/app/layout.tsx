import "./globals.css";
import { Inter, Outfit } from "next/font/google";
// import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-background text-foreground transition-colors duration-300`}>
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
        {/* <Toaster /> */}
      </body>
    </html>
  );
}
