'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, X, SkipForward } from 'lucide-react';
import { TestStep } from './TestStep';
import { NotesPanel } from './NotesPanel';
import { cn, getPriorityColor, getStatusColor, getCategoryLabel } from '@/lib/utils';
import type { Test, TestStatus, UserStep, Evidence } from '@/lib/types';

interface TestItemProps {
  test: Test;
  index: number;
  total: number;
  sessionId: string;
  isExpanded: boolean;
  onExpand: () => void;
  onUpdate: (updates: { userResult?: TestStatus; userRemarks?: string; userSteps?: UserStep[] }) => Promise<void>;
  onNext: () => void;
}

export function TestItem({
  test,
  index,
  total,
  sessionId,
  isExpanded,
  onExpand,
  onUpdate,
  onNext,
}: TestItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localSteps, setLocalSteps] = useState(test.userSteps || []);
  const [localNotes, setLocalNotes] = useState<Evidence[]>(test.userEvidence || []);

  const handleStatusChange = async (status: TestStatus) => {
    setIsUpdating(true);
    try {
      await onUpdate({ userResult: status, userSteps: localSteps });
      if (status !== 'pending') {
        onNext();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStepToggle = async (stepIndex: number) => {
    const updatedSteps = [...localSteps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      completed: !updatedSteps[stepIndex].completed,
    };
    setLocalSteps(updatedSteps);

    // Update step on server
    try {
      await fetch(`/api/sessions/${sessionId}/tests/${test.id}/steps/${updatedSteps[stepIndex].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: updatedSteps[stepIndex].completed }),
      });
    } catch (err) {
      console.error('Failed to update step:', err);
    }
  };

  const handleNoteAdded = (note: Evidence) => {
    setLocalNotes(prev => [...prev, note]);
  };

  const statusIcon = {
    pending: null,
    passed: <Check className="w-5 h-5 text-green-600" />,
    failed: <X className="w-5 h-5 text-red-600" />,
    skipped: <SkipForward className="w-5 h-5 text-yellow-600" />,
  }[test.userResult];

  const completedSteps = localSteps.filter(s => s.completed).length;
  const totalSteps = localSteps.length;
  const noteCount = localNotes.length;

  // Collapsed view for completed tests
  if (!isExpanded && test.userResult !== 'pending') {
    return (
      <button
        onClick={onExpand}
        className={cn(
          'w-full p-3 flex items-center gap-3 text-left rounded-lg border transition-colors hover:bg-muted/50',
          getStatusColor(test.userResult)
        )}
      >
        {statusIcon}
        <span className="flex-1 font-medium truncate">{test.title}</span>
        {noteCount > 0 && (
          <span className="text-xs text-muted-foreground">{noteCount} note{noteCount !== 1 ? 's' : ''}</span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden transition-all',
      isExpanded ? 'ring-2 ring-primary' : '',
      getStatusColor(test.userResult)
    )}>
      {/* Header */}
      <button
        onClick={onExpand}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">
              Test {index + 1}/{total}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded', getPriorityColor(test.priority))}>
              {test.priority}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {getCategoryLabel(test.category)}
            </span>
          </div>
          <h3 className="font-medium truncate">{test.title}</h3>
        </div>

        <div className="flex items-center gap-2">
          {totalSteps > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">
              {completedSteps}/{totalSteps}
            </span>
          )}
          {statusIcon}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t px-4 pb-4">
          {/* Description */}
          {test.description && (
            <p className="text-sm text-muted-foreground mt-4">
              {test.description}
            </p>
          )}

          {/* User Steps */}
          {localSteps.length > 0 && (
            <div className="mt-4 space-y-2">
              {localSteps.map((step, stepIndex) => (
                <TestStep
                  key={step.id}
                  step={step}
                  index={stepIndex}
                  total={localSteps.length}
                  onToggle={() => handleStepToggle(stepIndex)}
                />
              ))}
            </div>
          )}

          {/* Auto Verification Info */}
          {(test.autoVerifications?.length || 0) > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
              <span className="font-medium text-blue-700">Claude will verify: </span>
              <span className="text-blue-600">
                {(test.autoVerifications || []).map(v => v.description).join(', ')}
              </span>
            </div>
          )}

          {/* Notes Panel - Replaces both Evidence and Remarks */}
          <NotesPanel
            notes={localNotes}
            sessionId={sessionId}
            testId={test.id}
            onNoteAdded={handleNoteAdded}
          />

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => handleStatusChange('passed')}
              disabled={isUpdating}
              className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Pass
            </button>
            <button
              onClick={() => handleStatusChange('failed')}
              disabled={isUpdating}
              className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Fail
            </button>
            <button
              onClick={() => handleStatusChange('skipped')}
              disabled={isUpdating}
              className="py-2.5 px-4 bg-muted text-muted-foreground rounded-md font-medium hover:bg-muted/80 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <SkipForward className="w-5 h-5" />
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
