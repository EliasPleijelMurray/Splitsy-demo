import { Request, Response } from "express";
import { Group } from "../models/groupSchema.mjs";
import { calculateGroupBalances } from "../services/balanceService.mjs";
import { io } from "../index.mjs";

// Extend Request type to include userId from auth middleware
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Create a new group
export async function createGroup(req: Request, res: Response) {
  try {
    const { name, description, currency } = req.body;
    const userId = req.userId; // From auth middleware

    if (!name) {
      return res.status(400).json({ error: "Group name is required" });
    }

    const group = new Group({
      name,
      description: description || "",
      currency: currency || "USD",
      createdBy: userId,
      members: [
        {
          userId,
          role: "admin",
          joinedAt: new Date(),
        },
      ],
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
}

// Get user's groups
export async function getUserGroups(req: Request, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const groups = await Group.find({
      "members.userId": userId,
    })
      .populate("createdBy", "name email")
      .populate("members.userId", "name email");

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
}

// Get group by ID
export async function getGroupById(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    const group = await Group.findById(groupId)
      .populate("createdBy", "name email")
      .populate("members.userId", "name email");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is a member
    const isMember = group.members.some(
      (member) => member.userId._id.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ error: "Failed to fetch group" });
  }
}

// Add member to group
export async function addMember(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    const { userEmail } = req.body;
    const userId = req.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if requester is admin
    const requester = group.members.find(
      (member) => member.userId.toString() === userId
    );
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    // Find user by email
    const User = (await import("../models/userSchema.mjs")).default;
    const newUser = await User.findOne({ email: userEmail });
    if (!newUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is already a member
    const alreadyMember = group.members.some(
      (member) => member.userId.toString() === newUser._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ error: "User is already a member" });
    }

    group.members.push({
      userId: newUser._id,
      role: "member",
      joinedAt: new Date(),
    });

    await group.save();
    res.status(200).json(group);
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
}

// Join group via invite link (authenticated users only)
export async function joinGroup(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is already a member
    const alreadyMember = group.members.some(
      (member) => member.userId.toString() === userId
    );

    if (alreadyMember) {
      return res
        .status(400)
        .json({ error: "You are already a member of this group" });
    }

    // Add user as member
    group.members.push({
      userId: userId as any,
      role: "member",
      joinedAt: new Date(),
    });

    await group.save();

    // Return populated group
    const populatedGroup = await Group.findById(groupId)
      .populate("createdBy", "name email")
      .populate("members.userId", "name email");

    // Emit Socket.IO event to all users in the group
    io.to(`group-${groupId}`).emit("member-joined", {
      groupId,
      member: populatedGroup?.members[populatedGroup.members.length - 1],
    });

    res.status(200).json(populatedGroup);
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ error: "Failed to join group" });
  }
}

// Get group balances
export async function getGroupBalances(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMember = group.members.some(
      (member) => member.userId.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Calculate balances
    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    const result = await calculateGroupBalances(groupId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error calculating balances:", error);
    res.status(500).json({ error: "Failed to calculate balances" });
  }
}
