'use client';

import { cn } from '@/lib/utils';

interface TestProgressProps {
  total: number;
  completed: number;
  passed: number;
  failed: number;
}

export function TestProgress({ total, completed, passed, failed }: TestProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const skipped = completed - passed - failed;

  return (
    <div className="mb-8 p-4 bg-muted rounded-lg">
      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-3">
        <span className="text-sm font-medium min-w-[80px]">
          {completed}/{total} tests
        </span>
        <div className="flex-1 h-3 bg-background rounded-full overflow-hidden">
          <div className="h-full flex">
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${(passed / total) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${(failed / total) * 100}%` }}
            />
            <div
              className="bg-yellow-500 transition-all duration-300"
              style={{ width: `${(skipped / total) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-medium min-w-[50px] text-right">
          {percentage}%
        </span>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Passed:</span>
          <span className="font-medium">{passed}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Failed:</span>
          <span className="font-medium">{failed}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">Skipped:</span>
          <span className="font-medium">{skipped}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-muted-foreground">Pending:</span>
          <span className="font-medium">{total - completed}</span>
        </div>
      </div>
    </div>
  );
}
