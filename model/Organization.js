const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  name: { type: String, required: true },
  image: { type: String } 
});

module.exports = mongoose.model('Organization', organizationSchema);
