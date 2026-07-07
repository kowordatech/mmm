import type { Metadata } from "next";
import NavTabs from "@/components/NavTabs";
import DateChip from "@/components/DateChip";
import { ToastProvider } from "@/lib/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "leads2conv — Content Control Panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          <header>
            <div className="brand">
              leads2conv <span>/ content desk</span>
            </div>
            <DateChip />
          </header>
          <NavTabs />
          <main>{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
