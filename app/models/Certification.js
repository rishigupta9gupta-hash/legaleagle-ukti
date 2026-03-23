import mongoose from "mongoose";

const CertificationSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true },
    title: { type: String, required: true },
    file_url: { type: String, required: true },
    file_type: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Certification || mongoose.model("Certification", CertificationSchema);
