import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { isAuditMutationAllowed } from "../modules/audit/audit-immutability";
import { RequestContext } from "../common/request-context";

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
        }
        return next(params);
      });
    }
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
