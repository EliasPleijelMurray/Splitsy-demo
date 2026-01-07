import { Router } from "express";
import {
  createGroup,
  getUserGroups,
  getGroupById,
  addMember,
  joinGroup,
  getGroupBalances,
  deleteGroup,
} from "../controllers/groupController.mjs";

export const groupRouter = Router();

// Create a new group
groupRouter.post("/", createGroup);

// Get all groups for current user
groupRouter.get("/", getUserGroups);

// Get specific group by ID
groupRouter.get("/:groupId", getGroupById);

// Add member to group (by admin)
groupRouter.post("/:groupId/members", addMember);

// Join group via invite link
groupRouter.post("/:groupId/join", joinGroup);

// Get balances for a group
groupRouter.get("/:groupId/balances", getGroupBalances);

// Delete group (creator only)
groupRouter.delete("/:groupId", deleteGroup);
