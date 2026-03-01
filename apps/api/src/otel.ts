import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const serviceName = process.env.OTEL_SERVICE_NAME || "sensehub-api";
const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
});

const sdk = new NodeSDK({
  traceExporter: exporter,
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start().catch((error) => {
  process.stdout.write(
    JSON.stringify({
      level: "error",
      msg: "otel_start_failed",
      error: String(error),
      timestamp: new Date().toISOString(),
    }) + "\n",
  );
});

process.on("SIGTERM", () => {
  sdk.shutdown().catch(() => undefined);
});
