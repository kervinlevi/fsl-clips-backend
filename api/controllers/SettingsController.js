const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const defaultSettings = require("../../utils/defaultSettings");
const settingsPath = path.resolve(__dirname, "../../data/settings.json");
const settingsDirPath = path.dirname(settingsPath);

async function loadSettings() {
  try {
    if (!fs.existsSync(settingsPath)) {
      await fs.promises.mkdir(settingsDirPath, { recursive: true });
      await fs.promises.writeFile(
        settingsPath,
        JSON.stringify(defaultSettings, null, 2),
        "utf-8"
      );
      return defaultSettings;
    }

    const file = await fs.promises.readFile(settingsPath, "utf8");
    const settings = JSON.parse(file);

    // Merge missing keys from defaultSettings
    return { ...defaultSettings, ...settings };
  } catch (err) {
    return {};
  }
}

module.exports = {
  fetch: async function (req, res) {
    try {
      const settings = await loadSettings();
      return res.json(settings);
    } catch (err) {
      return res.serverError(err);
    }
  },

  update: async function (req, res) {
    try {
      await sails.helpers.auth.checkAdmin.with({ req }).intercept((err) => {
        return res.badRequest({
          error: "Unauthorized. Not an admin or user not found.",
        });
      });

      // Values become string in req.body
      const quiz_enabled = req.body.quiz_enabled === 'true' || req.body.quiz_enabled === true;
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
      await fs.promises.writeFile(settingsPath, JSON.stringify(newSettings, null, 2), 'utf8');

      return res.json(newSettings);
    } catch (err) {
      return res.serverError(err);
    }
  },
};
