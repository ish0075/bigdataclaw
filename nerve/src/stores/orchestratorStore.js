import { create } from 'zustand'

/**
 * Orchestrator Store — Mission Control v2
 * Tracks multi-agent runs, tasks, artifacts, and approvals.
 */

export const useOrchestratorStore = create((set, get) => ({
  // Active and completed runs
  runs: {},
  // Current run being viewed
  activeRunId: null,
  // Live message log (like a terminal)
  messageLog: [],
  // Artifacts produced across all runs
  artifacts: [],
  // Items awaiting human approval
  approvalQueue: [],
  // Loading state for plan/execute
  isPlanning: false,
  isExecuting: false,

  // ------------------------------------------------------------------
  // Run lifecycle
  // ------------------------------------------------------------------

  startRun: (runId, goal, plan) => set((state) => ({
    runs: {
      ...state.runs,
      [runId]: {
        id: runId,
        goal,
        plan,
        status: 'running',
        stepsCompleted: 0,
        totalSteps: plan?.length || 0,
        results: {},
        artifacts: [],
        awaitingApproval: [],
        startedAt: new Date().toISOString(),
        completedAt: null,
        finalAnswer: null,
      },
    },
    activeRunId: runId,
    isExecuting: true,
  })),

  completeRun: (runId, finalAnswer) => set((state) => {
    const run = state.runs[runId]
    if (!run) return state
    return {
      runs: {
        ...state.runs,
        [runId]: {
          ...run,
          status: 'completed',
          completedAt: new Date().toISOString(),
          finalAnswer,
        },
      },
      isExecuting: false,
    }
  }),

  failRun: (runId, error) => set((state) => {
    const run = state.runs[runId]
    if (!run) return state
    return {
      runs: {
        ...state.runs,
        [runId]: {
          ...run,
          status: 'failed',
          completedAt: new Date().toISOString(),
          error,
        },
      },
      isExecuting: false,
    }
  }),

  setActiveRun: (runId) => set({ activeRunId: runId }),

  // ------------------------------------------------------------------
  // Step / result tracking
  // ------------------------------------------------------------------

  recordStepResult: (runId, step, agent, result) => set((state) => {
    const run = state.runs[runId]
    if (!run) return state
    const key = `step_${step}`
    return {
      runs: {
        ...state.runs,
        [runId]: {
          ...run,
          stepsCompleted: run.stepsCompleted + 1,
          results: {
            ...run.results,
            [key]: { agent, result, timestamp: new Date().toISOString() },
          },
        },
      },
    }
  }),

  // ------------------------------------------------------------------
  // Artifacts
  // ------------------------------------------------------------------

  addArtifact: (runId, artifact) => set((state) => {
    const run = state.runs[runId]
    if (!run) return state
    const artifactEntry = {
      id: artifact.id || `${runId}-${Date.now()}`,
      runId,
      step: artifact.step,
      agent: artifact.agent,
      ref: artifact.ref,
      content: artifact.content,
      status: artifact.requiresApproval ? 'pending_approval' : 'ready',
      createdAt: new Date().toISOString(),
    }
    return {
      runs: {
        ...state.runs,
        [runId]: {
          ...run,
          artifacts: [...run.artifacts, artifactEntry],
        },
      },
      artifacts: [artifactEntry, ...state.artifacts],
    }
  }),

  approveArtifact: (artifactId) => set((state) => ({
    artifacts: state.artifacts.map((a) =>
      a.id === artifactId ? { ...a, status: 'approved', approvedAt: new Date().toISOString() } : a
    ),
    approvalQueue: state.approvalQueue.filter((a) => a.id !== artifactId),
  })),

  rejectArtifact: (artifactId, reason) => set((state) => ({
    artifacts: state.artifacts.map((a) =>
      a.id === artifactId ? { ...a, status: 'rejected', rejectionReason: reason } : a
    ),
    approvalQueue: state.approvalQueue.filter((a) => a.id !== artifactId),
  })),

  // ------------------------------------------------------------------
  // Approval queue
  // ------------------------------------------------------------------

  queueApproval: (runId, step, agent, artifactRef) => set((state) => {
    const entry = {
      id: `${runId}-${step}`,
      runId,
      step,
      agent,
      artifactRef,
      requestedAt: new Date().toISOString(),
    }
    return {
      approvalQueue: [entry, ...state.approvalQueue],
      runs: {
        ...state.runs,
        [runId]: {
          ...state.runs[runId],
          awaitingApproval: [...(state.runs[runId]?.awaitingApproval || []), entry],
        },
      },
    }
  }),

  // ------------------------------------------------------------------
  // Message log (live feed)
  // ------------------------------------------------------------------

  addLog: (entry) => set((state) => ({
    messageLog: [entry, ...state.messageLog].slice(0, 500),
  })),

  clearLogs: () => set({ messageLog: [] }),

  // ------------------------------------------------------------------
  // Loading flags
  // ------------------------------------------------------------------

  setPlanning: (v) => set({ isPlanning: v }),
  setExecuting: (v) => set({ isExecuting: v }),

  // ------------------------------------------------------------------
  // Selectors
  // ------------------------------------------------------------------

  getRun: (runId) => get().runs[runId],
  getActiveRun: () => get().runs[get().activeRunId],
  getPendingApprovals: () => get().approvalQueue.filter((a) => !a.resolvedAt),
}))
