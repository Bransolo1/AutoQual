import { SetMetadata } from "@nestjs/common";

export const SkipBillingCheck = () => SetMetadata("skipBillingCheck", true);
