function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-slate-200/80 dark:bg-slate-800/80 animate-pulse ${className}`}
    />
  )
}

function Spinner() {
  return (
    <div className="h-4 w-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
  )
}

export default function Loading() {
  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <div className="mb-6 space-y-2">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-8 w-16" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <Spinner />
              </div>
            </div>
            {index < 4 && (
              <div className="mt-4 space-y-2">
                <SkeletonBlock className="h-1.5 w-full rounded-full" />
                <div className="flex justify-between">
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-3 w-12" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-slate-100 dark:border-slate-800">
          <SkeletonBlock className="h-9 w-64 max-w-full" />
          <SkeletonBlock className="h-9 w-32" />
          <SkeletonBlock className="h-9 w-32" />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-4 gap-4 px-4 py-3">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-4/5" />
              <SkeletonBlock className="h-4 w-2/3" />
              <SkeletonBlock className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
