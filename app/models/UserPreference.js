import mongoose from "mongoose";

const UserPreferenceSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    language: { type: String, default: "en" },
    conditions: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    reminderEnabled: { type: Boolean, default: true },
    reminderTime: { type: String, default: "09:00" },
  },
  { timestamps: true }
);

export default mongoose.models.UserPreference || mongoose.model("UserPreference", UserPreferenceSchema);
