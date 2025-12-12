import { Expense } from "../models/expenseSchema.mjs";
import { Group } from "../models/groupSchema.mjs";
import User from "../models/userSchema.mjs";

interface Balance {
  userId: string;
  name: string;
  balance: number;
  totalPaid: number;
  totalShare: number;
}

interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface BalanceResult {
  balances: Balance[];
  settlements: Settlement[];
}

export async function calculateGroupBalances(
  groupId: string
): Promise<BalanceResult> {
  // Get group and verify it exists
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error("Group not found");
  }

  // Get all expenses for this group
  const expenses = await Expense.find({ groupId })
    .populate("paidBy", "name")
    .populate("participants", "name");

  // Initialize balances for all group members
  const balanceMap = new Map<string, Balance>();

  for (const member of group.members) {
    const user = await User.findById(member.userId);
    balanceMap.set(member.userId.toString(), {
      userId: member.userId.toString(),
      name: user?.name || "Unknown",
      balance: 0,
      totalPaid: 0,
      totalShare: 0,
    });
  }

  // Calculate balances from expenses
  for (const expense of expenses) {
    const paidById = expense.paidBy._id.toString();
    const sharePerPerson = expense.amount / expense.participants.length;

    // Add to total paid for payer
    const payerBalance = balanceMap.get(paidById);
    if (payerBalance) {
      payerBalance.totalPaid += expense.amount;
      payerBalance.balance += expense.amount;
    }

    // Subtract share from each participant
    for (const participant of expense.participants) {
      const participantId = participant._id.toString();
      const participantBalance = balanceMap.get(participantId);
      if (participantBalance) {
        participantBalance.totalShare += sharePerPerson;
        participantBalance.balance -= sharePerPerson;
      }
    }
  }

  const balances = Array.from(balanceMap.values());

  // Calculate simplified settlements (minimize number of transactions)
  const settlements = calculateSettlements(balances);

  return { balances, settlements };
}

function calculateSettlements(balances: Balance[]): Settlement[] {
  const settlements: Settlement[] = [];

  // Separate creditors (owed money) and debtors (owe money)
  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ ...b }));
  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b }));

  // Sort by absolute balance (largest first)
  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => a.balance - b.balance);

  let i = 0,
    j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    if (!creditor || !debtor) break;

    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

    settlements.push({
      from: debtor.userId,
      fromName: debtor.name,
      to: creditor.userId,
      toName: creditor.name,
      amount: Math.round(amount * 100) / 100, // Round to 2 decimals
    });

    creditor.balance -= amount;
    debtor.balance += amount;

    if (creditor.balance < 0.01) i++;
    if (Math.abs(debtor.balance) < 0.01) j++;
  }

  return settlements;
}
