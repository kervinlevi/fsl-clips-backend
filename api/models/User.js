// api/models/User.js

const bcrypt = require('bcryptjs');

module.exports = {
  primaryKey: 'user_id',
  attributes: {

    user_id: {
      type: 'number',
      autoIncrement: true,
      unique: true
    },

    username: {
      type: 'string',
      required: true,
      unique: true,
      minLength: 6,
      maxLength: 20
    },

    email: {
      type: 'string',
      required: true,
      unique: true,
      maxLength: 50,
      isEmail: true
    },

    password: {
      type: 'string',
      required: true,
      maxLength: 255
    },

    type: {
      type: 'string',
      isIn: ['admin', 'learner'],
      defaultsTo: 'learner'
    },

    date_added: {
      type: 'string',
    },

    id: false,
    updatedAt: false,
    createdAt: false,
  },
  
  // Override the toJSON method to exclude the password field
  toJSON: function() {
    let userObj = this.toObject();
    delete userObj.password;  // Remove password from the object
    return userObj;
  },

  // Lifecycle callback to hash password before creating a user
  beforeCreate: async function(values, proceed) {
    if (values.password) {
      // Encrypt the password
      try {
        const encryptedPassword = await bcrypt.hash(values.password, 10);
        values.password = encryptedPassword;
        values.date_added = (new Date()).toISOString();
        return proceed();
      } catch (err) {
        return proceed(err);
      }
    }
    return proceed();
  },
  
  // Lifecycle callback to hash password before updating a user
  beforeUpdate: async function(values, proceed) {
    if (values.password) {
      // Hash the password
      try {
        const hashedPassword = await bcrypt.hash(values.password, 10);
        values.password = hashedPassword;
        return proceed();
      } catch (err) {
        return proceed(err);
      }
    }
    return proceed();
  }
};
