const jwt = require("jsonwebtoken");

module.exports = {
  friendlyName: "Check Admin",

  description: "Check if the user is an admin using JWT. Returns {admin, authError}",

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
        return exits.success({ admin: null, authError: "Token not found" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ user_id: decoded.id });

      if (!user) {
        return exits.success({ admin: null, authError: "User not found" });
      }
      if (user.type !== "admin") {
        return exits.success({ admin: null, authError: "User is not an admin" });
      }

      return exits.success({ admin: user, authError: null });
    } catch (err) {
      return exits.success({ admin: null, authError: err.message || JSON.stringify(err) });
    }
  },
};
