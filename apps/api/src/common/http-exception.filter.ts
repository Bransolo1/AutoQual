import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { RequestContext } from "./request-context";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = RequestContext.getRequestId();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();
      const message =
        typeof errorResponse === "string"
          ? errorResponse
          : (errorResponse as { message?: string | string[] }).message ?? "Request failed";

      response.status(status).json({
        statusCode: status,
        error: exception.name,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
        requestId,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "InternalServerError",
      message: "Unexpected error",
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId,
    });
  }
}
