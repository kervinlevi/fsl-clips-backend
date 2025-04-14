// api/models/Clip.js

module.exports = {
  primaryKey: 'clip_id',
  attributes: {
    clip_id: {
      type: 'number',
      autoIncrement: true,
      unique: true
    },

    added_by: {
      type: 'number',
      required: true,
    },

    description_ph: {
      type: 'string',
      required: false,
      maxLength: 1048,
      defaultsTo: ''
    },

    description_en: {
      type: 'string',
      required: false,
      maxLength: 1048,
      defaultsTo: ''
    },

    video_url: {
      type: 'string',
      required: true,
      maxLength: 1048
    },

    thumbnail_url: {
      type: 'string',
      required: true,
      maxLength: 1048
    },

    date_added: {
      type: 'string',
    },

    id: false,
    updatedAt: false,
    createdAt: false,

  },
  
  // Lifecycle callback to hash password before creating a clip
  beforeCreate: async function(values, proceed) {
    values.date_added = (new Date()).toISOString();
    return proceed();
  },
};
