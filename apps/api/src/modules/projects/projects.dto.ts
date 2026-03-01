export type CreateProjectInput = {
  workspaceId: string;
  name: string;
  description: string;
  status: "planned" | "active" | "on_hold" | "complete" | "cancelled";
  ownerUserId: string;
  clientOrgName: string;
  startDate: string;
  targetDeliveryDate: string;
  tags: string[];
};

export type UpdateShareChecklistInput = {
  workspaceId: string;
  actorUserId: string;
  items: Record<string, boolean>;
};
