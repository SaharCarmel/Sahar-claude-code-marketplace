'use client';

import Link from 'next/link';
import { Clock, ChevronRight, CheckCircle, XCircle, Circle } from 'lucide-react';
import type { TestSession } from '@/lib/types';

interface DashboardSessionCardProps {
  session: TestSession;
}

export function DashboardSessionCard({ session }: DashboardSessionCardProps) {
  const tests = session.tests || [];

  const pendingCount = tests.filter(t => t.userResult === 'pending').length;
  const passedCount = tests.filter(t => t.userResult === 'passed').length;
  const failedCount = tests.filter(t => t.userResult === 'failed').length;
  const skippedCount = tests.filter(t => t.userResult === 'skipped').length;
  const completedCount = passedCount + failedCount + skippedCount;
  const totalCount = tests.length;

  // Progress percentage
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Format creation time
  const createdAt = new Date(session.createdAt);
  const timeAgo = getTimeAgo(createdAt);

  return (
    <Link
      href={`/?session=${session.id}`}
      className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side - session info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-lg truncate group-hover:text-primary transition-colors">
            {session.feature}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            Session: {session.id}
          </p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Circle className="w-3 h-3" />
              {pendingCount} pending
            </span>
            {passedCount > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                {passedCount} passed
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="w-3 h-3" />
                {failedCount} failed
              </span>
            )}
          </div>
        </div>

        {/* Right side - time and arrow */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </div>
            <div className="text-xs mt-1">
              {completedCount}/{totalCount} done
            </div>
          </div>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
