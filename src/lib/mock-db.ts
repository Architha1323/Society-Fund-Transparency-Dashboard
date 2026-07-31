import {
  Resident,
  Income,
  Expense,
  Activity,
  NotificationItem,
  Society,
  ReportItem,
} from "./queries";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

const MOCK_STORAGE_KEY = "vaultly_demo_db";

interface MockDatabase {
  residents: Resident[];
  incomes: Income[];
  expenses: Expense[];
  activities: Activity[];
  notifications: NotificationItem[];
  societies: Society[];
  reports: ReportItem[];
}

const generateId = () => crypto.randomUUID();

const initialData: MockDatabase = {
  societies: [
    {
      id: "soc-1",
      name: "Green Valley Residency",
      registration_number: "REG-2023-8901",
      address: "123 Green Valley Road, Pune, 411045",
      financial_year: "FY 2026-27",
      maintenance_amount: 4500,
      reserve_percentage: 35,
      emergency_percentage: 15,
      theme: "dark",
    },
  ],
  residents: [
    {
      id: "res-1",
      name: "Rahul Sharma",
      flat_number: "A-101",
      tower: "Tower A",
      contact: "9876543210",
      monthly_maintenance: 4500,
      avatar_hue: 200,
      join_date: "2024-01-15",
      owner_type: "Owner",
      created_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "res-2",
      name: "Priya Patel",
      flat_number: "B-205",
      tower: "Tower B",
      contact: "8765432109",
      monthly_maintenance: 4500,
      avatar_hue: 45,
      join_date: "2024-03-20",
      owner_type: "Tenant",
      created_at: "2024-03-20T11:30:00Z",
    },
    {
      id: "res-3",
      name: "Amit Kumar",
      flat_number: "C-402",
      tower: "Tower C",
      contact: "7654321098",
      monthly_maintenance: 4500,
      avatar_hue: 120,
      join_date: "2023-11-05",
      owner_type: "Owner",
      created_at: "2023-11-05T09:15:00Z",
    },
  ],
  incomes: [
    {
      id: "inc-1",
      resident_id: "res-1",
      resident_name: "Rahul Sharma",
      flat_number: "A-101",
      amount: 4500,
      mode: "UPI",
      status: "Paid",
      txn_id: "UPI987654321",
      paid_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      note: "Monthly maintenance",
    },
    {
      id: "inc-2",
      resident_id: "res-2",
      resident_name: "Priya Patel",
      flat_number: "B-205",
      amount: 4500,
      mode: "Bank Transfer",
      status: "Paid",
      txn_id: "IMPS87654321",
      paid_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      note: "Monthly maintenance",
    },
    {
      id: "inc-3",
      resident_id: "res-3",
      resident_name: "Amit Kumar",
      flat_number: "C-402",
      amount: 4500,
      mode: "Cash",
      status: "Pending",
      txn_id: null,
      paid_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      note: "Promised by next week",
    },
  ],
  expenses: [
    {
      id: "exp-1",
      category: "Security",
      vendor: "SafeGuard Pros",
      amount: 25000,
      spent_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      invoice_no: "INV-102",
      note: "Monthly security contract",
      budgeted: 25000,
      invoice_url: null,
    },
    {
      id: "exp-2",
      category: "Maintenance",
      vendor: "FixIt Electricals",
      amount: 4500,
      spent_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      invoice_no: "FE-554",
      note: "Common area lighting repair",
      budgeted: 5000,
      invoice_url: null,
    },
  ],
  activities: [
    {
      id: "act-1",
      kind: "income",
      actor: "treasurer",
      description: "Added income for Rahul Sharma",
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      meta: { income_id: "inc-1", amount: 4500 },
    },
    {
      id: "act-2",
      kind: "expense",
      actor: "treasurer",
      description: "Added expense for SafeGuard Pros",
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      meta: { expense_id: "exp-1", amount: 25000 },
    },
  ],
  notifications: [
    {
      id: "notif-1",
      title: "income",
      message: "Income received from Rahul Sharma",
      type: "income",
      read: false,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      meta: { income_id: "inc-1" },
    },
    {
      id: "notif-2",
      title: "expense",
      message: "Expense approved for SafeGuard Pros",
      type: "expense",
      read: false,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      meta: { expense_id: "exp-1" },
    },
  ],
  reports: [],
};

class LocalMockDB {
  private get data(): MockDatabase {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }

