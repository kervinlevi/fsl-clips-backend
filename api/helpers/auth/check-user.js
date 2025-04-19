const jwt = require("jsonwebtoken");

module.exports = {
  friendlyName: "Check User",

  description: "Check if the JWT token is valid. Returns {user, error}",

  inputs: {
    req: {
      type: "ref",
      required: true,
      description: "The incoming HTTP request (to access headers)",
    },
  },

  fn: async function (inputs, exits) {
    const { req } = inputs;

    try {
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) {
        return exits.success({ user: null, authError: "Token not found" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userFromDb = await User.findOne({ user_id: decoded.id });
      const user = _.omit(userFromDb, ["password"]);

      if (!user) {
        return exits.success({ user: null, authError: "User not found" });
      }

      return exits.success({ user: user, authError: null });
    } catch (err) {
      return exits.success({ user: null, authError: err.message || JSON.stringify(err) });
    }
  },
};
