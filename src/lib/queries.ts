import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { mockDb } from "./mock-db";

const isDemo = () => typeof window !== "undefined" && localStorage.getItem("demo_mode");

export const residentsQuery = queryOptions({
  queryKey: ["residents"],
  queryFn: async () => {
    if (isDemo()) return mockDb.getResidents();
    const { data, error } = await supabase.from("residents").select("*").order("flat_number");
    if (error && error.code !== "PGRST205") throw error;
    return (data ?? []) as Resident[];
  },
});

export const incomesQuery = queryOptions({
  queryKey: ["incomes"],
  queryFn: async () => {
    if (isDemo()) return mockDb.getIncomes();
    const { data, error } = await supabase
      .from("incomes")
      .select("*")
      .order("paid_at", { ascending: false });
    if (error && error.code !== "PGRST205") throw error;
    return (data ?? []) as Income[];
  },
});

export const expensesQuery = queryOptions({
  queryKey: ["expenses"],
  queryFn: async () => {
    if (isDemo()) return mockDb.getExpenses();
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("spent_at", { ascending: false });
    if (error && error.code !== "PGRST205") throw error;
    return (data ?? []) as Expense[];
  },
});

export const activitiesQuery = queryOptions({
  queryKey: ["activities"],
  queryFn: async () => {
    if (isDemo()) return mockDb.getActivities();
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error && error.code !== "PGRST205") throw error;
    return (data ?? []) as Tables<"activities">[];
  },
});

export const notificationsQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: async () => {
    if (isDemo()) return mockDb.getNotifications();
    const { data, error } = await (supabase as any)
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error && error.code !== "PGRST205") throw error;
    return (data ?? []) as NotificationItem[];
  },
});

export const societiesQuery = queryOptions({
  queryKey: ["societies"],
  queryFn: async () => {
    if (isDemo()) return mockDb.getSociety();
    const { data, error } = await (supabase as any).from("societies").select("*").maybeSingle();
    if (error && error.code !== "PGRST205") throw error;
    return data as Society | null;
  },
});

export const reportsQuery = queryOptions({
  queryKey: ["reports"],
  queryFn: async () => {
    if (isDemo()) return mockDb.getReports();
    const { data, error } = await (supabase as any)
      .from("reports")
      .select("*")
      .order("generated_at", { ascending: false });
    if (error && error.code !== "PGRST205") throw error;
    return (data ?? []) as ReportItem[];
  },
});

export type Resident = Tables<"residents"> & {
  email?: string | null;
  occupancy_status?: string | null;
  maintenance_status?: string | null;
  due_amount?: number | null;
  last_payment?: string | null;
};
export type Income = Tables<"incomes"> & {
  remarks?: string | null;
  income_source?: string | null;
  late_fee?: number | null;
};
export type Expense = Tables<"expenses"> & { invoice_url?: string | null };
export type Activity = Tables<"activities">;
export type NotificationItem = {
  id: string;
  created_at: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  meta: any;
};
export type Society = {
  id: string;
  name: string;
  registration_number: string;
  address: string;
  financial_year: string;
  maintenance_amount: number;
  reserve_percentage: number;
  emergency_percentage: number;
  theme: string;
};
export type ReportItem = { id: string; kind: string; range: string; generated_at: string };
