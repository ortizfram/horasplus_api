const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String },
  latitude: { // cargar manualmente desde maps
    type: Number,
    required: false,
  },
  longitude: { // cargar manualmente desde maps
    type: Number,
    required: false,
  },
  admin_celphones: {
    type: [String], // Un array de cadenas para almacenar números de teléfono
    required: false, // Opcional, puede omitir este campo
  },
});

module.exports = mongoose.model("Organization", organizationSchema);
