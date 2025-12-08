import { useState } from "react";
import { HelpCircle, ChevronRight, Send, CheckCircle } from "lucide-react";
import { Question } from "@/data/documents";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type PlanQuestion } from "@/api/planCollab";

interface QuestionsPanelProps {
  questions: Question[];
  isOpen: boolean;
  onToggle: () => void;
  onAnswerQuestion?: (questionId: string, answer: string) => void;
  pendingQuestions?: PlanQuestion[];
}

export function QuestionsPanel({
  questions,
  isOpen,
  onToggle,
  onAnswerQuestion,
  pendingQuestions = [],
}: QuestionsPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSubmitAnswer = (questionId: string) => {
    const answer = answers[questionId]?.trim();
    if (!answer || !onAnswerQuestion) return;

    onAnswerQuestion(questionId, answer);
    setAnswers((prev) => ({ ...prev, [questionId]: "" }));
  };

  const answeredCount = pendingQuestions.filter((q) => q.status === "ANSWERED").length;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-72 right-0 bg-panel border-t border-border transition-all duration-300 z-10",
        isOpen ? "h-[45vh]" : "h-14"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full h-14 px-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-question">
            <HelpCircle className="w-5 h-5 text-foreground" />
          </div>
          <span className="font-semibold text-foreground">Questions from Claude</span>
          {pendingQuestions.length > 0 ? (
            <>
              <span className="text-sm text-muted-foreground">
                {pendingQuestions.filter((q) => q.status === "PENDING").length} pending
              </span>
              {answeredCount > 0 && (
                <span className="text-sm bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full ml-2">
                  {answeredCount} answered
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No questions yet</span>
          )}
        </div>
        <ChevronRight
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-90"
          )}
        />
      </button>

      {isOpen && (
        <div className="h-[calc(45vh-3.5rem)] overflow-y-auto scrollbar-thin p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {pendingQuestions.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No questions from Claude yet</p>
                <p className="text-xs mt-2">Questions will appear here when Claude needs clarification</p>
              </div>
            ) : (
              pendingQuestions.map((question, qIndex) => (
                <div
                  key={question.id}
                  className={cn(
                    "bg-card rounded-xl p-6 shadow-sm animate-scale-in",
                    question.status === "ANSWERED" && "opacity-60"
                  )}
                  style={{ animationDelay: `${qIndex * 100}ms` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <span
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                        question.status === "PENDING"
                          ? "bg-accent/20 text-accent-foreground"
                          : "bg-correct/20 text-correct"
                      )}
                    >
                      {question.status === "ANSWERED" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        qIndex + 1
                      )}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-foreground leading-snug">
                        {question.questionText}
                      </h3>
                      {question.context && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          Context: {question.context}
                        </p>
                      )}
                    </div>
                  </div>

                  {question.status === "PENDING" && onAnswerQuestion && (
                    <div className="ml-12 space-y-3">
                      <Textarea
                        value={answers[question.id] || ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: e.target.value,
                          }))
                        }
                        placeholder="Type your answer..."
                        className="min-h-[80px] text-sm"
                      />
                      <Button
                        onClick={() => handleSubmitAnswer(question.id)}
                        disabled={!answers[question.id]?.trim()}
                        className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        <Send className="w-4 h-4" />
                        Submit Answer
                      </Button>
                    </div>
                  )}

                  {question.status === "ANSWERED" && (
                    <div className="ml-12 text-sm text-muted-foreground">
                      <span className="text-correct font-medium">Answered</span>
                      {question.answeredAt && (
                        <span className="ml-2">
                          on{" "}
                          {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(new Date(question.answeredAt))}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
