import * as fs from "fs";
import * as path from "path";

export class Logger {
  private static logFilePath: string = path.join(process.cwd(), "logs", "app.log");
  private static stream: fs.WriteStream | null = null;

  /**
   * Override the default log file path. Call once at application startup.
   * In deployed Cloud Functions only /tmp is writable.
   */
  static configure(filePath: string): void {
    Logger.stream?.end();
    Logger.stream = null;
    Logger.logFilePath = filePath;
  }

  private static getStream(): fs.WriteStream {
    if (!Logger.stream) {
      fs.mkdirSync(path.dirname(Logger.logFilePath), { recursive: true });
      Logger.stream = fs.createWriteStream(Logger.logFilePath, { flags: "a" });
    }
    return Logger.stream;
  }

  constructor(private readonly component: string) {}

  private timestamp(): string {
    return new Date().toISOString();
  }

  private prefix(level: string): string {
    return `[${this.timestamp()}] [${level}] [${this.component}]`;
  }

  private formatArg(arg: unknown): string {
    if (arg instanceof Error) return arg.stack ?? arg.message;
    if (typeof arg === "object" && arg !== null) {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }

  private writeToFile(prefix: string, message: string, args: unknown[]): void {
    const extras = args.length ? " " + args.map((a) => this.formatArg(a)).join(" ") : "";
    Logger.getStream().write(`${prefix} ${message}${extras}\n`);
  }

  log(message: string, ...args: unknown[]): void {
    const prefix = this.prefix("LOG");
    console.log(prefix, message, ...args);
    this.writeToFile(prefix, message, args);
  }

  info(message: string, ...args: unknown[]): void {
    const prefix = this.prefix("INFO");
    console.info(prefix, message, ...args);
    this.writeToFile(prefix, message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    const prefix = this.prefix("WARN");
    console.warn(prefix, message, ...args);
    this.writeToFile(prefix, message, args);
  }

  error(message: string, ...args: unknown[]): void {
    const prefix = this.prefix("ERROR");
    console.error(prefix, message, ...args);
    this.writeToFile(prefix, message, args);
  }

  debug(message: string, ...args: unknown[]): void {
    const prefix = this.prefix("DEBUG");
    console.debug(prefix, message, ...args);
    this.writeToFile(prefix, message, args);
  }
}
