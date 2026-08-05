const { app, logger } = require("./app");

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

// Fail fast on programmer errors instead of continuing in a corrupted
// state — Kubernetes will restart the pod per the liveness probe.
process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception, shutting down");
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled promise rejection, shutting down");
    process.exit(1);
});

// Stop accepting new connections and let in-flight requests finish
// before exiting, so rolling updates don't drop traffic.
const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
    });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
