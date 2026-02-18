const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({

  name: String,
  usn: String,
  branch: String,
  yearOfPassing: String,
  email: String,
  address: String,

  certificate: String,
  reason: String,
  documentType: String,
  copies: Number,
  others: String,

  paymentStatus: {
    type: String,
    default: "Paid"
  },

  status: {
    type: String,
    default: "Pending"
  },

  rejectionReason: String,
  filePath: String

}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);
