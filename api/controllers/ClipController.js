const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const sails = require("sails");
const _ = require("lodash");
const SettingsService = require("../services/SettingsService");
const moment = require("moment-timezone");
const checkAdmin = sails.helpers.auth.checkAdmin;
const checkUser = sails.helpers.auth.checkUser;

const isToday = (isoString) => {
  const attemptDate = moment(isoString).utcOffset(8, true);
  const now = moment().utcOffset(8, true);
  return attemptDate.isSame(now, "day");
};

module.exports = {
  findAll: async function (req, res) {
    try {
      const { authError } = await checkAdmin.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }
      const clips = await Clip.find();
      return res.json({ clips });
    } catch (err) {
      return res.serverError(err);
    }
  },

  upload: async function (req, res) {
    try {
      const { admin, authError } = await checkAdmin.with({
        req,
      });
      if (authError) {
        return res.badRequest({ error: authError });
      }

      // Ensure video directory exists
      const uploadDir = path.resolve(sails.config.appPath, "assets/uploads");
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });

      const uploadedFiles = await new Promise((resolve, reject) => {
        req.file("clip").upload(
          {
            dirname: uploadDir,
            maxBytes: 50 * 1000000, // 50MB
          },
          (err, files) => {
            if (err) return reject(err);
            return resolve(files);
          }
        );
      });

      if (uploadedFiles.length === 0) {
        return res.badRequest({ error: "No file uploaded" });
      }

      const uploadedFile = uploadedFiles[0];
      if (uploadedFile.type !== "video/mp4") {
        fs.unlinkSync(uploadedFile.fd);
        return res.badRequest({
          error: "Invalid file type. Only MP4 files are accepted",
        });
      }

      const fullFilePath = uploadedFile.fd;
      const fileName = path.basename(fullFilePath);
      if (path.extname(fileName).toLowerCase() !== ".mp4") {
        fs.unlinkSync(uploadedFile.fd);
        return res.badRequest({
          error: "Invalid file extension. Only .mp4 files are accepted",
        });
      }

      const filePath = `uploads/${fileName}`;
      const thumbName = `${path.parse(fileName).name}-thumb.jpg`;
      const thumbnailPath = `uploads/thumbnails/${thumbName}`;
      const thumbFullPath = path.resolve(
        sails.config.appPath,
        "assets",
        thumbnailPath
      );

      // Ensure thumbnails directory exists
      const thumbDir = path.dirname(thumbFullPath);
      if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

      // Generate thumbnail
      await new Promise((resolve, reject) => {
        ffmpeg(fullFilePath)
          .on("end", resolve)
          .on("error", reject)
          .screenshots({
            timestamps: ["00:00:01"],
            filename: thumbName,
            folder: thumbDir,
          });
      });

      const newVideo = await Clip.create({
        description_ph: req.param("description_ph") || "",
        description_en: req.param("description_en") || "",
        video_url: filePath,
        thumbnail_url: thumbnailPath,
        added_by: admin.user_id,
      }).fetch();

      return res.json(newVideo);
    } catch (err) {
      return res.serverError(err);
    }
  },

  // Retrieve a clip's detail
  find: async function (req, res) {
    try {
      const { authError } = await checkAdmin.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }

      const clip_id = _.toNumber(req.param("clip_id"));
      if (_.isNaN(clip_id)) {
        return res.badRequest({
          error: `Invalid clip_id param ${JSON.stringify(
            req.param("clip_id")
          )}.`,
        });
      }

      const clip = await Clip.findOne({ clip_id });
      if (!clip) {
        return res.badRequest({
          error: `Clip with id ${clip_id} does not exist.`,
        });
      }

      return res.json({ clip });
    } catch (error) {
      return res.serverError(error);
    }
  },

  // Update a clip's description_ph, and description_en
  update: async function (req, res) {
    try {
      const { authError } = await checkAdmin.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }

      const clip_id = _.toNumber(req.param("clip_id"));
      if (_.isNaN(clip_id)) {
        return res.badRequest({
          error: `Invalid clip_id param ${JSON.stringify(
            req.param("clip_id")
          )}.`,
        });
      }

      let { description_ph, description_en } = req.allParams();
      description_ph = description_ph || "";
      description_en = description_en || "";
      const clip = await Clip.updateOne({ clip_id })
        .set({
          description_ph,
          description_en,
        })
        .catch((err) => {
          return res.badRequest({
            error: `Failed to update clip with id ${clip_id}.`,
          });
        });

      if (!clip) {
        return res.badRequest({
          error: `Clip with id ${clip_id} does not exist.`,
        });
      }
      return res.json({ clip });
    } catch (error) {
      return res.serverError(error);
    }
  },

  // Delete a clip
  delete: async function (req, res) {
    try {
      const { authError } = await checkAdmin.with({ req });
      if (authError) {
        return res.badRequest({ error: authError });
      }

      const clip_id = _.toNumber(req.param("clip_id"));
      if (_.isNaN(clip_id)) {
        return res.badRequest({
          error: `Invalid clip_id param ${JSON.stringify(
            req.param("clip_id")
          )}.`,
        });
      }

      const deletedClip = await Clip.destroyOne({ clip_id });
      if (!deletedClip) {
        return res.badRequest({
          error: `Clip with id ${clip_id} does not exist.`,
        });
      }

      try {
        const videoPath = path.resolve(
          sails.config.appPath,
          "assets",
          deletedClip.video_url
        );
        const thumbnailPath = path.resolve(
          sails.config.appPath,
          "assets",
          deletedClip.thumbnail_url
        );
        await fs.promises.unlink(videoPath);
        await fs.promises.unlink(thumbnailPath);
      } catch (err) {
        sails.log.warn(`Could not delete file ${videoPath}:`, err.message);
      }

      return res.json({ message: "Clip deleted successfully" });
    } catch (error) {
      return res.serverError(error);
    }
  },

  // Fetch random clips excluding clips with id in filter
  fetchRandomClips: async function (req, res) {
    try {
      let exclude = req.query.exclude;

      const settings = await SettingsService.fetchSettings();
      let showQuiz = settings.quiz_enabled == true;
      if (showQuiz) {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
          showQuiz = false;
        } else {
          // Show quiz only when user is logged in
          const { user, authError } = await checkUser.with({ req });
          if (authError) {
            return res.badRequest({ error: authError });
          }

          // Show quiz only when user has not successfully answered today
          const quizAttempts = await QuizAttempt.find({
            where: {
              user_id: user.user_id,
              success: true,
            },
            sort: "date_attempted DESC",
            limit: 1,
          });
          showQuiz =
            quizAttempts.length == 0 ||
            !isToday(quizAttempts[0].date_attempted);
        }
      }

      const limit = showQuiz ? settings.clips_before_quiz : 5;

      // Sanitize exclude array
      if (_.isString(exclude)) {
        try {
          exclude = JSON.parse(exclude);
        } catch (err) {
          exclude = [];
        }
      }
      exclude = _.isArray(exclude)
        ? exclude.map(Number).filter((item) => !isNaN(item))
        : [];

      // Create select statement and query random clips with exclusions
      const whereClause =
        exclude.length > 0 ? `WHERE clip_id NOT IN (${exclude.join(",")})` : "";
      const query = `SELECT * FROM clip ${whereClause} ORDER BY RAND() LIMIT ${limit}`;
      const selected = await sails.sendNativeQuery(query);
      const clips = selected.rows;

      if (showQuiz) {
        // randomize clip to guess
        const guessIndex = Math.floor(Math.random() * limit);

        // create quiz options
        const options = [];
        for (let i = 0; i < 4; i++) {
          const index = (guessIndex + i) % limit;
          options.push({
            description_ph: clips[index].description_ph ?? "",
            correct: index === guessIndex,
          });
        }

        const quiz = {
          ...clips[guessIndex],
          quiz: true,
          options: _.shuffle(options),
        };

        return res.json({ clips: [...clips, quiz] });
      }
      return res.json({ clips });
    } catch (error) {
      return res.serverError({ error });
    }
  },
};
