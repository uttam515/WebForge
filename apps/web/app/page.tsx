import { CURRENT_APPSPEC_VERSION } from '@webforge/spec';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-radial from-slate-900 to-slate-950">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <span>AppSpec Target: v{CURRENT_APPSPEC_VERSION}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          WebForge Builder
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed">
          Schema-driven application compiler foundation. Structured requirements compiled into
          deterministic AppSpecs.
        </p>
        <div className="pt-4 flex justify-center gap-4 text-sm text-slate-500">
          <span>App Router</span>
          <span>•</span>
          <span>TypeScript Strict</span>
          <span>•</span>
          <span>Tailwind CSS</span>
        </div>
      </div>
    </main>
  );
}
