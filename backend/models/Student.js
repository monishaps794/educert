const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  usn: String,
  password: String,
  name: String,
  branch: String,
  yearOfPassing: String,
  email: String,
  address: String
});

module.exports = mongoose.model("Student", studentSchema);
