#!/usr/bin/env node
/**
 * Fetch pending feedback for plans
 * Usage: node get-feedback.js [--all] [--mine]
 *
 * Options:
 *   --all   Return all feedback including resolved
 *   --mine  Only show feedback for plans pushed by this session
 *
 * Fetches feedback from the running web server's API
 */

import { loadConfig, getSessionId, getServerInfo } from './lib/config-store.js';

export default async function getFeedback(args) {
  const all = args.includes('--all');
  const mine = args.includes('--mine');

  const config = await loadConfig();
  const sessionId = await getSessionId();
  const serverInfo = await getServerInfo();

  if (!serverInfo) {
    console.error(
      JSON.stringify({ error: 'Server not running. Run start-server first.' })
    );
    process.exit(1);
  }

  try {
    // Fetch plans from queue
    const plansUrl = `${serverInfo.url}/api/plans?sessionId=${encodeURIComponent(sessionId)}`;
    const plansResponse = await fetch(plansUrl);

    if (!plansResponse.ok) {
      throw new Error(`Failed to fetch plans: HTTP ${plansResponse.status}`);
    }

    const { plans } = await plansResponse.json();

    // Filter to own plans if --mine flag
    const relevantPlans = mine
      ? plans.filter((p) => p.sessionId === sessionId)
      : plans;

    if (relevantPlans.length === 0) {
      console.log(
        JSON.stringify({
          sessionId,
          plans: [],
          message: mine
            ? 'No plans pushed by this session'
            : 'No plans in queue'
        })
      );
      return;
    }

    // Fetch full details for each plan
    const detailedPlans = await Promise.all(
      relevantPlans.map(async (plan) => {
        try {
          const planResponse = await fetch(`${serverInfo.url}/api/plans/${plan.id}`);
          if (!planResponse.ok) {
            return null;
          }
          const { plan: fullPlan } = await planResponse.json();

          const openComments = fullPlan.comments.filter((c) => c.status === 'OPEN');
          const unacknowledgedComments = fullPlan.comments.filter((c) => !c.acknowledged);
          const unacknowledgedAnswers = fullPlan.answers.filter((a) => !a.acknowledged);
          const pendingQuestions = fullPlan.questions.filter((q) => q.status === 'PENDING');

          return {
            planId: plan.id,
            planPath: plan.path,
            planTitle: plan.title,
            isOwn: plan.isOwn,
            pushedAt: plan.pushedAt,
            pending: all
              ? {
                  comments: fullPlan.comments,
                  questions: fullPlan.questions,
                  answers: fullPlan.answers
                }
              : {
                  comments: unacknowledgedComments,
                  answers: unacknowledgedAnswers
                },
            summary: {
              totalComments: fullPlan.comments.length,
              openComments: openComments.length,
              unacknowledgedComments: unacknowledgedComments.length,
              pendingQuestions: pendingQuestions.length,
              unacknowledgedAnswers: unacknowledgedAnswers.length
            }
          };
        } catch (err) {
          console.error(`Failed to fetch plan ${plan.id}:`, err.message);
          return null;
        }
      })
    );

    // Filter out failed fetches
    const validPlans = detailedPlans.filter((p) => p !== null);

    // Calculate totals
    const totals = {
      totalPlans: validPlans.length,
      ownPlans: validPlans.filter((p) => p.isOwn).length,
      totalOpenComments: validPlans.reduce((sum, p) => sum + p.summary.openComments, 0),
      totalUnacknowledgedComments: validPlans.reduce(
        (sum, p) => sum + p.summary.unacknowledgedComments,
        0
      ),
      totalUnacknowledgedAnswers: validPlans.reduce(
        (sum, p) => sum + p.summary.unacknowledgedAnswers,
        0
      )
    };

    const result = {
      sessionId,
      totals,
      plans: validPlans
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}
