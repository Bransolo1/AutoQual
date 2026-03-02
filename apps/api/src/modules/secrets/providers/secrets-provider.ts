export type SecretsHealth = {
  provider: string;
  status: "ready" | "error" | "stubbed";
  message: string;
};

export interface SecretsProvider {
  name: string;
  health(): Promise<SecretsHealth>;
}
