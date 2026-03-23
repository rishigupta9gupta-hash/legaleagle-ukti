import mongoose from "mongoose";

const PasswordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expires: { type: Date, required: true }
});

export default mongoose.models.PasswordReset || mongoose.model("PasswordReset", PasswordResetSchema);
