import { useState, useCallback } from "react";
import { MessageSquare, PanelRightOpen, PanelRightClose, Loader2, List } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PlanQueueSidebar } from "@/components/PlanQueueSidebar";
import { MarkdownContent } from "@/components/MarkdownContent";
import { CommentsPanel } from "@/components/CommentsPanel";
import { QuestionsPanel } from "@/components/QuestionsPanel";
import { Button } from "@/components/ui/button";
import { usePlanQueue } from "@/hooks/usePlanQueue";
import {
  addCommentToPlan,
  resolveCommentForPlan,
  answerQuestionForPlan,
  type Plan,
} from "@/api/planCollab";
import { Document, Comment, HighlightedSection, Question } from "@/data/documents";

// Convert API plan to Document format for existing components
function planToDocument(plan: Plan): Document {
  // Create highlights from comments (the selected text becomes a highlight)
  const highlights: HighlightedSection[] = plan.comments.map((c) => ({
    id: `h_${c.id}`,
    text: c.selectedText,
    startOffset: 0,
    endOffset: 0,
  }));

  // Convert API comments to component format
  const comments: Comment[] = plan.comments.map((c) => ({
    id: c.id,
    highlightId: `h_${c.id}`,
    author: "User",
    text: c.content,
    timestamp: new Date(c.timestamp),
  }));

  // Convert API questions to component format (if any)
  const questions: Question[] = plan.questions.map((q) => ({
    id: q.id,
    question: q.questionText,
    options: [], // API questions don't have options
    correctAnswer: -1,
  }));

  return {
    id: plan.id,
    title: plan.title,
    author: "Plan",
    readTime: "",
    content: plan.content,
    highlights,
    comments,
    questions,
    linkedIssues: [],
  };
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId") || undefined;

  const {
    plans,
    selectedPlan,
    selectedPlanId,
    loading,
    planLoading,
    error,
    selectPlan,
    deletePlan,
    refreshPlans,
  } = usePlanQueue(sessionId);

  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);

  const handleHighlightClick = (highlightId: string) => {
    setActiveHighlight(highlightId);
    setShowComments(true);
  };

  const handleAddComment = useCallback(
    async (
      selectedText: string,
      content: string,
      anchorPrefix?: string,
      anchorSuffix?: string
    ) => {
      if (!selectedPlanId) return;

      try {
        await addCommentToPlan(selectedPlanId, {
          selectedText,
          content,
          anchorPrefix,
          anchorSuffix,
        });
        // State update happens via SSE
      } catch (err) {
        console.error("Failed to add comment:", err);
      }
    },
    [selectedPlanId]
  );

  const handleResolveComment = useCallback(
    async (commentId: string) => {
      if (!selectedPlanId) return;

      try {
        await resolveCommentForPlan(selectedPlanId, commentId);
        // State update happens via SSE
      } catch (err) {
        console.error("Failed to resolve comment:", err);
      }
    },
    [selectedPlanId]
  );

  const handleAnswerQuestion = useCallback(
    async (questionId: string, answer: string) => {
      if (!selectedPlanId) return;

      try {
        await answerQuestionForPlan(selectedPlanId, questionId, answer);
        // State update happens via SSE
      } catch (err) {
        console.error("Failed to answer question:", err);
      }
    },
    [selectedPlanId]
  );

  const handleRemovePlan = useCallback(
    async (planId: string) => {
      try {
        await deletePlan(planId);
      } catch (err) {
        console.error("Failed to remove plan:", err);
      }
    },
    [deletePlan]
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  const selectedDoc = selectedPlan ? planToDocument(selectedPlan) : null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Left Sidebar - Plan Queue */}
      <PlanQueueSidebar
        plans={plans}
        selectedId={selectedPlanId}
        onSelect={selectPlan}
        onRemove={handleRemovePlan}
        onRefresh={refreshPlans}
        sessionId={sessionId}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {planLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : selectedPlan && selectedDoc ? (
          <>
            {/* Top Bar */}
            <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate max-w-md">{selectedPlan.title}</span>
                <span className="text-sm text-muted-foreground">
                  {selectedPlan.comments.filter((c) => c.status === "OPEN").length} open
                  comments
                  {selectedPlan.questions.filter((q) => q.status === "PENDING").length > 0 &&
                    ` \u00b7 ${
                      selectedPlan.questions.filter((q) => q.status === "PENDING").length
                    } pending questions`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="gap-2"
                >
                  {showComments ? (
                    <PanelRightClose className="w-4 h-4" />
                  ) : (
                    <PanelRightOpen className="w-4 h-4" />
                  )}
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Comments</span>
                </Button>
              </div>
            </header>

            {/* Content + Comments */}
            <div className="flex-1 flex overflow-hidden">
              {/* Reading Area */}
              <div
                className="flex-1 overflow-y-auto scrollbar-thin"
                style={{ paddingBottom: showQuestions ? "45vh" : "2rem" }}
              >
                <div className="max-w-3xl mx-auto px-6 md:px-12 py-8 md:py-12">
                  <MarkdownContent
                    document={selectedDoc}
                    activeHighlight={activeHighlight}
                    onHighlightClick={handleHighlightClick}
                    onAddComment={handleAddComment}
                  />
                </div>
              </div>

              {/* Comments Panel */}
              <CommentsPanel
                comments={selectedDoc.comments}
                highlights={selectedDoc.highlights}
                activeHighlight={activeHighlight}
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                onHighlightSelect={setActiveHighlight}
                onResolveComment={handleResolveComment}
              />
            </div>

            {/* Questions Panel */}
            <QuestionsPanel
              questions={selectedDoc.questions}
              isOpen={showQuestions}
              onToggle={() => setShowQuestions(!showQuestions)}
              onAnswerQuestion={handleAnswerQuestion}
              pendingQuestions={selectedPlan.questions.filter((q) => q.status === "PENDING")}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <List className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-medium">No Plan Selected</h2>
              <p className="text-muted-foreground mt-2">
                {plans.length > 0
                  ? "Select a plan from the sidebar to view its contents"
                  : "Push a plan from Claude Code to get started"}
              </p>
              {error && (
                <p className="text-destructive text-sm mt-4">{error}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
