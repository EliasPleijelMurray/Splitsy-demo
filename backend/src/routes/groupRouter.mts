import { Router } from "express";
import {
  createGroup,
  getUserGroups,
  getGroupById,
  addMember,
  getGroupBalances,
} from "../controllers/groupController.mjs";

export const groupRouter = Router();

// Create a new group
groupRouter.post("/", createGroup);

// Get all groups for current user
groupRouter.get("/", getUserGroups);

// Get specific group by ID
groupRouter.get("/:groupId", getGroupById);

// Add member to group
groupRouter.post("/:groupId/members", addMember);

// Get balances for a group
groupRouter.get("/:groupId/balances", getGroupBalances);
