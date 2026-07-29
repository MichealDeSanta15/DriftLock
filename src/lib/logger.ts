import pino from "pino";

// No transport here: pino-pretty's worker-thread transport can't resolve its
// worker module once Next.js bundles this file, which crashes every log call
// with "the worker has exited". Plain JSON logging works everywhere; pipe
// `npm run dev | npx pino-pretty` if you want colorized output locally.
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};
