const jwt = require('jsonwebtoken');

module.exports = {
  friendlyName: 'Check Admin',

  description: 'Check if the user is an admin using JWT',

  inputs: {
    req: {
      type: 'ref',
      required: true,
      description: 'The incoming HTTP request (to access headers)',
    }
  },

  fn: async function (inputs, exits) {
    const { req } = inputs;

    try {
      const token = req.headers['authorization']?.split(' ')[1];
      if (!token) return exits.error('Token not found');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ user_id: decoded.id });

      if (!user) return exits.error('User not found');
      if (user.type !== 'admin') return exits.error('User is not an admin');

      return exits.success(user);
    } catch (err) {
      return exits.error(err.message || err);
    }
  }
};
