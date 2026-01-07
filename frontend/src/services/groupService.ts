const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface Group {
  _id: string;
  name: string;
  description: string;
  members: Array<{
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    role: "admin" | "member";
    joinedAt: string;
  }>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface Expense {
  _id: string;
  groupId: string;
  amount: number;
  description: string;
  paidBy: {
    _id: string;
    name: string;
  };
  participants: Array<{
    _id: string;
    name: string;
  }>;
  date: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
}

export interface CreateExpenseData {
  groupId: string;
  amount: number;
  description: string;
  paidBy: string;
  participants: string[];
}

export interface Balance {
  userId: string;
  name: string;
  balance: number;
  totalPaid: number;
  totalShare: number;
}

export interface Settlement {
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

export const groupService = {
  async createGroup(data: CreateGroupData): Promise<Group> {
    const response = await fetch(`${API_URL}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create group");
    }

    return response.json();
  },

  async getUserGroups(): Promise<Group[]> {
    const response = await fetch(`${API_URL}/groups`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch groups");
    }

    return response.json();
  },

  async getGroupById(groupId: string): Promise<Group> {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch group");
    }

    return response.json();
  },

  async addMember(groupId: string, userEmail: string): Promise<Group> {
    const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ userEmail }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add member");
    }

    return response.json();
  },

  async getGroupBalances(groupId: string): Promise<BalanceResult> {
    const response = await fetch(`${API_URL}/groups/${groupId}/balances`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch balances");
    }

    return response.json();
  },

  async joinGroup(groupId: string): Promise<Group> {
    const response = await fetch(`${API_URL}/groups/${groupId}/join`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to join group");
    }

    return response.json();
  },

  async deleteGroup(groupId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete group");
    }

    return response.json();
  },
};

export const expenseService = {
  async createExpense(data: CreateExpenseData): Promise<Expense> {
    const response = await fetch(`${API_URL}/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create expense");
    }

    return response.json();
  },

  async getGroupExpenses(groupId: string): Promise<Expense[]> {
    const response = await fetch(`${API_URL}/expenses?groupId=${groupId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch expenses");
    }

    return response.json();
  },

  async deleteExpense(expenseId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete expense");
    }

    return response.json();
  },
};
