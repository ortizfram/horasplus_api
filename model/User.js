
  const mongoose = require("mongoose");

  const userSchema = new mongoose.Schema(
    {
      email: { type: String, required: true },
      password: { type: String, required: true },
      firstname: { type: String, required: false },
      lastname: { type: String, required: false },
      profile_pic: { type: String, required: false },
      organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: false,
      },
      role: {
        type: [String],
        enum: ["User", "Admin"],
        default: ["User"],
      },
      hourly_fee: { type: Number, required: true, default: 0 },
      declared_hours: { type: Number, required: true, default: 0 },
      travel_cost: { type: Number, required: true, default: 0 },
      bonus_prize: { type: Number, required: false, default: 0 },
      cash_advance: { type: Number, required: false, default: 0 },
      cash_a_date: { type: String, required: false, default: 0 },
    },
    {
      timestamps: true,
    }
  );

  //Compile to form the model
  module.exports = mongoose.model("User", userSchema);
