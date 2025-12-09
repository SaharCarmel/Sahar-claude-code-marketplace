import { useState, useEffect, useCallback } from 'react';
import {
  getPlans,
  getPlanById,
  removePlan,
  subscribeToEvents,
  type Plan,
  type PlanSummary,
  type SSEEvent,
} from '@/api/planCollab';

export function usePlanQueue(sessionId?: string) {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        const loadedPlans = await getPlans(sessionId);
        setPlans(loadedPlans);

        // Auto-select first plan if none selected
        if (loadedPlans.length > 0 && !selectedPlanId) {
          setSelectedPlanId(loadedPlans[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [sessionId]);

  // Load selected plan content
  useEffect(() => {
    if (!selectedPlanId) {
      setSelectedPlan(null);
      return;
    }

    const loadPlan = async () => {
      try {
        setPlanLoading(true);
        const plan = await getPlanById(selectedPlanId);
        setSelectedPlan(plan);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plan');
        setSelectedPlan(null);
      } finally {
        setPlanLoading(false);
      }
    };

    loadPlan();
  }, [selectedPlanId]);

  // Subscribe to SSE events
  useEffect(() => {
    const handleEvent = (event: SSEEvent) => {
      switch (event.type) {
        case 'connected':
          console.log('SSE connected');
          break;

        case 'plan:added':
          if (event.plan) {
            const newPlan: PlanSummary = {
              id: event.plan.id!,
              path: event.plan.path!,
              sessionId: event.plan.sessionId || 'anonymous',
              title: event.plan.title!,
              name: event.plan.name!,
              pushedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isOwn: sessionId ? event.plan.sessionId === sessionId : false,
              stats: { openComments: 0, pendingQuestions: 0, pendingAnswers: 0 },
            };
            setPlans((prev) => [newPlan, ...prev.filter((p) => p.id !== newPlan.id)]);

            // Auto-select if no plan selected
            setSelectedPlanId((current) => current || newPlan.id);
          }
          break;

        case 'plan:updated':
          if (event.plan) {
            setPlans((prev) =>
              prev.map((p) =>
                p.id === event.plan?.id
                  ? { ...p, updatedAt: new Date().toISOString(), title: event.plan.title || p.title }
                  : p
              )
            );
            // Reload if current plan was updated
            if (selectedPlanId === event.plan?.id) {
              getPlanById(selectedPlanId).then(setSelectedPlan).catch(console.error);
            }
          }
          break;

        case 'plan:removed':
          if (event.planId) {
            setPlans((prev) => prev.filter((p) => p.id !== event.planId));
            // Clear selection if current plan was removed
            if (selectedPlanId === event.planId) {
              setSelectedPlanId(null);
              setSelectedPlan(null);
            }
          }
          break;

        case 'comment:added':
          if (event.planId && event.comment) {
            // Update stats in plans list
            setPlans((prev) =>
              prev.map((p) =>
                p.id === event.planId
                  ? { ...p, stats: { ...p.stats, openComments: p.stats.openComments + 1 } }
                  : p
              )
            );
            // Update selected plan if it's the one that got the comment
            if (selectedPlanId === event.planId) {
              setSelectedPlan((prev) =>
                prev
                  ? {
                      ...prev,
                      comments: [...prev.comments, event.comment!],
                    }
                  : null
              );
            }
          }
          break;

        case 'comment:updated':
          if (event.planId && event.comment) {
            // Update stats in plans list if comment was resolved
            if (event.comment.status === 'RESOLVED') {
              setPlans((prev) =>
                prev.map((p) =>
                  p.id === event.planId
                    ? { ...p, stats: { ...p.stats, openComments: Math.max(0, p.stats.openComments - 1) } }
                    : p
                )
              );
            }
            // Update selected plan
            if (selectedPlanId === event.planId) {
              setSelectedPlan((prev) =>
                prev
                  ? {
                      ...prev,
                      comments: prev.comments.map((c) =>
                        c.id === event.comment!.id ? event.comment! : c
                      ),
                    }
                  : null
              );
            }
          }
          break;

        case 'question:answered':
          if (event.planId && event.answer && event.question) {
            // Update stats
            setPlans((prev) =>
              prev.map((p) =>
                p.id === event.planId
                  ? {
                      ...p,
                      stats: {
                        ...p.stats,
                        pendingQuestions: Math.max(0, p.stats.pendingQuestions - 1),
                        pendingAnswers: p.stats.pendingAnswers + 1,
                      },
                    }
                  : p
              )
            );
            // Update selected plan
            if (selectedPlanId === event.planId) {
              setSelectedPlan((prev) =>
                prev
                  ? {
                      ...prev,
                      questions: prev.questions.map((q) =>
                        q.id === event.question!.id ? event.question! : q
                      ),
                      answers: [...prev.answers, event.answer!],
                    }
                  : null
              );
            }
          }
          break;
      }
    };

    const unsubscribe = subscribeToEvents(handleEvent);
    return unsubscribe;
  }, [selectedPlanId, sessionId]);

  const selectPlan = useCallback((id: string | null) => {
    setSelectedPlanId(id);
  }, []);

  const deletePlan = useCallback(
    async (id: string) => {
      try {
        await removePlan(id, sessionId);
        // State update will happen via SSE
      } catch (err) {
        console.error('Failed to remove plan:', err);
        throw err;
      }
    },
    [sessionId]
  );

  const refreshPlans = useCallback(async () => {
    try {
      const loadedPlans = await getPlans(sessionId);
      setPlans(loadedPlans);
    } catch (err) {
      console.error('Failed to refresh plans:', err);
    }
  }, [sessionId]);

  const refreshSelectedPlan = useCallback(async () => {
    if (!selectedPlanId) return;
    try {
      const plan = await getPlanById(selectedPlanId);
      setSelectedPlan(plan);
    } catch (err) {
      console.error('Failed to refresh selected plan:', err);
    }
  }, [selectedPlanId]);

  return {
    plans,
    selectedPlan,
    selectedPlanId,
    loading,
    planLoading,
    error,
    selectPlan,
    deletePlan,
    refreshPlans,
    refreshSelectedPlan,
  };
}
