"use client";

import { Navbar } from "./navbar";
import { Footer } from "./footer";

export function AppShell({
  userEmail: _userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="px-6 py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

