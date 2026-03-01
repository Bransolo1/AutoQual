export type CreateNotificationInput = {
  userId: string;
  type: string;
  payload: Record<string, unknown>;
};
