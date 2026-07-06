import {describe, expect, it} from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";

describe("POST auth/register", () => {
    describe("Given all fields", () => {

        it("should return the 201 status code", async () => {
        const userData = {
            firstName: "Rakesh",
            lastName: "k",
            email: "rakesh@gmail.com",
            password: "secret"
        }
        const response = await request(app).post("/auth/register").send(userData);
        expect(response.statusCode).toBe(201);
        })

        it("should return the valid json response", async () => {
        const userData = {
            firstName: "Rakesh",
            lastName: "k",
            email: "rakesh@gmail.com",
            password: "secret"
        }
        const response = await request(app).post("/auth/register").send(userData);
        expect(response.headers["content-type"]).toEqual(expect.stringContaining("json"));
        })
    });
    describe("Fields are missing", () => {});
})