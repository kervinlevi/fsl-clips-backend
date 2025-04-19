const fs = require("fs");
const _ = require("lodash");
const SettingsService = require("../services/SettingsService");
const checkAdmin = sails.helpers.auth.checkAdmin;
const path = require("path");
const settingsPath = path.resolve(__dirname, "../../data/settings.json");

module.exports = {
  fetch: async function (req, res) {
    try {
      const settings = await SettingsService.fetchSettings();
      return res.json(settings);
    } catch (err) {
      return res.serverError(err);
    }
  },

  update: async function (req, res) {
    try {
      const { authError } = await checkAdmin.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }

      // Values become string in req.body
      const quiz_enabled =
        req.body.quiz_enabled === "true" || req.body.quiz_enabled === true;
      const clips_before_quiz = _.toNumber(req.body.clips_before_quiz);

      // Validate the values
      if (
        _.isNaN(clips_before_quiz) ||
        clips_before_quiz < 2 ||
        clips_before_quiz > 20
      ) {
        return res.badRequest({
          error: "Invalid clips_before_quiz.",
        });
      }

      const newSettings = { quiz_enabled, clips_before_quiz };
      await fs.promises.writeFile(
        settingsPath,
        JSON.stringify(newSettings, null, 2),
        "utf8"
      );

      return res.json(newSettings);
    } catch (err) {
      return res.serverError(err);
    }
  },
};
