import { Request, Response } from "express";
import { Expense } from "../models/expenseSchema.mjs";
import { Group } from "../models/groupSchema.mjs";
import { io } from "../index.mjs";

// Create a new expense
export async function createExpense(req: Request, res: Response) {
  try {
    const { groupId, amount, description, paidBy, participants } = req.body;
    const userId = req.userId;

    if (
      !groupId ||
      !amount ||
      !paidBy ||
      !participants ||
      participants.length === 0
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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

    const expense = new Expense({
      groupId,
      amount,
      description: description || "",
      paidBy,
      participants,
      date: new Date(),
    });

    await expense.save();

    // Populate the response
    const populatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name")
      .populate("participants", "name");

    // Emit Socket.IO event to all users in the group
    io.to(`group-${groupId}`).emit("expense-created", populatedExpense);

    res.status(201).json(populatedExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
}

// Get expenses for a group
export async function getGroupExpenses(req: Request, res: Response) {
  try {
    const { groupId } = req.query;
    const userId = req.userId;

    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required" });
    }

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

    const expenses = await Expense.find({ groupId })
      .populate("paidBy", "name")
      .populate("participants", "name")
      .sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
}

// Get a specific expense
export async function getExpenseById(req: Request, res: Response) {
  try {
    const { expenseId } = req.params;
    const userId = req.userId;

    const expense = await Expense.findById(expenseId)
      .populate("paidBy", "name")
      .populate("participants", "name");

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Verify user is a member of the group
    const group = await Group.findById(expense.groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMember = group.members.some(
      (member) => member.userId.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ error: "Failed to fetch expense" });
  }
}

// Delete an expense
export async function deleteExpense(req: Request, res: Response) {
  try {
    const { expenseId } = req.params;
    const userId = req.userId;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Verify user is a member of the group
    const group = await Group.findById(expense.groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const member = group.members.find((m) => m.userId.toString() === userId);

    if (!member) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Only admin or the person who paid can delete
    if (member.role !== "admin" && expense.paidBy.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only admins or the payer can delete expenses" });
    }

    await Expense.findByIdAndDelete(expenseId);
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
}
