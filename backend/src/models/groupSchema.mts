import { Schema, model } from "mongoose";

const GroupSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  members: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      joinedAt: { type: Date, default: Date.now },
      role: { type: String, enum: ["admin", "member"], default: "member" },
    },
  ],
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Group = model("Group", GroupSchema);
