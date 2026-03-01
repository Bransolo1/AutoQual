import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      const log = {
        level: "info",
        msg: "request",
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        durationMs: duration,
        timestamp: new Date().toISOString(),
      };
      process.stdout.write(JSON.stringify(log) + "\n");
    });
    next();
  }
}
