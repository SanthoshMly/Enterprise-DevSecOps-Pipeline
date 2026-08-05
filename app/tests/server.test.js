const request = require("supertest");
const { app, errorHandler } = require("../app");

describe("Enterprise DevSecOps API", () => {

    test("GET / returns application metadata", async () => {
        const res = await request(app).get("/");

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            application: process.env.APP_NAME,
            version: process.env.APP_VERSION,
            environment: process.env.NODE_ENV,
            status: "Running"
        });
    });

    test("GET /health reports healthy status with uptime", async () => {
        const res = await request(app).get("/health");

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe("Healthy");
        expect(typeof res.body.uptime).toBe("number");
        expect(typeof res.body.timestamp).toBe("string");
    });

    test("GET /ready reports readiness", async () => {
        const res = await request(app).get("/ready");

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ ready: true });
    });

    test("GET /version returns the app version", async () => {
        const res = await request(app).get("/version");

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ version: process.env.APP_VERSION });
    });

    test("GET /unknown-route returns 404", async () => {
        const res = await request(app).get("/unknown-route");

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: "Route Not Found" });
    });

    test("security headers are set by Helmet", async () => {
        const res = await request(app).get("/health");

        expect(res.headers["x-content-type-options"]).toBe("nosniff");
        expect(res.headers["x-powered-by"]).toBeUndefined();
    });

    test("errorHandler logs the error and returns a generic 500", () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        errorHandler(new Error("boom"), {}, res, () => {});

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
    });

});