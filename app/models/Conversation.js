import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participant_one: { type: String, required: true },
    participant_two: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
