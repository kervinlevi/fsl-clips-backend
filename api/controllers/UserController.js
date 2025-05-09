const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const checkAdmin = sails.helpers.auth.checkAdmin;
const checkUser = sails.helpers.auth.checkUser;

const usernameRegex = /^[a-zA-Z0-9_]{6,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[0-9])(?=.*[a-zA-Z]).{8,}$/;

module.exports = {
  // Registration endpoint
  create: async function (req, res) {
    try {
      let { username, password, email } = req.body;
      username = username.trim();

      if (!username) {
        return res.badRequest({ error: "Username is required." });
      }

      if (username.length < 6 || username.length > 20) {
        return res.badRequest({
          error: "Username must be 6 to 20 characters.",
        });
      }

      if (!usernameRegex.test(username)) {
        return res.badRequest({
          error: "Username can contain alphabet, numeric, and _ only.",
        });
      }

      if (email.length > 50) {
        return res.badRequest({
          error: "Email address must be up to 50 characters only.",
        });
      }

      if (!emailRegex.test(email)) {
        return res.badRequest({
          error: "Invalid email address.",
        });
      }

      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.badRequest({ error: "Username is already taken." });
      }
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.badRequest({ error: "Email address is already taken." });
      }

      if (!password || password.length < 8) {
        return res.badRequest({
          error: "Password must be at least 8 characters long.",
        });
      }

      if (!passwordRegex.test(password)) {
        return res.badRequest({
          error:
            "Password must contain at least one number and one alphabet character.",
        });
      }
      const newUser = await User.create({ username, password, email }).fetch();

      // Generate access token and refresh token
      const accessToken = jwt.sign(
        { id: newUser.user_id },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );
      const refreshToken = jwt.sign(
        { id: newUser.user_id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        user_id: newUser.user_id,
        email: newUser.email,
        type: newUser.type,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (error) {
      return res.serverError(error);
    }
  },

  // Sign in endpoint
  login: async function (req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.badRequest({ error: "User not found." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.badRequest({ error: "Incorrect email or password." });
      }

      // Generate access token and refresh token
      const accessToken = jwt.sign(
        { id: user.user_id },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );
      const refreshToken = jwt.sign(
        { id: user.user_id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        user_id: user.user_id,
        email: user.email,
        type: user.type,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (error) {
      return res.serverError(error);
    }
  },

  // Get all users
  findAll: async function (req, res) {
    try {
      const { authError } = await checkAdmin.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }

      const usersFromDb = await User.find();
      const users = _.map(usersFromDb, (user) => _.omit(user, ["password"]));

      return res.json({ users });
    } catch (error) {
      return res.serverError({ error: "Unable to fetch all users" });
    }
  },

  // Retrieve a user's detail
  find: async function (req, res) {
    try {
      const { authError } = await checkAdmin.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }

      const user_id = _.toNumber(req.param("user_id"));
      if (_.isNaN(user_id)) {
        return res.badRequest({
          error: `Invalid user_id param ${JSON.stringify(
            req.param("user_id")
          )}.`,
        });
      }

      const userFromDb = await User.findOne({ user_id });
      if (!userFromDb) {
        return res.badRequest({
          error: `User with id ${user_id} does not exist.`,
        });
      }
      const user = _.omit(userFromDb, ["password"]);

      return res.json({ user });
    } catch (error) {
      return res.serverError(error);
    }
  },

  // Update a user's email, username, and type
  update: async function (req, res) {
    try {
      const { authError } = await checkAdmin.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }

      const user_id = _.toNumber(req.param("user_id"));
      if (_.isNaN(user_id)) {
        return res.badRequest({
          error: `Invalid user_id param ${JSON.stringify(
            req.param("user_id")
          )}.`,
        });
      }

      let { username, email, type } = req.allParams();
      username = username.trim();

      if (!username) {
        return res.badRequest({ error: "Username is required." });
      }

      if (username.length < 6 || username.length > 20) {
        return res.badRequest({
          error: "Username must be 6 to 20 characters.",
        });
      }

      if (!usernameRegex.test(username)) {
        return res.badRequest({
          error: "Username can contain alphabet, numeric, and _ only.",
        });
      }

      if (email.length > 50) {
        return res.badRequest({
          error: "Email address must be up to 50 characters only.",
        });
      }

      if (!emailRegex.test(email)) {
        return res.badRequest({
          error: "Invalid email address.",
        });
      }

      const existingUsername = await User.findOne({
        where: { username: username, user_id: { "!=": user_id } },
      });
      if (existingUsername) {
        return res.badRequest({ error: "Username is already taken." });
      }
      const existingEmail = await User.findOne({
        where: { email: email, user_id: { "!=": user_id } },
      });
      if (existingEmail) {
        return res.badRequest({ error: "Email address is already taken." });
      }

      const updatedUser = await User.updateOne({ user_id })
        .set({
          username,
          email,
          type,
        })
        .catch((err) => {
          return res.badRequest({
            error: `Failed to update user with id ${user_id}.`,
          });
        });

      if (!updatedUser) {
        return res.badRequest({
          error: `User with id ${user_id} does not exist.`,
        });
      }
      const user = _.omit(updatedUser, ["password"]);
      return res.json({ user });
    } catch (error) {
      return res.serverError(error);
    }
  },

  // Delete a user
  delete: async function (req, res) {
    try {
      const { admin, authError } = await checkAdmin.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }

      const user_id = _.toNumber(req.param("user_id"));
      if (_.isNaN(user_id)) {
        return res.badRequest({
          error: `Invalid user_id param ${JSON.stringify(
            req.param("user_id")
          )}.`,
        });
      }

      if (admin.user_id === user_id) {
        return res.badRequest({ error: "Operation not allowed." });
      }

      const deletedUser = await User.destroyOne({ user_id });
      if (!deletedUser) {
        return res.badRequest({
          error: `User with id ${user_id} does not exist.`,
        });
      }
      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      return res.serverError(error);
    }
  },

  // Refresh user's JWT token
  refreshToken: async function (req, res) {
    const { refreshToken } = req.body;
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const user = await User.findOne({ user_id: decoded.id });

      if (!user) return res.unauthorized({ error: "Invalid refresh token" });

      // Generate access token and refresh token
      const newAccessToken = jwt.sign(
        { id: user.user_id },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );
      const newRefreshToken = jwt.sign(
        { id: user.user_id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        user_id: user.user_id,
        email: user.email,
        type: user.type,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (err) {
      return res.unauthorized({ error: "Invalid refresh token" });
    }
  },

  // Retrieve self account's detail
  findSelf: async function (req, res) {
    try {
      const { user, authError } = await checkUser.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }
      return res.json({ user });
    } catch (error) {
      return res.serverError(error);
    }
  },

  // Retrieve self account's detail
  updateSelf: async function (req, res) {
    try {
      const { user, authError } = await checkUser.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }

      let { username, email, password } = req.allParams();
      username = username.trim();

      if (!username) {
        return res.badRequest({ error: "Username is required." });
      }

      if (username.length < 6 || username.length > 20) {
        return res.badRequest({
          error: "Username must be 6 to 20 characters.",
        });
      }

      if (!usernameRegex.test(username)) {
        return res.badRequest({
          error: "Username can contain alphabet, numeric, and _ only.",
        });
      }

      if (email.length > 50) {
        return res.badRequest({
          error: "Email address must be up to 50 characters only.",
        });
      }

      if (!emailRegex.test(email)) {
        return res.badRequest({
          error: "Invalid email address.",
        });
      }

      const existingUsername = await User.findOne({
        where: { username: username, user_id: { "!=": user.user_id } },
      });
      if (existingUsername) {
        return res.badRequest({ error: "Username is already taken." });
      }
      const existingEmail = await User.findOne({
        where: { email: email, user_id: { "!=": user.user_id } },
      });
      if (existingEmail) {
        return res.badRequest({ error: "Email address is already taken." });
      }

      const updateData = { username, email };

      // Updating password is optional
      if (password) {
        if (password.length < 8) {
          return res.badRequest({
            error: "Password must be at least 8 characters long.",
          });
        }

        if (!passwordRegex.test(password)) {
          return res.badRequest({
            error:
              "Password must contain at least one number and one alphabet character.",
          });
        }

        updateData.password = password;
      }

      const updatedUser = await User.updateOne({ user_id: user.user_id })
        .set(updateData)
        .catch((err) => {
          return res.badRequest({
            error: `Failed to update user with id ${user.user_id}.`,
          });
        });

      if (!updatedUser) {
        return res.badRequest({
          error: `User with id ${user.user_id} does not exist.`,
        });
      }
      const returnUser = _.omit(updatedUser, ["password"]);
      return res.json({ user: returnUser });
    } catch (error) {
      return res.serverError(error);
    }
  },

  // Delete own account
  deleteSelf: async function (req, res) {
    try {
      const { user, authError } = await checkUser.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }
      const deletedUser = await User.destroyOne({ user_id: user.user_id });
      if (!deletedUser) {
        return res.badRequest({
          error: `User with id ${user.user_id} does not exist.`,
        });
      }
      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      return res.serverError(error);
    }
  },
};
