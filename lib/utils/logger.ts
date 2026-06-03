type LogLevel = "info" | "warn" | "error";

async function writeLogFile(line: string) {
  if (typeof window !== "undefined") {
    return;
  }

  try {
    const { appendFile, mkdir } = await import("fs/promises");
    const { join } = await import("path");
    const logsDir = join(process.cwd(), "logs");
    await mkdir(logsDir, { recursive: true });
    await appendFile(join(logsDir, "app.log"), `${line}\n`, "utf8");
    await appendFile(join(logsDir, "business.log"), `${line}\n`, "utf8");
    if (line.includes('"level":"error"')) {
      await appendFile(join(logsDir, "errors.log"), `${line}\n`, "utf8");
    }
  } catch {
    // Keep logging non-blocking even if file writes fail.
  }
}

function log(level: LogLevel, event: string, context?: Record<string, unknown>) {
  const isProduction = process.env.NODE_ENV === "production";
  
  // 🚀 Optimization: Skip non-error file logging in production to save I/O
  if (isProduction && level === "info") {
    console.info(`[INFO] ${event}`, context ? JSON.stringify(context) : "");
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(context ?? {}),
  };
  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    void writeLogFile(line);
    return;
  }
  
  if (level === "warn") {
    console.warn(line);
    if (!isProduction) void writeLogFile(line);
    return;
  }

  console.info(line);
  if (!isProduction) void writeLogFile(line);
}

export const logger = {
  info: (event: string, context?: Record<string, unknown>) => log("info", event, context),
  warn: (event: string, context?: Record<string, unknown>) => log("warn", event, context),
  error: (event: string, context?: Record<string, unknown>) => log("error", event, context),
};
