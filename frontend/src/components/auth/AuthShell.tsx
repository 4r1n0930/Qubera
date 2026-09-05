import type { ReactNode } from 'react'
import { QuberaLogo } from '../quantum/QuberaLogo'
import { QuantumBrandPanel } from '../quantum/QuantumBrandPanel'
import { SecurityFooter } from '../login/SecurityFooter'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:h-screen">
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <header className="flex flex-col items-center gap-3 bg-ivory px-6 py-8 md:hidden">
          <QuberaLogo className="text-4xl" />
          <p className="text-base font-medium text-sage">Learn. Experiment. Understand Quantum.</p>
        </header>
        <QuantumBrandPanel />
        <section
          aria-label="Authentication"
          className="flex flex-1 items-center justify-center overflow-hidden bg-card px-6 py-12"
        >
          <div className="animate-auth-card flex w-full max-w-[620px] flex-col rounded-[30px] border border-cardborder bg-card p-10 shadow-[0_24px_60px_-30px_rgba(11,61,50,0.18)] sm:w-[580px] sm:p-[60px]">
            {children}
          </div>
        </section>
      </div>
      <SecurityFooter />
      <style>{`
        .animate-auth-card { animation: auth-fade 220ms ease-out; }
        @keyframes auth-fade { from { opacity:0; transform: translateY(6px);} to { opacity:1; transform:none; } }
        @media (prefers-reduced-motion: reduce) { .animate-auth-card { animation:none; } }
      `}</style>
    </div>
  )
}
