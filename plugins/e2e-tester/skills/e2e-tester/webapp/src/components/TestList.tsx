'use client';

import { useState } from 'react';
import { TestItem } from './TestItem';
import type { Test, TestStatus, UserStep } from '@/lib/types';

interface TestListProps {
  tests: Test[];
  sessionId: string;
  onTestUpdate: (testId: string, updates: { userResult?: TestStatus; userRemarks?: string; userSteps?: UserStep[] }) => Promise<void>;
}

export function TestList({ tests = [], sessionId, onTestUpdate }: TestListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    tests.find(t => t.userResult === 'pending')?.id || tests[0]?.id || null
  );

  if (!tests || tests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tests found in this session.
      </div>
    );
  }

  const handleExpand = (testId: string) => {
    setExpandedId(expandedId === testId ? null : testId);
  };

  const handleNext = (currentId: string) => {
    const currentIndex = tests.findIndex(t => t.id === currentId);
    if (currentIndex < tests.length - 1) {
      setExpandedId(tests[currentIndex + 1].id);
    }
  };

  return (
    <div className="space-y-4">
      {tests.map((test, index) => (
        <TestItem
          key={test.id}
          test={test}
          index={index}
          total={tests.length}
          sessionId={sessionId}
          isExpanded={expandedId === test.id}
          onExpand={() => handleExpand(test.id)}
          onUpdate={(updates) => onTestUpdate(test.id, updates)}
          onNext={() => handleNext(test.id)}
        />
      ))}
    </div>
  );
}
