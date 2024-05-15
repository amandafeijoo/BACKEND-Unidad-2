const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Favorite', favoriteSchema);