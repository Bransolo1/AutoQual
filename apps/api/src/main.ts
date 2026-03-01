import "./otel";
import { randomUUID } from "crypto";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AuthGuard } from "./auth/auth.guard";
import { WorkspaceGuard } from "./auth/workspace.guard";

function bootstrap() {
  return NestFactory.create(AppModule, {
    bufferLogs: true,
  }).then(async (app) => {
    const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    app.enableCors({
      origin: corsOrigins.length ? corsOrigins : true,
      credentials: true,
    });
    app.use(helmet());
    app.use((req, res, next) => {
      const requestId = req.headers["x-request-id"]?.toString() ?? randomUUID();
      res.setHeader("x-request-id", requestId);
      next();
    });
    app.getHttpAdapter().getInstance().disable("x-powered-by");
    const authGuard = app.get(AuthGuard);
    const workspaceGuard = app.get(WorkspaceGuard);
    app.useGlobalGuards(authGuard, workspaceGuard);
    await app.listen(4000);
    const log = (obj: Record<string, unknown>) =>
      process.stdout.write(JSON.stringify({ ...obj, timestamp: new Date().toISOString() }) + "\n");
    log({ level: "info", msg: "API started", port: 4000 });
  });
}

bootstrap();
