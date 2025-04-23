const request = require("supertest");
const chai = require("chai");
const expect = chai.expect;

const superAdmin = {
  username: "super_admin",
  password: "pw123456",
  email: "super_admin@email.com",
};

describe("ClipController", function () {
  let auth;

  before(async () => {
    const loggedInAdmin = await request(sails.hooks.http.app)
      .post("/user/login")
      .send(superAdmin);
    auth = `Bearer ${loggedInAdmin.body["accessToken"]}`;
  });

  describe("findAll", function () {
    it("should return clips", async () => {
      const res = await request(sails.hooks.http.app)
        .get("/clips")
        .set("Authorization", auth)
        .expect(200)

      expect(res.body).to.have.property("clips");
    });
  });

  describe("find", function () {
    it("should return specific clip", async () => {
      const res = await request(sails.hooks.http.app)
        .get("/clip/22")
        .set("Authorization", auth)
        .expect(200)

      expect(res.body).to.have.property("clip");
    });
  });
});
