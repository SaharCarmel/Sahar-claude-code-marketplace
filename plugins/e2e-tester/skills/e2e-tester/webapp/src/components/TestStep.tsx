'use client';

import { Check } from 'lucide-react';
import { cn, getStepTypeIcon } from '@/lib/utils';
import type { UserStep as UserStepType } from '@/lib/types';

interface TestStepProps {
  step: UserStepType;
  index: number;
  total: number;
  onToggle: () => void;
}

// Simplified component - just checkboxes for user steps
// No commands, no output capture - users just do manual actions
export function TestStep({ step, index, total, onToggle }: TestStepProps) {
  const typeIcon = getStepTypeIcon(step.type);

  return (
    <div className={cn(
      'border rounded-lg p-4 transition-all',
      step.completed ? 'bg-green-50 border-green-200' : 'bg-background'
    )}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={cn(
            'mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0',
            step.completed
              ? 'bg-green-600 border-green-600 text-white'
              : 'border-muted-foreground/30 hover:border-primary'
          )}
        >
          {step.completed && <Check className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{typeIcon}</span>
            <span className="text-sm font-medium text-muted-foreground uppercase">
              Step {index + 1}/{total}: {step.type}
            </span>
          </div>
          <p className={cn(
            'font-medium',
            step.completed && 'line-through text-muted-foreground'
          )}>
            {step.instruction}
          </p>
        </div>
      </div>
    </div>
  );
}
