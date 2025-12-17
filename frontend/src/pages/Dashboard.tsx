import { useEffect, useState } from "react";
import {
  groupService,
  expenseService,
  type Group,
  type Expense,
  type CreateGroupData,
  type CreateExpenseData,
  type BalanceResult,
} from "../services/groupService";
import { authService, type User } from "../services/authService";
import { useSocket } from "../hooks/useSocket";

export const Dashboard = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const socket = useSocket();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Balance & settlement state
  const [balanceResult, setBalanceResult] = useState<BalanceResult | null>(
    null
  );
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // New group form
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  // New expense form
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("");
  const [expenseParticipants, setExpenseParticipants] = useState<string[]>([]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    };

    fetchCurrentUser();
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadExpenses(selectedGroup._id);

      // Join the Socket.IO room for this group
      if (socket) {
        socket.emit("join-group", selectedGroup._id);
      }
    }

    // Cleanup: leave the room when switching groups
    return () => {
      if (selectedGroup && socket) {
        socket.emit("leave-group", selectedGroup._id);
      }
    };
  }, [selectedGroup, socket]);

  // Socket.IO listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new expenses
    socket.on("expense-created", (expense: Expense) => {
      if (selectedGroup && expense.groupId === selectedGroup._id) {
        setExpenses((prev) => [...prev, expense]);
        loadGroupBalances(selectedGroup._id);
      }
    });

    // Listen for new members
    socket.on("member-joined", ({ groupId }: { groupId: string }) => {
      if (selectedGroup && groupId === selectedGroup._id) {
        // Reload the group to get updated member list
        loadGroups();
      }
    });

    return () => {
      socket.off("expense-created");
      socket.off("member-joined");
    };
  }, [socket, selectedGroup]);

  const loadGroups = async () => {
    try {
      const fetchedGroups = await groupService.getUserGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Failed to load groups:", error);
    }
  };

  const loadExpenses = async (groupId: string) => {
    try {
      const fetchedExpenses = await expenseService.getGroupExpenses(groupId);
      setExpenses(fetchedExpenses);
      loadGroupBalances(groupId);
    } catch (error) {
      console.error("Failed to load expenses:", error);
    }
  };

  const loadGroupBalances = async (groupId: string) => {
    setIsLoadingBalances(true);
    setBalanceError(null);
    try {
      const result = await groupService.getGroupBalances(groupId);
      setBalanceResult(result);
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      setBalanceError("Could not load who owes who right now.");
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const groupData: CreateGroupData = {
        name: newGroupName,
        description: newGroupDescription,
      };
      const newGroup = await groupService.createGroup(groupData);
      setGroups([...groups, newGroup]);
      setNewGroupName("");
      setNewGroupDescription("");
      setShowNewGroupForm(false);
      setSelectedGroup(newGroup);
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Failed to create group");
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      const expenseData: CreateExpenseData = {
        groupId: selectedGroup._id,
        amount: parseFloat(expenseAmount),
        description: expenseDescription,
        paidBy: expensePaidBy,
        participants: expenseParticipants,
      };
      const newExpense = await expenseService.createExpense(expenseData);
      setExpenses([...expenses, newExpense]);
      loadGroupBalances(selectedGroup._id);
      setExpenseAmount("");
      setExpenseDescription("");
      setExpensePaidBy("");
      setExpenseParticipants([]);
    } catch (error) {
      console.error("Failed to add expense:", error);
      alert("Failed to add expense");
    }
  };

  // Reset balance view when switching groups
  useEffect(() => {
    setBalanceResult(null);
    setBalanceError(null);
  }, [selectedGroup?._id ?? null]);

  return (
    <div className="min-h-screen p-8">
      <div className="flex gap-6">
        {/* Left sidebar - Groups */}
        <div className="w-80">
          <h2 className="text-xl font-semibold mb-4">Groups</h2>

          <div className="space-y-2 mb-4">
            {groups.map((group) => (
              <button
                key={group._id}
                onClick={() => setSelectedGroup(group)}
                className={`w-full text-left p-4 border border-gray-800 bg-white hover:bg-gray-50 transition-colors flex justify-between items-center ${
                  selectedGroup?._id === group._id ? "bg-gray-100" : ""
                }`}
              >
                <span className="font-medium">{group.name.toUpperCase()}</span>
                <span className="text-xl">›</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowNewGroupForm(!showNewGroupForm)}
            className="px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50 transition-colors"
          >
            New group
          </button>

          {showNewGroupForm && (
            <form
              onSubmit={handleCreateGroup}
              className="mt-4 p-4 border border-gray-800 bg-white"
            >
              <input
                type="text"
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
                className="w-full p-2 mb-2 border border-gray-400"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="w-full p-2 mb-2 border border-gray-400"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewGroupForm(false)}
                  className="px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right panel - Expenses and Add Expense */}
        {selectedGroup && (
          <div className="flex-1 border-2 border-gray-800 bg-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {selectedGroup.name.toUpperCase()}
              </h2>
              <button
                onClick={() => {
                  const inviteLink = `${window.location.origin}/join/${selectedGroup._id}`;
                  navigator.clipboard.writeText(inviteLink);
                  alert("Invite link copied to clipboard!");
                }}
                className="px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50 text-sm"
              >
                Copy invite link
              </button>
            </div>

            <div className="flex gap-6">
              {/* Expenses list */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4">EXPENCES</h3>
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense._id}
                      className="flex justify-between text-sm font-receipt"
                    >
                      <span>{expense.paidBy.name.toUpperCase()}</span>
                      <span>{expense.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balance summary */}
              <div className="border-l-2 border-dashed border-gray-800 pl-6 w-96">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">WHO OWES WHO</h3>
                  {balanceError && (
                    <span className="text-xs text-red-600">{balanceError}</span>
                  )}
                </div>

                {balanceResult ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Members</p>
                      {balanceResult.balances.map((balance) => {
                        const isCurrentUser =
                          currentUser && balance.userId === currentUser.id;
                        const net = balance.balance;
                        const statusLabel =
                          net > 0.01
                            ? `is owed ${net.toFixed(2)}`
                            : net < -0.01
                            ? `owes ${Math.abs(net).toFixed(2)}`
                            : "is settled";

                        return (
                          <div
                            key={balance.userId}
                            className={`p-3 border border-gray-200 bg-white text-sm ${
                              isCurrentUser ? "bg-yellow-50" : ""
                            }`}
                          >
                            <div className="flex justify-between">
                              <span className="font-semibold">
                                {balance.name}
                                {isCurrentUser ? " (you)" : ""}
                              </span>
                              <span>{statusLabel}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1 flex justify-between">
                              <span>Paid: {balance.totalPaid.toFixed(2)}</span>
                              <span>
                                Share: {balance.totalShare.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Suggested settlements
                      </p>
                      {balanceResult.settlements.length === 0 && (
                        <div className="p-3 border border-gray-200 bg-white text-sm">
                          Everything is already settled.
                        </div>
                      )}
                      {balanceResult.settlements.map((settlement, index) => {
                        const involvesUser =
                          currentUser &&
                          (settlement.from === currentUser.id ||
                            settlement.to === currentUser.id);
                        return (
                          <div
                            key={`${settlement.from}-${settlement.to}-${index}`}
                            className={`p-3 border border-gray-200 bg-white text-sm flex justify-between ${
                              involvesUser ? "bg-green-50" : ""
                            }`}
                          >
                            <span>
                              {settlement.fromName} → {settlement.toName}
                            </span>
                            <span>{settlement.amount.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border border-gray-200 bg-white text-sm">
                    {isLoadingBalances
                      ? "Calculating who owes who..."
                      : "No balance data yet."}
                  </div>
                )}
              </div>

              {/* Add expense form */}
              <div className="border-l-2 border-dashed border-gray-800 pl-6 w-80">
                <h3 className="text-lg font-semibold mb-4">ADD EXPENCE</h3>
                <form onSubmit={handleAddExpense} className="space-y-3">
                  <select
                    value={expensePaidBy}
                    onChange={(e) => setExpensePaidBy(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-400 bg-white"
                  >
                    <option value="">Who paid?</option>
                    {selectedGroup.members.map((member) => (
                      <option key={member.userId._id} value={member.userId._id}>
                        {member.userId.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Beskrivning"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full p-2 border border-gray-400 bg-white"
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Summa"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-400 bg-white"
                  />

                  <select
                    multiple
                    value={expenseParticipants}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      );
                      setExpenseParticipants(selected);
                    }}
                    className="w-full p-2 border border-gray-400 bg-white"
                    size={Math.min(selectedGroup.members.length, 4)}
                  >
                    <option value="" disabled>
                      Vilka delade?
                    </option>
                    {selectedGroup.members.map((member) => (
                      <option key={member.userId._id} value={member.userId._id}>
                        {member.userId.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="px-6 py-2 border border-gray-800 bg-white hover:bg-gray-50"
                  >
                    add
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {!selectedGroup && groups.length > 0 && (
          <div className="flex-1 border-2 border-gray-800 bg-[#E8E3E3] p-6 flex items-center justify-center">
            <p className="text-gray-600 text-lg">
              Select a group to view expenses
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
