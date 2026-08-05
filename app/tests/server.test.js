const request = require("supertest");
const app = require("../server");

describe("Enterprise DevSecOps API", () => {

    test("GET /", async () => {
        const res = await request(app).get("/");

        expect(res.statusCode).toBe(200);
    });

    test("GET /health", async () => {
        const res = await request(app).get("/health");

        expect(res.statusCode).toBe(200);
    });

    test("GET /ready", async () => {
        const res = await request(app).get("/ready");

        expect(res.statusCode).toBe(200);
    });

    test("GET /version", async () => {
        const res = await request(app).get("/version");

        expect(res.statusCode).toBe(200);
    });

});