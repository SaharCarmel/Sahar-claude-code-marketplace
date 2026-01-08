// Test categorization
export type TestCategory = 'ui' | 'api' | 'integration' | 'edge-case' | 'data-verification';
export type TestPriority = 'critical' | 'high' | 'medium' | 'low';
export type TestStatus = 'pending' | 'passed' | 'failed' | 'skipped';
export type SessionStatus = 'active' | 'submitted' | 'archived';

// User step types - things the USER does manually
export type UserStepType = 'action' | 'observe' | 'screenshot';

export interface UserStep {
  id: string;
  type: UserStepType;
  instruction: string;      // "Click the Login button", "Verify success message"
  completed: boolean;
  // NO commands - users never run commands
}

// Auto verification - things CLAUDE runs automatically
export interface AutoVerification {
  id: string;
  description: string;      // Human-readable: "Check database for user"
  command: string;          // The actual command to run
  expectedPattern?: string; // Regex to match in output
  expectedDescription: string; // "Should return 1 row"
  // User never sees these - Claude runs them after submit
}

// Result from Claude running auto verification
export type AutoResultStatus = 'passed' | 'failed' | 'error';

export interface AutoResult {
  verificationId: string;
  status: AutoResultStatus;
  output: string;           // Actual command output
  matchResult?: 'match' | 'mismatch';
  error?: string;           // If command failed to run
  executedAt: string;
}

// Evidence uploaded by user (screenshots, observations)
export type EvidenceType = 'image' | 'text';

export interface Evidence {
  id: string;
  type: EvidenceType;
  content: string;          // Path for images, text content for observations
  label?: string;
  timestamp: string;
}

// Main Test interface with clear separation
export interface Test {
  id: string;
  title: string;
  description: string;
  category: TestCategory;
  priority: TestPriority;

  // Steps the USER performs manually
  userSteps: UserStep[];

  // Verifications CLAUDE runs automatically after user submits
  autoVerifications: AutoVerification[];

  // User's manual test result
  userResult: TestStatus;
  userRemarks: string;
  userEvidence: Evidence[];

  // Claude's automated verification results (populated after submit)
  autoResults?: AutoResult[];

  updatedAt?: string;
}

// Session summary with both manual and auto results
export interface TestSummary {
  // Manual testing by user
  manualTotal: number;
  manualPassed: number;
  manualFailed: number;
  manualSkipped: number;

  // Automated verification by Claude
  autoTotal: number;
  autoPassed: number;
  autoFailed: number;
  autoErrors: number;
}

export interface TestSession {
  id: string;
  feature: string;
  mode: 'webapp' | 'linear';
  linearIssueId?: string;
  tests: Test[];
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  summary?: TestSummary;
}

// Results format for Claude to analyze
export interface FailureDetail {
  testId: string;
  title: string;
  description: string;

  // User's feedback
  userResult: TestStatus;
  userRemarks: string;
  userEvidence: Evidence[];

  // Auto verification results
  autoResults?: AutoResult[];

  category: TestCategory;
  priority: TestPriority;
}

export interface TestResults {
  sessionId: string;
  feature: string;
  status: SessionStatus;
  summary: TestSummary;

  // Tests where user marked as failed OR auto verification failed
  failures: FailureDetail[];

  // Lists for quick reference
  manualPassed: string[];
  manualFailed: string[];
  manualSkipped: string[];
  autoPassed: string[];
  autoFailed: string[];

  submittedAt?: string;
}
