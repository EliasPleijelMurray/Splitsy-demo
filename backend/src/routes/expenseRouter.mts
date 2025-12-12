import { Router } from "express";
import {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  deleteExpense,
} from "../controllers/expenseController.mjs";

export const expenseRouter = Router();

// Create a new expense
expenseRouter.post("/", createExpense);

// Get expenses for a group
expenseRouter.get("/", getGroupExpenses);

// Get specific expense by ID
expenseRouter.get("/:expenseId", getExpenseById);

// Delete an expense
expenseRouter.delete("/:expenseId", deleteExpense);
