export type CreateStoryInput = {
  studyId: string;
  type: "article" | "video" | "podcast";
  title: string;
  summary?: string;
  content: string;
  mediaUrl?: string;
};

export type GenerateStoryInput = {
  studyId: string;
};
