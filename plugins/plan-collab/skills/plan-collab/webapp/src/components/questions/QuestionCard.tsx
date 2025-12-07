'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string) => Promise<void>;
}

export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [answer, setAnswer] = useState(question.answer || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(question.status === 'PENDING');

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setIsSubmitting(true);
    try {
      await onAnswer(answer.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card
      className={
        question.status === 'PENDING'
          ? 'border-yellow-500/50'
          : 'border-green-500/50'
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-relaxed">
            {question.question_text}
          </p>
          <Badge
            variant={question.status === 'PENDING' ? 'secondary' : 'outline'}
            className="flex-shrink-0"
          >
            {question.status === 'PENDING' ? 'Pending' : 'Answered'}
          </Badge>
        </div>
        {question.context && (
          <p className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded">
            Context: {question.context}
          </p>
        )}
        {question.section_path && (
          <p className="text-xs text-muted-foreground">
            Section: {question.section_path}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter to
                submit
              </span>
              <div className="flex gap-2">
                {question.status === 'ANSWERED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!answer.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm">
              <p className="text-green-700 dark:text-green-400 font-medium text-xs mb-1">
                Your Answer:
              </p>
              <p>{question.answer}</p>
            </div>
            {question.answered_at && (
              <p className="text-xs text-muted-foreground">
                Answered {new Date(question.answered_at).toLocaleString()}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setIsEditing(true)}
            >
              Edit Answer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
