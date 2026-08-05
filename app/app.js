require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const pino = require("pino");

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    base: { service: process.env.APP_NAME || "app" }
});

const app = express();

// Trust the first hop (Ingress/load balancer) so req.ip and rate limiting
// see the real client address instead of the proxy's address.
app.set("trust proxy", 1);

// Security Headers
app.use(helmet());

// Parse JSON
app.use(express.json());

// Structured (JSON) HTTP Access Logging
app.use(
    morgan((tokens, req, res) =>
        JSON.stringify({
            time: tokens.date(req, res, "iso"),
            method: tokens.method(req, res),
            url: tokens.url(req, res),
            status: Number(tokens.status(req, res)),
            responseTimeMs: Number(tokens["response-time"](req, res)),
            contentLength: tokens.res(req, res, "content-length"),
            remoteAddr: tokens["remote-addr"](req, res)
        })
    )
);

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);

// Root Endpoint
app.get("/", (req, res) => {
    res.json({
        application: process.env.APP_NAME,
        version: process.env.APP_VERSION,
        environment: process.env.NODE_ENV,
        status: "Running"
    });
});

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "Healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Readiness Check
app.get("/ready", (req, res) => {
    res.status(200).json({
        ready: true
    });
});

// Version
app.get("/version", (req, res) => {
    res.json({
        version: process.env.APP_VERSION
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: "Route Not Found"
    });
});

// Global Error Handler
const errorHandler = (err, req, res, _next) => {
    logger.error({ err }, "Unhandled request error");

    res.status(500).json({
        error: "Internal Server Error"
    });
};

app.use(errorHandler);

module.exports = { app, logger, errorHandler };
