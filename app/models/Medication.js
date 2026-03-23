import mongoose from "mongoose";

const MedicationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    dosage: { type: String },
    frequency: { type: String, default: "daily" },
    time: { type: String, default: "09:00" },
    expiryDate: { type: Date },
    notes: { type: String },
    imageUrl: { type: String },
    takenDates: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Medication || mongoose.model("Medication", MedicationSchema);
