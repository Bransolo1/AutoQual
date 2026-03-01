export type CreateActivationMetricInput = {
  workspaceId: string;
  projectId: string;
  studyId?: string;
  deliverableType: "report" | "deliverable_pack" | "story";
  deliverableId?: string;
  views?: number;
  shares?: number;
  decisionsLogged?: number;
};