  private set data(newData: MockDatabase) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newData));
  }

  // --- Queries ---

  getResidents(): Resident[] {
    return this.data.residents;
  }
  getIncomes(): Income[] {
    return this.data.incomes.sort(
      (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime(),
    );
  }
  getExpenses(): Expense[] {
    return this.data.expenses.sort(
      (a, b) => new Date(b.spent_at).getTime() - new Date(a.spent_at).getTime(),
    );
  }
  getActivities(): Activity[] {
    return this.data.activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);
  }
  getNotifications(): NotificationItem[] {
    return this.data.notifications
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);
  }
  getSociety(): Society | null {
    return this.data.societies[0] || null;
  }
  getReports(): ReportItem[] {
    return this.data.reports.sort(
      (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime(),
    );
  }

  // --- Mutations ---

  createResident(input: TablesInsert<"residents">): Resident {
    const d = this.data;
    const newResident: Resident = {
      id: input.id || generateId(),
      name: input.name,
      flat_number: input.flat_number,
      tower: input.tower,
      contact: input.contact ?? null,
      monthly_maintenance: input.monthly_maintenance ?? 4500,
      owner_type: input.owner_type ?? "Owner",
      avatar_hue: input.avatar_hue ?? 220,
      join_date: input.join_date ?? new Date().toISOString(),
      created_at: input.created_at ?? new Date().toISOString(),
    };
    d.residents.push(newResident);
    this.data = d;
    return newResident;
  }

  updateResident(id: string, updates: TablesUpdate<"residents">): Resident {
    const d = this.data;
    const index = d.residents.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Resident not found");
    d.residents[index] = { ...d.residents[index], ...updates } as Resident;
    this.data = d;
    return d.residents[index];
  }

  deleteResident(id: string) {
    const d = this.data;
    d.residents = d.residents.filter((r) => r.id !== id);
    this.data = d;
  }

  createIncome(input: TablesInsert<"incomes">): Income {
    const d = this.data;
    const newIncome: Income = {
      id: input.id || generateId(),
      resident_id: input.resident_id ?? null,
      resident_name: input.resident_name,
      flat_number: input.flat_number,
      amount: input.amount,
      mode: input.mode ?? "UPI",
      status: input.status ?? "Paid",
      txn_id: input.txn_id ?? null,
      note: input.note ?? null,
      paid_at: input.paid_at ?? new Date().toISOString(),
      created_at: input.created_at ?? new Date().toISOString(),
    };
    d.incomes.push(newIncome);
    this.data = d;
    return newIncome;
  }

  updateIncome(id: string, updates: TablesUpdate<"incomes">): Income {
    const d = this.data;
    const index = d.incomes.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Income not found");
    d.incomes[index] = { ...d.incomes[index], ...updates } as Income;
    this.data = d;
    return d.incomes[index];
  }

  deleteIncome(id: string) {
    const d = this.data;
    d.incomes = d.incomes.filter((i) => i.id !== id);
    this.data = d;
  }

  createExpense(input: TablesInsert<"expenses">): Expense {
    const d = this.data;
    const newExpense: Expense = {
      id: input.id || generateId(),
      category: input.category,
      vendor: input.vendor,
      amount: input.amount,
      spent_at: input.spent_at ?? new Date().toISOString(),
      created_at: input.created_at ?? new Date().toISOString(),
      invoice_no: input.invoice_no ?? null,
      note: input.note ?? null,
      budgeted: input.budgeted ?? null,
      invoice_url: null,
    };
    d.expenses.push(newExpense);
    this.data = d;
    return newExpense;
  }

  updateExpense(id: string, updates: TablesUpdate<"expenses">): Expense {
    const d = this.data;
    const index = d.expenses.findIndex((e) => e.id === id);
    if (index === -1) throw new Error("Expense not found");
    d.expenses[index] = { ...d.expenses[index], ...updates } as Expense;
    this.data = d;
    return d.expenses[index];
  }

  deleteExpense(id: string) {
    const d = this.data;
    d.expenses = d.expenses.filter((e) => e.id !== id);
    this.data = d;
  }

  logActivity(kind: string, description: string, meta?: Record<string, unknown>, actor?: string) {
    const d = this.data;
    d.activities.push({
      id: generateId(),
      kind,
      actor: actor ?? "system",
      description,
      meta: (meta as any) ?? {},
      created_at: new Date().toISOString(),
    });
    this.data = d;
  }

  createNotification(message: string, type: string, meta?: Record<string, unknown>) {
    const d = this.data;
    d.notifications.push({
      id: generateId(),
      title: type,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
      meta: (meta as any) ?? {},
    });
    this.data = d;
  }

  markNotificationRead(id: string) {
    const d = this.data;
    const index = d.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      d.notifications[index].read = true;
      this.data = d;
    }
  }

  generateReport(kind: string, range: string): ReportItem {
    const d = this.data;
    const report: ReportItem = {
      id: generateId(),
      kind,
      range,
      generated_at: new Date().toISOString(),
    };
    d.reports.push(report);
    this.data = d;
    return report;
  }
}

export const mockDb = new LocalMockDB();
