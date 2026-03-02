import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { isAuditMutationAllowed } from "../modules/audit/audit-immutability";
import { RequestContext } from "../common/request-context";
import { createHash } from "crypto";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    const prisma = this as unknown as {
      $use?: (cb: (params: Record<string, any>, next: (params: Record<string, any>) => Promise<any>) => Promise<any>) => void;
    };
    if (typeof prisma.$use === "function") {
      prisma.$use(async (params, next) => {
        if (
          params.model === "AuditEvent" &&
          ["update", "delete", "deleteMany", "updateMany", "upsert"].includes(params.action)
        ) {
          if (!isAuditMutationAllowed(params.action as "update" | "delete" | "deleteMany" | "updateMany" | "upsert")) {
            throw new Error("audit_events_immutable");
          }
        }
        if (params.model === "AuditEvent" && params.action === "create") {
          const requestId = RequestContext.getRequestId();
          if (requestId && params.args?.data && !params.args.data.requestId) {
            params.args.data.requestId = requestId;
          }
          if (params.args?.data?.metadata) {
            const before = params.args.data.metadata.before ?? null;
            const after = params.args.data.metadata.after ?? null;
            const beforeHash = before ? this.hashPayload(before) : null;
            const afterHash = after ? this.hashPayload(after) : null;
            const integrity = this.hashPayload({
              action: params.args.data.action,
              entityType: params.args.data.entityType,
              entityId: params.args.data.entityId,
              beforeHash,
              afterHash,
              requestId: params.args.data.requestId ?? null,
              createdAt: params.args.data.createdAt ?? null,
            });
            params.args.data.beforeHash = beforeHash;
            params.args.data.afterHash = afterHash;
            params.args.data.integrityHash = integrity;
          }
        }
        return next(params);
      });
    }
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private hashPayload(payload: unknown) {
    const encoded = JSON.stringify(payload);
    return createHash("sha256").update(encoded).digest("hex");
  }
}
