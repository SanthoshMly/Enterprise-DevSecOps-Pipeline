require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const pino = require("pino");
const client = require("prom-client");

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    base: { service: process.env.APP_NAME || "app" }
});

const metricsRegistry = new client.Registry();
client.collectDefaultMetrics({ register: metricsRegistry });

const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [metricsRegistry]
});

const app = express();

// Trust the first hop (Ingress/load balancer) so req.ip and rate limiting
// see the real client address instead of the proxy's address.
app.set("trust proxy", 1);

// Security Headers
app.use(helmet());

// Prometheus Metrics Collection
// req.route is only populated once Express finishes matching a route, so
// the label is read in the "finish" handler, not at request start.
app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
        const route = req.route ? req.baseUrl + req.route.path : req.path;

        httpRequestDuration.observe(
            { method: req.method, route, status_code: res.statusCode },
            durationSeconds
        );
    });

    next();
});

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

// Prometheus Metrics
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
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

module.exports = { app, logger, errorHandler, metricsRegistry };
