import { SecretsProvider } from "./secrets-provider";

export class VaultSecretsProvider implements SecretsProvider {
  name = "vault";

  async health() {
    const addr = process.env.VAULT_ADDR;
    if (!addr) {
      return {
        provider: this.name,
        status: "error",
        message: "VAULT_ADDR not configured.",
      };
    }

    try {
      const headers: Record<string, string> = {};
      if (process.env.VAULT_TOKEN) {
        headers["X-Vault-Token"] = process.env.VAULT_TOKEN;
      }
      const res = await fetch(`${addr.replace(/\/$/, "")}/v1/sys/health`, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        return {
          provider: this.name,
          status: "error",
          message: `Vault health check failed (${res.status})`,
        };
      }

      return {
        provider: this.name,
        status: "ready",
        message: "Vault health check passed.",
      };
    } catch (error) {
      return {
        provider: this.name,
        status: "error",
        message: `Vault health check failed: ${String(error)}`,
      };
    }
  }
}
