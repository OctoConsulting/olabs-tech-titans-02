import "./globals.css";
import type { Metadata } from "next";

import { EndpointsContext } from "./agent";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "LangChain Gen UI",
  description: "Generative UI application with LangChain Python",
};

interface RootLayoutProps {
  children: ReactNode;
  charts: ReactNode;
}

export default function RootLayout({ children, charts }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-row p-4 md:p-12 h-[100vh] gap-12 justify-between px-5">
          <EndpointsContext>{children}</EndpointsContext>
          {charts}
        </div>
      </body>
    </html>
  );
}
