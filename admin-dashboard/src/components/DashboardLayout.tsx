import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-darkBg flex flex-col">
      {/* Premium Top Navigation Bar */}
      <header className="bg-brand-cardBg border-b border-brand-border px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {/* Logo referencing Logo.png */}
          <div className="bg-white/5 p-2 rounded-lg border border-brand-border/40 backdrop-blur-sm">
            <img 
              src="/Logo.png" 
              alt="Shaker Group Logo" 
              className="h-9 object-contain block brightness-110 contract-105" 
            />
          </div>
          <div className="hidden sm:block border-l border-brand-border h-6 my-auto mx-1"></div>
          <span className="hidden sm:inline text-xs tracking-widest uppercase font-mono text-brand-textMuted bg-brand-darkBg px-2.5 py-1 rounded border border-brand-border">
            Admin Suite v1.2
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 rounded-full h-2 w-2 animate-pulse shadow-[0_0_8px_#10b981]"></div>
          <span className="text-xs font-mono text-brand-textMuted bg-brand-darkBg px-3 py-1.5 rounded-md border border-brand-border flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-brand-accent" /> SECURE SESSION
          </span>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}