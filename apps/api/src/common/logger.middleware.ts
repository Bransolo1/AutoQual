import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { RequestContext } from "./request-context";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      const requestId = RequestContext.getRequestId();
      const log = {
        level: "info",
        msg: "request",
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        durationMs: duration,
        requestId,
        timestamp: new Date().toISOString(),
      };
      process.stdout.write(JSON.stringify(log) + "\n");
    });
    next();
  }
}
