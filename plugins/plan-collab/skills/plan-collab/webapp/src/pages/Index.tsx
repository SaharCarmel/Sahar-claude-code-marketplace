import { useState, useEffect, useCallback } from "react";
import { MessageSquare, PanelRightOpen, PanelRightClose, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { DocumentSidebar } from "@/components/DocumentSidebar";
import { MarkdownContent } from "@/components/MarkdownContent";
import { CommentsPanel } from "@/components/CommentsPanel";
import { QuestionsPanel } from "@/components/QuestionsPanel";
import { Button } from "@/components/ui/button";
import { getPlan, setPlan, addComment, resolveComment, answerQuestion, type Plan, type PlanComment, type PlanQuestion, type PlanAnswer } from "@/api/planCollab";
import { Document, Comment, Question, HighlightedSection, LinkedIssue } from "@/data/documents";

// Convert API plan to Document format for existing components
function planToDocument(plan: Plan): Document {
  // Create highlights from comments (the selected text becomes a highlight)
  const highlights: HighlightedSection[] = plan.comments.map((c, idx) => ({
    id: `h_${c.id}`,
    text: c.selectedText,
    startOffset: 0,
    endOffset: 0,
  }));

  // Convert API comments to component format
  const comments: Comment[] = plan.comments.map(c => ({
    id: c.id,
    highlightId: `h_${c.id}`,
    author: "User",
    text: c.content,
    timestamp: new Date(c.timestamp),
  }));

  // Convert API questions to component format (if any)
  const questions: Question[] = plan.questions.map(q => ({
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
    linkedIssues: [], // TODO: Add API support for linked issues
  };
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const [plan, setPlanState] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);

  // Load plan from URL param or fetch active plan
  useEffect(() => {
    const loadPlan = async () => {
      setLoading(true);
      setError(null);

      try {
        const planPath = searchParams.get("plan");

        if (planPath) {
          // Set plan from URL parameter
          const loadedPlan = await setPlan(planPath);
          setPlanState(loadedPlan);
        } else {
          // Try to get active plan
          const activePlan = await getPlan();
          if (activePlan) {
            setPlanState(activePlan);
          } else {
            setError("No plan loaded. Add ?plan=/path/to/plan.md to the URL.");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plan");
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [searchParams]);

  const handleHighlightClick = (highlightId: string) => {
    setActiveHighlight(highlightId);
    setShowComments(true);
  };

  const handleAddComment = useCallback(async (selectedText: string, content: string, anchorPrefix?: string, anchorSuffix?: string) => {
    if (!plan) return;

    try {
      const newComment = await addComment({
        selectedText,
        content,
        anchorPrefix,
        anchorSuffix,
      });

      // Update local state
      setPlanState(prev => prev ? {
        ...prev,
        comments: [...prev.comments, newComment],
      } : null);
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  }, [plan]);

  const handleResolveComment = useCallback(async (commentId: string) => {
    try {
      await resolveComment(commentId);

      // Update local state
      setPlanState(prev => prev ? {
        ...prev,
        comments: prev.comments.map(c =>
          c.id === commentId ? { ...c, status: 'RESOLVED' as const } : c
        ),
      } : null);
    } catch (err) {
      console.error("Failed to resolve comment:", err);
    }
  }, []);

  const handleAnswerQuestion = useCallback(async (questionId: string, answer: string) => {
    try {
      const result = await answerQuestion(questionId, answer);

      // Update local state
      setPlanState(prev => prev ? {
        ...prev,
        questions: prev.questions.map(q =>
          q.id === questionId ? result.question : q
        ),
        answers: [...prev.answers, result.answer],
      } : null);
    } catch (err) {
      console.error("Failed to answer question:", err);
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading plan...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !plan) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">No Plan Loaded</h1>
          <p className="text-muted-foreground">
            {error || "No active plan. Add ?plan=/path/to/plan.md to the URL to load a plan."}
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg text-sm text-left w-full">
            <p className="font-medium mb-2">Example:</p>
            <code className="text-xs break-all">
              http://localhost:8080?plan=/path/to/your/plan.md
            </code>
          </div>
        </div>
      </div>
    );
  }

  const selectedDoc = planToDocument(plan);
  const documents = [selectedDoc]; // Single plan as document list

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Left Sidebar - Document List */}
      <DocumentSidebar
        documents={documents}
        selectedId={selectedDoc.id}
        onSelect={() => {}}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {plan.comments.filter(c => c.status === 'OPEN').length} open comments
              {plan.questions.filter(q => q.status === 'PENDING').length > 0 &&
                ` · ${plan.questions.filter(q => q.status === 'PENDING').length} pending questions`}
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
          pendingQuestions={plan.questions.filter(q => q.status === 'PENDING')}
        />
      </main>
    </div>
  );
};

export default Index;
