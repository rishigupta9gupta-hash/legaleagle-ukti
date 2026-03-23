import mongoose from "mongoose";

const HealthSessionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, default: "medical" },
    language: { type: String, default: "en" },
    duration: { type: Number, default: 0 },
    severity: { type: String, default: "low" },
    transcript: { type: mongoose.Schema.Types.Mixed },
    summary: { type: String },
    recommendations: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.HealthSession || mongoose.model("HealthSession", HealthSessionSchema);
