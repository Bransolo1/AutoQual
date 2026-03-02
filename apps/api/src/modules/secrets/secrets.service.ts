import { Injectable } from "@nestjs/common";
import { EnvSecretsProvider } from "./providers/env-secrets.provider";
import { VaultSecretsProvider } from "./providers/vault-secrets.provider";
import { SecretsProvider } from "./providers/secrets-provider";

@Injectable()
export class SecretsService {
  private providers: Record<string, SecretsProvider> = {
    env: new EnvSecretsProvider(),
    vault: new VaultSecretsProvider(),
  };

  async health() {
    const providerKey = process.env.SECRETS_PROVIDER ?? "env";
    const provider = this.providers[providerKey] ?? this.providers.env;
    return provider.health();
  }
}
