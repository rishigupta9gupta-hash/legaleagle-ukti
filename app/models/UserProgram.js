import mongoose from "mongoose";

const UserProgramSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    programId: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    progress: { type: mongoose.Schema.Types.Mixed, default: {} },
    moodLogs: { type: mongoose.Schema.Types.Mixed, default: [] },
    waterIntake: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.UserProgram || mongoose.model("UserProgram", UserProgramSchema);
