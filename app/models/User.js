import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    password: { type: String },
    role: { type: String, default: "user" },
    phone: { type: String },
    specialization: { type: String },
    experience_years: { type: Number, default: 0 },
    bio: { type: String },
    avatar_url: { type: String },
    isApproved: { type: Boolean, default: false },
    status: { type: String, default: "PENDING" },
    certificationUrl: { type: String },
    isAdmin: { type: Boolean, default: false },
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
      }
    }
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
