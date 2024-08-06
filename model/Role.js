const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }, 
  name: { type: String, required: true },
});

module.exports = mongoose.model('Role', roleSchema);
