const winston = require("winston");
const path = require("path");
const fs = require("fs");
const config = require("../config/env");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// JSON format for file logs (no color codes)
const jsonLogFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Text format for console (with color, but clean when redirected)
const isTTY = process.stdout.isTTY;
const consoleFormat = winston.format.combine(
  // Only colorize if output is to TTY (not redirected)
  isTTY ? winston.format.colorize() : winston.format.uncolorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let msg = `${timestamp} [${service}] ${level}: ${message}`;
    if (Object.keys(meta).length > 0) {
      // Format meta objects nicely
      const metaStr = JSON.stringify(meta, null, 2);
      msg += `\n${metaStr}`;
    }
    return msg;
  })
);

const logFile = path.resolve(__dirname, config.LOG_FILE_PATH);
const errorLogFile = path.resolve(__dirname, config.LOG_ERROR_FILE_PATH);

// Check if output is redirected (when running via start-all.sh)
// If redirected, only use file transports to avoid duplicate logs and color codes
const isOutputRedirected = !process.stdout.isTTY;

const transports = [
  // File transport for all logs - JSON format only (no color codes)
  new winston.transports.File({
    filename: logFile,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: jsonLogFormat, // Pure JSON, no color codes
  }),
  // File transport for errors only
  new winston.transports.File({
    filename: errorLogFile,
    level: "error",
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: jsonLogFormat, // Pure JSON, no color codes
  }),
];

// Only add console transport if output is NOT redirected (running directly)
if (!isOutputRedirected) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// const logger = winston.createLogger({
//   level: config.LOG_LEVEL || "info",
//   format: jsonLogFormat,
//   defaultMeta: { service: "smart-builder-service" },
//   transports,
// });

// // Handle uncaught exceptions and rejections
// logger.exceptions.handle(
//   new winston.transports.File({ filename: errorLogFile })
// );

// logger.rejections.handle(
//   new winston.transports.File({ filename: errorLogFile })
// );

const logger = console;
module.exports = logger;
