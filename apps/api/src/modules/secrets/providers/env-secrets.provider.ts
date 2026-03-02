import { SecretsProvider } from "./secrets-provider";

export class EnvSecretsProvider implements SecretsProvider {
  name = "env";

  async health() {
    return {
      provider: this.name,
      status: "ready",
      message: "Environment-based secrets active.",
    };
  }
}
