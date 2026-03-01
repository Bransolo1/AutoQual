import { Injectable } from "@nestjs/common";

@Injectable()
export class SecretsService {
  health() {
    const provider = process.env.SECRETS_PROVIDER ?? "env";
    return {
      provider,
      status: provider === "vault" ? "stubbed" : "ready",
      message:
        provider === "vault"
          ? "Vault integration placeholder. Configure VAULT_ADDR and credentials."
          : "Environment-based secrets active.",
    };
  }
}
