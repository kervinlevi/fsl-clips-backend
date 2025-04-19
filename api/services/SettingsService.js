const fs = require("fs");
const path = require("path");
const settingsPath = path.resolve(__dirname, "../../data/settings.json");
const settingsDirPath = path.dirname(settingsPath);
const defaultSettings = require("../../utils/defaultSettings");

module.exports = {
  async fetchSettings() {
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
  },
};
