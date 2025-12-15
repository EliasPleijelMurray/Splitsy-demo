import { useEffect, useState } from "react";
import {
  groupService,
  expenseService,
  type Group,
  type Expense,
  type CreateGroupData,
  type CreateExpenseData,
} from "../services/groupService";

export const Dashboard = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);

  // New group form
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  // New expense form
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("");
  const [expenseParticipants, setExpenseParticipants] = useState<string[]>([]);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadExpenses(selectedGroup._id);
    }
  }, [selectedGroup]);

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
    } catch (error) {
      console.error("Failed to load expenses:", error);
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
      setExpenseAmount("");
      setExpenseDescription("");
      setExpensePaidBy("");
      setExpenseParticipants([]);
    } catch (error) {
      console.error("Failed to add expense:", error);
      alert("Failed to add expense");
    }
  };

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
            <h2 className="text-2xl font-semibold mb-6">
              {selectedGroup.name.toUpperCase()}
            </h2>

            <div className="flex gap-6">
              {/* Expenses list */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4">EXPENCES</h3>
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense._id}
                      className="flex justify-between text-sm"
                    >
                      <span>{expense.paidBy.name.toUpperCase()}</span>
                      <span>{expense.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
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
