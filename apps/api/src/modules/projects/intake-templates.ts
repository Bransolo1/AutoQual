export const DEFAULT_MILESTONES = [
  "Intake",
  "Study Design",
  "Recruitment Ready",
  "Fieldwork",
  "Analysis",
  "Insight Review",
  "Final Report",
  "Delivery",
] as const;

export const MILESTONE_TASK_TEMPLATES: Record<string, { title: string; description: string }[]> = {
  Intake: [
    { title: "Kickoff call", description: "Schedule and complete client kickoff." },
    { title: "Brief and objectives", description: "Capture research objectives and success criteria." },
  ],
  "Study Design": [
    { title: "Discussion guide", description: "Draft and finalize discussion guide." },
    { title: "Screener", description: "Define and approve participant screener." },
  ],
  "Recruitment Ready": [
    { title: "Recruitment panel", description: "Confirm panel and quotas." },
    { title: "Invites sent", description: "Send invitations and confirm bookings." },
  ],
  Fieldwork: [
    { title: "Conduct interviews", description: "Run AI-moderated sessions." },
    { title: "Session QA", description: "Review recordings and transcripts." },
  ],
  Analysis: [
    { title: "Thematic coding", description: "Complete theme coding and clustering." },
    { title: "Insight generation", description: "Generate and refine insights." },
  ],
  "Insight Review": [
    { title: "Internal review", description: "Team review of insight set." },
    { title: "Client review", description: "Client approval of insights." },
  ],
  "Final Report": [
    { title: "Report draft", description: "Draft executive summary and report." },
    { title: "Report approval", description: "Client sign-off on final report." },
  ],
  Delivery: [
    { title: "Export and handoff", description: "Export deliverables and hand off to client." },
  ],
};
