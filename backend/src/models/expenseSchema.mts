import { Schema, model } from 'mongoose';

const ExpenseSchema = new Schema({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: "" },
  paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  date: { type: Date, default: Date.now }
});

export const Expense = model("Expense", ExpenseSchema);
