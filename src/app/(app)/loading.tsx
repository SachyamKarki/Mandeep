import { panelClass } from "@/components/ui";

// Shown instantly while any page in the app loads its data.

function Bar({ className }: { className: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-2.5">
          <Bar className="h-7 w-48" />
          <Bar className="h-4 w-72 max-w-[60vw]" />
        </div>
        <Bar className="h-9 w-28" />
      </div>

      <div className={panelClass}>
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 bg-surface px-5 py-5">
              <Bar className="h-4 w-24" />
              <Bar className="h-6 w-32" />
              <Bar className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className={`${panelClass} mt-6`}>
        <div className="border-b border-border px-4 py-3">
          <Bar className="h-5 w-40" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <Bar className="h-4 w-20" />
              <Bar className="h-4 flex-1" />
              <Bar className="hidden h-4 w-24 md:block" />
              <Bar className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
