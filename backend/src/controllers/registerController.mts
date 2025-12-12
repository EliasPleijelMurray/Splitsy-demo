import User from "../models/userSchema.mjs";
import { InferSchemaType } from "mongoose";
import { RegisterRequest } from "../routes/registerRouter.mjs";
import bcrypt from "bcryptjs";
import { UserDto } from "../models/userDto.mjs";

type UserType = InferSchemaType<typeof User.schema>;

export const convertDbUserToDto = (dbUser: UserType): UserDto => {
  return {
    username: dbUser.name,
    email: dbUser.email,
  } satisfies UserDto;
};

export const createUser = async (data: RegisterRequest) => {
  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    throw Error("User with email " + data.email + " already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(data.password, salt);

  const newUser = await User.create({
    name: data.name,
    email: data.email,
    password: hash,
  });

  return convertDbUserToDto(newUser);
};
