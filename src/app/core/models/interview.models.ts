export interface CreateInterviewRequest {
  targetRole: string;
  seniority: string;
  mode: string;
  skills: string[];
  focusAreas: string[];
}

export interface QuestionPayload {
  id: string;
  title: string;
  prompt: string;
  mode: string;
  difficulty: string;
  seniority: string;
  tags: string[];
  expectedConcepts: string[];
  rubric: Record<string, number>;
  version: number;
}

export interface EvaluationSummary {
  evaluationId: string;
  totalScore: number;
  rubricScores: Record<string, number>;
  strengths: string[];
  gaps: string[];
  followUpQuestion: string | null;
}

export interface InterviewSessionResponse {
  sessionId: string;
  ownerId: string;
  targetRole: string;
  state: string;
  mode: string;
  seniority: string;
  difficulty: string;
  stateVersion: number;
  skills: string[];
  focusAreas: string[];
  currentQuestion: QuestionPayload | null;
  lastEvaluation: EvaluationSummary | null;
}

export interface AnswerSubmissionResponse {
  interactionId: string;
  session: InterviewSessionResponse;
  evaluation: EvaluationSummary;
}

export interface FeedbackResponse {
  sessionId: string;
  summary: string;
  overallScore: number | null;
  strengths: string[];
  gaps: string[];
  followUpQuestion: string | null;
}

export interface SessionEventResponse {
  eventVersion: number;
  eventType: string;
  payload: Record<string, unknown>;
}

// ── Dashboard ──────────────────────────────────────────────────────

export interface DashboardSessionSummary {
  sessionId: string;
  targetRole: string;
  mode: string;
  seniority: string;
  state: string;
  overallScore: number | null;
  summary: string;
  stateVersion: number;
  createdAt: string;
  completedAt: string | null;
}

// ── Enhanced Session Feedback ──────────────────────────────────────

export interface SessionFeedbackResponse {
  sessionId: string;
  targetRole: string;
  mode: string;
  seniority: string;
  overallReadiness: string;
  overallScore: number;
  rounds: RoundFeedback[];
  topicMastery: Record<string, TopicMastery>;
  strengths: string[];
  areasForGrowth: string[];
  recommendedPractice: string[];
  createdAt: string;
  completedAt: string | null;
}

export interface RoundFeedback {
  questionId: string;
  questionTitle: string;
  score: number;
  rubricScores: Record<string, number>;
  strengths: string[];
  gaps: string[];
  mode: string;
}

export interface TopicMastery {
  topic: string;
  averageScore: number;
  questionCount: number;
  band: string;
}
