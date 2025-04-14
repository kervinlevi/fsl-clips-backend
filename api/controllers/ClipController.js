const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const sails = require('sails');

module.exports = {
  upload: async function (req, res) {
    try {
        const adminUser = await sails.helpers.auth.checkAdmin.with({ req }).intercept((err) => {
            return res.badRequest({ error: 'Unauthorized. Not an admin or user not found.' });
        });

        // Ensure video directory exists
        const uploadDir = path.resolve(sails.config.appPath, 'assets/uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const uploadedFiles = await new Promise((resolve, reject) => {
            req.file('clip').upload({
                dirname: uploadDir,
                maxBytes: 50 * 1000000, // 50MB
            }, (err, files) => {
                if (err) return reject(err);
                return resolve(files);
            });
        });

        if (uploadedFiles.length === 0) {
            return res.badRequest({ error: 'No file uploaded' });
        }

        const fullFilePath = uploadedFiles[0].fd;
        const fileName = path.basename(fullFilePath);
        const filePath = `uploads/${fileName}`;
        const thumbName = `${path.parse(fileName).name}-thumb.jpg`;
        const thumbnailPath = `uploads/thumbnails/${thumbName}`;
        const thumbFullPath = path.resolve(sails.config.appPath, 'assets', thumbnailPath);

        // Ensure thumbnails directory exists
        const thumbDir = path.dirname(thumbFullPath);
        if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

        // Generate thumbnail
        await new Promise((resolve, reject) => {
            ffmpeg(fullFilePath)
            .on('end', resolve)
            .on('error', reject)
            .screenshots({
                timestamps: ['00:00:01'],
                filename: thumbName,
                folder: thumbDir,
                size: '320x240'
            });
        });
        
        const newVideo = await Clip.create({
            description_ph: req.param('description_ph') || "",
            description_en: req.param('description_en') || "",
            video_url: filePath,
            thumbnail_url: thumbnailPath,
            added_by: adminUser.user_id
        }).fetch();

        return res.json(newVideo);
    } catch (err) {
      return res.serverError(err);
    }
  }
};
