export type CreateAttachmentInput = {
  linkedEntityType: "project" | "task" | "study" | "insight" | "report";
  linkedEntityId: string;
  filename: string;
  storageKey: string;
};
