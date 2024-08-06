const mongoose = require("mongoose");

const cashAdvanceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  date: {
    type: String,
    default: () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
      const day = String(today.getDate()).padStart(2, "0");
      return `${day}/${month}-${year}`;
    },
  },
  amount: { type: Number, required: true, default: 0 },
});

module.exports = mongoose.model("CashAdvance", cashAdvanceSchema);
