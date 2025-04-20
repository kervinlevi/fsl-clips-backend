const sails = require("sails");
const checkUser = sails.helpers.auth.checkUser;

module.exports = {
  insert: async function (req, res) {
    try {
      const { user, authError } = await checkUser.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }

      const quizAttempt = await QuizAttempt.create({
        user_id: user.user_id,
        success: req.body.correct === "true" || req.body.correct === true,
      }).fetch();
      return res.json({ quizAttempt });
    } catch (err) {
      return res.serverError(err);
    }
  },
};
