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
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

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

  // Join by link form
  const [showJoinByLinkForm, setShowJoinByLinkForm] = useState(false);
  const [inviteLinkInput, setInviteLinkInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const getDefaultPayerId = () => {
    if (!selectedGroup) return "";
    const ids = selectedGroup.members.map((m) => m.userId._id);
    if (currentUser?.id && ids.includes(currentUser.id)) return currentUser.id;
    return ids[0] ?? "";
  };

  const dedupeExpenses = (list: Expense[]) => {
    const seen = new Set<string>();
    return list.filter((item) => {
      if (seen.has(item._id)) return false;
      seen.add(item._id);
      return true;
    });
  };

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
        setExpenses((prev) => dedupeExpenses([...prev, expense]));
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

    // Listen for group deletion
    socket.on("group-deleted", ({ groupId }: { groupId: string }) => {
      setGroups((prevGroups) => prevGroups.filter((g) => g._id !== groupId));
      if (selectedGroup && selectedGroup._id === groupId) {
        setSelectedGroup(null);
        setExpenses([]);
        setBalanceResult(null);
      }
    });

    // Listen for expense deletion
    socket.on("expense-deleted", ({ expenseId }: { expenseId: string }) => {
      setExpenses((prev) => prev.filter((exp) => exp._id !== expenseId));
      if (selectedExpense && selectedExpense._id === expenseId) {
        setSelectedExpense(null);
      }
      if (selectedGroup) {
        loadGroupBalances(selectedGroup._id);
      }
    });

    return () => {
      socket.off("expense-created");
      socket.off("member-joined");
      socket.off("group-deleted");
      socket.off("expense-deleted");
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
      setExpenses(dedupeExpenses(fetchedExpenses));
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
      setExpenses((prev) => dedupeExpenses([...prev, newExpense]));
      loadGroupBalances(selectedGroup._id);
      setExpenseAmount("");
      setExpenseDescription("");
      setExpensePaidBy(getDefaultPayerId());
      setExpenseParticipants(
        selectedGroup.members.map((member) => member.userId._id)
      );
    } catch (error) {
      console.error("Failed to add expense:", error);
      alert("Failed to add expense");
    }
  };

  const handleKeypadPress = (key: string) => {
    setExpenseAmount((prev) => {
      if (key === "clear") return "";
      if (key === "back") return prev.slice(0, -1);
      if (key === ".") {
        if (prev.includes(".")) return prev;
        return prev === "" ? "0." : `${prev}.`;
      }
      return `${prev}${key}`;
    });
  };

  const handleJoinByLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    try {
      // Extract group ID from the invite link
      // Expected format: http://localhost:5173/join/groupId or https://domain.com/join/groupId
      const urlPattern = /\/join\/([a-zA-Z0-9]+)/;
      const match = inviteLinkInput.match(urlPattern);

      if (!match || !match[1]) {
        setJoinError("Invalid invite link format");
        return;
      }

      const groupId = match[1];
      await groupService.joinGroup(groupId);

      // Reload groups to include the newly joined group
      await loadGroups();

      setInviteLinkInput("");
      setShowJoinByLinkForm(false);
      alert("Successfully joined the group!");
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : "Failed to join group"
      );
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!selectedGroup) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${selectedGroup.name}"? This will delete all expenses and cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await groupService.deleteGroup(groupId);
      setGroups(groups.filter((g) => g._id !== groupId));
      setSelectedGroup(null);
      setExpenses([]);
      setBalanceResult(null);
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert(error instanceof Error ? error.message : "Failed to delete group");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) return;

    try {
      await expenseService.deleteExpense(expenseId);
      setExpenses((prev) => prev.filter((exp) => exp._id !== expenseId));
      setSelectedExpense(null);
      if (selectedGroup) {
        loadGroupBalances(selectedGroup._id);
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete expense"
      );
    }
  };

  // Reset balance view when switching groups
  useEffect(() => {
    setBalanceResult(null);
    setBalanceError(null);
  }, [selectedGroup?._id ?? null]);

  // Default all members as participants when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      setExpenseParticipants(
        selectedGroup.members.map((member) => member.userId._id)
      );
    } else {
      setExpenseParticipants([]);
    }
  }, [selectedGroup]);

  // Default payer to current user (if in group) when a group is selected
  useEffect(() => {
    if (!selectedGroup) return;
    const preferred = getDefaultPayerId();
    setExpensePaidBy((prev) => prev || preferred || "");
  }, [selectedGroup, currentUser]);

  return (
    <div className="min-h-full max-w-[1500px] mx-auto px-8 ">
      <div className="flex gap-6">
        {/* Left sidebar - Groups */}
        <div className="w-80">
          <h2 className="text-xl font-semibold mb-4">Groups</h2>

          <div className="space-y-2 mb-4">
            {groups.map((group) => (
              <button
                key={group._id}
                onClick={() => setSelectedGroup(group)}
                className={`w-full text-left p-4 border border-gray-800 bg-white hover:bg-gray-50 transition-colors flex justify-between items-center cursor-pointer ${
                  selectedGroup?._id === group._id ? "bg-gray-100" : ""
                }`}
              >
                <span className="font-medium">{group.name.toUpperCase()}</span>
                <span className="text-xl">›</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowNewGroupForm(!showNewGroupForm)}
              className="flex-1 px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              New group
            </button>
            <button
              onClick={() => setShowJoinByLinkForm(!showJoinByLinkForm)}
              className="flex-1 px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Join by link
            </button>
          </div>
        </div>

        {/* Expense Detail Modal */}
        {selectedExpense && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 cursor-pointer"
            onClick={() => setSelectedExpense(null)}
          >
            <div
              className="bg-white border border-gray-800 p-6 w-96 max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Expense Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-medium">{selectedExpense.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium">
                    {selectedExpense.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid by</p>
                  <p className="font-medium">{selectedExpense.paidBy.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">
                    {new Date(selectedExpense.date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="font-medium">
                    {selectedExpense.participants.map((p) => p.name).join(", ")}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleDeleteExpense(selectedExpense._id)}
                  className="flex-1 px-4 py-2 border border-red-600 bg-white hover:bg-red-50 text-red-600 cursor-pointer"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="flex-1 px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal overlay */}
        {showNewGroupForm && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 cursor-pointer"
            onClick={() => setShowNewGroupForm(false)}
          >
            <div
              className="bg-white border border-gray-800 p-6 w-96 max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Create New Group</h3>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <input
                  type="text"
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-400"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNewGroupForm(false)}
                    className="px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join by link modal */}
        {showJoinByLinkForm && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 cursor-pointer"
            onClick={() => {
              setShowJoinByLinkForm(false);
              setJoinError(null);
              setInviteLinkInput("");
            }}
          >
            <div
              className="bg-white border border-gray-800 p-6 w-96 max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Join Group by Link</h3>
              <form onSubmit={handleJoinByLink} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Paste invite link here"
                    value={inviteLinkInput}
                    onChange={(e) => {
                      setInviteLinkInput(e.target.value);
                      setJoinError(null);
                    }}
                    required
                    className="w-full p-2 border border-gray-400"
                  />
                  {joinError && (
                    <p className="text-black text-sm mt-2">{joinError}</p>
                  )}
                  <p className="text-gray-600 text-xs mt-2"></p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinByLinkForm(false);
                      setJoinError(null);
                      setInviteLinkInput("");
                    }}
                    className="px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Join Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Right panel - Expenses and Add Expense */}
        {selectedGroup && (
          <div className="flex-1 border-1 border-black bg-card p-6 transform mt-4 translate-y-10 max-h-[700px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {selectedGroup.name.toUpperCase()}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const inviteLink = `${window.location.origin}/join/${selectedGroup._id}`;
                    navigator.clipboard.writeText(inviteLink);
                    alert("Invite link copied to clipboard!");
                  }}
                  className="px-4 py-2 border border-gray-800 bg-white hover:bg-gray-50 text-sm cursor-pointer"
                >
                  Copy invite link
                </button>
                {currentUser &&
                  selectedGroup.createdBy._id === currentUser.id && (
                    <button
                      onClick={() => handleDeleteGroup(selectedGroup._id)}
                      className="px-4 py-2 border border-red-600 bg-white hover:bg-red-50 text-sm text-red-600 cursor-pointer"
                    >
                      Delete group
                    </button>
                  )}
              </div>
            </div>

            <div className="flex gap-6">
              {/* Add expense form */}
              <div className="w-80">
                <h3 className="text-lg font-semibold mb-4">Add expense</h3>
                <form onSubmit={handleAddExpense} className="space-y-3">
                  <select
                    value={expensePaidBy}
                    onChange={(e) => setExpensePaidBy(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-400 bg-white"
                  >
                    {selectedGroup.members.map((member) => (
                      <option key={member.userId._id} value={member.userId._id}>
                        {member.userId.name} paid
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full p-2 border border-gray-400 bg-white"
                  />

                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Amount"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-400 bg-white"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "1",
                      "2",
                      "3",
                      "4",
                      "5",
                      "6",
                      "7",
                      "8",
                      "9",
                      ".",
                      "0",
                      "back",
                    ].map((key) => (
                      <button
                        key={key}
                        type="button"
                        className="py-2 border border-gray-300 bg-white hover:bg-gray-50 text-sm cursor-pointer"
                        onClick={() =>
                          handleKeypadPress(key === "back" ? "back" : key)
                        }
                      >
                        {key === "back" ? "⌫" : key}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 border border-gray-300 bg-white hover:bg-gray-50 text-sm cursor-pointer"
                    onClick={() => handleKeypadPress("clear")}
                  >
                    Clear
                  </button>

                  <div className="space-y-2 border border-gray-400 bg-white p-2 max-h-28 overflow-y-auto">
                    {selectedGroup.members.map((member) => {
                      const id = member.userId._id;
                      const checked = expenseParticipants.includes(id);
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            className="cursor-pointer"
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setExpenseParticipants((prev) =>
                                prev.includes(id)
                                  ? prev.filter((pid) => pid !== id)
                                  : [...prev, id]
                              );
                            }}
                          />
                          <span>{member.userId.name}</span>
                        </label>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-1 border border-gray-800 bg-white cursor-pointer hover:bg-gray-50"
                  >
                    add
                  </button>
                </form>
              </div>

              {/* Expenses list */}
              <div className="flex-1 border-l-2 border-dashed border-gray-800 pl-6">
                <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense._id}
                      className="flex justify-between text-sm font-receipt mb-4 border p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <span>{expense.paidBy.name.toUpperCase()}</span>
                      <span>{expense.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balance summary */}
              <div className="border-l-2 border-dashed border-gray-800 pl-6 w-96">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold"></h3>
                  {balanceError && (
                    <span className="text-xs text-red-600">{balanceError}</span>
                  )}
                </div>

                {balanceResult ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Suggested settlements
                    </h3>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
