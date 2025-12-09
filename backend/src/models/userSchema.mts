import { model, Schema } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true, unique: true },
});

const User = model("user", UserSchema);
export default User;