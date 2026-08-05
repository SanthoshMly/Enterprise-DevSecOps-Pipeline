require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();

const PORT = process.env.PORT || 3001;

// Security Headers
app.use(helmet());

// Parse JSON
app.use(express.json());

// HTTP Request Logging
app.use(morgan("combined"));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
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
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        error: "Internal Server Error"
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;