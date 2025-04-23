const request = require("supertest");
const { expect } = require("chai");

describe("SettingsController", function () {
  
  describe("fetch", function () {
    it("should fetch settings successfully", async function () {
      const res = await request(sails.hooks.http.app)
        .get("/settings")
        .expect(200);

      expect(res.body).to.be.an("object");
    });
  });

  describe("update", function () {
    it("should return token error when no authorization provided", async function () {
      const res = await request(sails.hooks.http.app)
        .post("/settings")
        .send({ quiz_enabled: true, clips_before_quiz: 10 })
        .expect(400);

      expect(res.body.error).to.equal("Token not found");
    });
  });
});
