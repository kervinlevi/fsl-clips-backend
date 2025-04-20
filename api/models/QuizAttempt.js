// api/models/QuizAttempt.js

module.exports = {
  tableName: 'quiz_attempt',
  primaryKey: 'quiz_attempt_id',
  attributes: {
    quiz_attempt_id: {
      type: 'number',
      autoIncrement: true,
      unique: true
    },

    user_id: {
      type: 'number',
      required: true,
    },

    success: {
      type: 'boolean',
      required: true,
    },

    date_attempted: {
      type: 'string',
    },

    id: false,
    updatedAt: false,
    createdAt: false,
  },
  
  // Lifecycle callback to include date_attempted
  beforeCreate: async function(values, proceed) {
    values.date_attempted = (new Date()).toISOString();
    return proceed();
  },
};
