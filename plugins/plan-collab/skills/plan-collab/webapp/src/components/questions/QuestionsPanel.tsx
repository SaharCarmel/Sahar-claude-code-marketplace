'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QuestionCard } from './QuestionCard';
import type { Question } from '@/types';

interface QuestionsPanelProps {
  questions: Question[];
  onAnswer: (questionId: string, answer: string) => Promise<void>;
}

export function QuestionsPanel({ questions, onAnswer }: QuestionsPanelProps) {
  const [open, setOpen] = useState(false);

  const pendingQuestions = questions.filter((q) => q.status === 'PENDING');
  const answeredQuestions = questions.filter((q) => q.status === 'ANSWERED');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Questions
          {pendingQuestions.length > 0 && (
            <Badge variant="destructive" className="ml-1">
              {pendingQuestions.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Claude&apos;s Questions
            {pendingQuestions.length > 0 && (
              <Badge variant="outline">{pendingQuestions.length} pending</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <svg
                className="h-8 w-8 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>No questions at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending questions first */}
              {pendingQuestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Pending
                  </h4>
                  <div className="space-y-3">
                    {pendingQuestions.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        onAnswer={(answer) => onAnswer(question.id, answer)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Answered questions */}
              {answeredQuestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-6">
                    Answered
                  </h4>
                  <div className="space-y-3">
                    {answeredQuestions.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        onAnswer={(answer) => onAnswer(question.id, answer)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
