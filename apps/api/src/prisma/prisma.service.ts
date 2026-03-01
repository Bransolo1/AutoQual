import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { isAuditMutationAllowed } from "../modules/audit/audit-immutability";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    this.$use(async (params, next) => {
      if (
        params.model === "AuditEvent" &&
        ["update", "delete", "deleteMany", "updateMany", "upsert"].includes(params.action)
      ) {
        if (!isAuditMutationAllowed(params.action as "update" | "delete" | "deleteMany" | "updateMany" | "upsert")) {
          throw new Error("audit_events_immutable");
        }
      }
      return next(params);
    });
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
