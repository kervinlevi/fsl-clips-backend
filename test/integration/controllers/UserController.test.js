const request = require("supertest");
const chai = require("chai");
const expect = chai.expect;

const testUser = {
  username: "test_user",
  password: "pw123456",
  email: "test_user@email.com",
};

const registeredUser = {
  username: "registered_user",
  password: "pw123456",
  email: "registered_user@email.com",
};

const unregisteredUser = {
  username: "unregistered_user",
  password: "wrongpw123456",
  email: "not_registered_user@email.com",
};


describe("UserController", function () {
  before(async () => {
    const tryFind = await User.findOne({
      username: registeredUser.username,
    });
    if (!tryFind) {
      await request(sails.hooks.http.app)
        .post("/user/create")
        .send(registeredUser);
    }
  });

  after(async () => {
    await User.destroy({ email: testUser.email });
  });

  describe("create", function () {
    it("should fail if username is missing", async () => {
      const res = await request(sails.hooks.http.app)
        .post("/user/create")
        .send({ ...testUser, username: " " })
        .expect(400);

      expect(res.body.error).to.equal("Username is required.");
    });

    it("should fail if username is too short", async () => {
      const res = await request(sails.hooks.http.app)
        .post("/user/create")
        .send({ ...testUser, username: "abc" })
        .expect(400);

      expect(res.body.error).to.equal("Username must be 6 to 20 characters.");
    });

    it("should fail if username has invalid characters", async () => {
      const res = await request(sails.hooks.http.app)
        .post("/user/create")
        .send({ ...testUser, username: "bad$username" })
        .expect(400);

      expect(res.body.error).to.equal(
        "Username can contain alphabet, numeric, and _ only."
      );
    });

    it("should fail if email is too long", async () => {
      const longEmail = "a".repeat(51) + "@example.com";
      const res = await request(sails.hooks.http.app)
        .post("/user/create")
        .send({ ...testUser, email: longEmail })
        .expect(400);

      expect(res.body.error).to.equal(
        "Email address must be up to 50 characters only."
      );
    });

    it("should fail if email is invalid", async () => {
      const res = await request(sails.hooks.http.app)
        .post("/user/create")
        .send({ ...testUser, email: "invalid-email" })
        .expect(400);

      expect(res.body.error).to.equal("Invalid email address.");
    });

    it("should fail if password is missing or short", async () => {
      const res = await request(sails.hooks.http.app)
        .post("/user/create")
        .send({ ...testUser, password: "short" })
        .expect(400);

      expect(res.body.error).to.equal(
        "Password must be at least 8 characters long."
      );
    });

    it("should fail if password lacks number or letter", async () => {
      const res = await request(sails.hooks.http.app)
        .post("/user/create")
        .send({ ...testUser, password: "12345678" })
        .expect(400);

      expect(res.body.error).to.include("Password must contain");
    });

    it("should create a new user, return tokens", async () => {
      const res = await request(sails.hooks.http.app)
        .post("/user/create")
        .send(testUser)
        .expect(200);

      expect(res.body).to.have.property("user_id");
      expect(res.body).to.have.property("email", testUser.email);
      expect(res.body).to.have.property("type");
      expect(res.body).to.have.property("accessToken");
      expect(res.body).to.have.property("refreshToken");

      await request(sails.hooks.http.app)
        .delete("/self/delete")
        .set("Authorization", `Bearer ${res.body["accessToken"]}`)
        .expect(200);
    });
  });

  describe("login", function () {
    it("should return access and refresh tokens on valid login", async () => {
      const res = await request(sails.hooks.http.app)
        .post("/user/login")
        .send(registeredUser)
        .expect(200);

      expect(res.body).to.have.property("accessToken");
      expect(res.body).to.have.property("refreshToken");
      expect(res.body).to.have.property("email", registeredUser.email);
      expect(res.body).to.have.property("user_id");
      expect(res.body).to.have.property("type");
    });

    it("should return 400 if user is not found", async () => {
      const res = await request(sails.hooks.http.app)
        .post("/user/login")
        .send({ 
          email: unregisteredUser.email,
          password: unregisteredUser.password
        })
        .expect(400);

      expect(res.body.error).to.equal("User not found.");
    });

    it("should return 400 if password is incorrect", async () => {
      const res = await request(sails.hooks.http.app)
        .post("/user/login")
        .send({ 
          email: registeredUser.email,
          password: unregisteredUser.password
        })
        .expect(400);

      expect(res.body.error).to.equal("Incorrect email or password.");
    });
    
  });
});
