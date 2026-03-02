export type CreateStoryInput = {
  studyId: string;
  type: "article" | "showreel" | "podcast" | "slide";
  title: string;
  summary?: string;
  content: string;
  mediaUrl?: string;
};

export type GenerateStoryInput = {
  studyId: string;
};
