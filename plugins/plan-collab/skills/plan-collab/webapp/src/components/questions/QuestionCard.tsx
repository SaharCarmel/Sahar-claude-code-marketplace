'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Question, QuestionOption } from '@/types';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string) => Promise<void>;
}

export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customAnswer, setCustomAnswer] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options: QuestionOption[] = question.options || [];
  const hasOptions = options.length > 0;
  const isPending = question.status === 'PENDING';

  const handleOptionClick = async (optionLabel: string) => {
    if (!isPending) return;

    setSelectedOption(optionLabel);
    setShowCustomInput(false);
    setIsSubmitting(true);

    try {
      await onAnswer(optionLabel);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setSelectedOption(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtherClick = () => {
    setSelectedOption(null);
    setShowCustomInput(true);
  };

  const handleCustomSubmit = async () => {
    if (!customAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      await onAnswer(customAnswer.trim());
      setShowCustomInput(false);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleCustomSubmit();
    }
    if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomAnswer('');
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      {/* Question header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">
            {question.question_text}
          </p>
          {question.context && (
            <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 px-2 py-1 rounded inline-block">
              {question.context}
            </p>
          )}
        </div>
        <Badge
          variant={isPending ? 'secondary' : 'outline'}
          className={`flex-shrink-0 text-xs ${
            isPending
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          }`}
        >
          {isPending ? 'Pending' : 'Answered'}
        </Badge>
      </div>

      {/* Options or Answer display */}
      {isPending ? (
        <div className="space-y-3">
          {/* Option chips */}
          {hasOptions && (
            <div className="flex flex-wrap gap-2">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option.label)}
                  disabled={isSubmitting}
                  className={`
                    px-3 py-1.5 text-sm rounded-full border transition-all
                    ${selectedOption === option.label
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border hover:border-primary/50'
                    }
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
              {/* Other option */}
              <button
                onClick={handleOtherClick}
                disabled={isSubmitting}
                className={`
                  px-3 py-1.5 text-sm rounded-full border transition-all
                  ${showCustomInput
                    ? 'bg-muted border-primary/50'
                    : 'bg-background hover:bg-muted border-border hover:border-primary/50'
                  }
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                Other...
              </button>
            </div>
          )}

          {/* Custom text input */}
          {(showCustomInput || !hasOptions) && (
            <div className="space-y-2">
              <Textarea
                value={customAnswer}
                onChange={(e) => setCustomAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                className="min-h-[60px] resize-none text-sm"
                autoFocus
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to submit
                </span>
                <div className="flex gap-2">
                  {hasOptions && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomAnswer('');
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleCustomSubmit}
                    disabled={!customAnswer.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Answered state */
        <div className="space-y-2">
          <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-300">
              {question.answer}
            </p>
          </div>
          {question.answered_at && (
            <p className="text-xs text-muted-foreground">
              Answered {new Date(question.answered_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
