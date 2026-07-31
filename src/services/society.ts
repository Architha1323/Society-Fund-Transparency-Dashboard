import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { mockDb } from "@/lib/mock-db";

export type AppRole = "admin" | "treasurer" | "resident";

const isDemo = () => typeof window !== "undefined" && localStorage.getItem("demo_mode");

const tableError = (label: string, error: { message?: string } | null) => {
  if (error) {
    console.error(`[society:${label}]`, error.message ?? error);
  }
};

export async function logActivity(
  kind: string,
  description: string,
  meta?: Record<string, unknown>,
  actor?: string,
) {
  if (isDemo()) {
    mockDb.logActivity(kind, description, meta, actor);
    return;
  }
  const actorName = actor ?? "system";
  const { error } = await supabase.from("activities").insert({
    kind,
    actor: actorName,
    description,
    meta: (meta as any) ?? {},
  });
  if (error) tableError("activity", error);
}

export async function createNotification(
  message: string,
  type: string,
  meta?: Record<string, unknown>,
) {
  if (isDemo()) {
    mockDb.createNotification(message, type, meta);
    return;
  }
  const { error } = await (supabase as any).from("notifications").insert({
    title: type,
    message,
    type,
    read: false,
    meta: (meta as any) ?? {},
  });
  if (error) tableError("notification", error);
}

export async function createIncome(input: TablesInsert<"incomes">) {
  if (isDemo()) {
    const data = mockDb.createIncome(input);
    await logActivity(
      "income",
      `Added income for ${input.resident_name}`,
      { income_id: data.id, amount: input.amount },
      "treasurer",
    );
    await createNotification(`Income received from ${input.resident_name}`, "income", {
      income_id: data.id,
    });
    return data;
  }
  const { data, error } = await supabase.from("incomes").insert(input).select().single();
  if (error) throw error;
  await logActivity(
    "income",
    `Added income for ${input.resident_name}`,
    { income_id: data.id, amount: input.amount },
    "treasurer",
  );
  await createNotification(`Income received from ${input.resident_name}`, "income", {
    income_id: data.id,
  });
  return data;
}

export async function updateIncome(id: string, updates: TablesUpdate<"incomes">) {
  if (isDemo()) {
    const data = mockDb.updateIncome(id, updates);
    await logActivity("income", `Updated income record`, { income_id: id }, "treasurer");
    return data;
  }
  const { data, error } = await supabase
    .from("incomes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await logActivity("income", `Updated income record`, { income_id: id }, "treasurer");
  return data;
}

export async function deleteIncome(id: string) {
  if (isDemo()) {
    mockDb.deleteIncome(id);
    await logActivity("income", `Deleted income record`, { income_id: id }, "treasurer");
    await createNotification("Income record deleted", "income", { income_id: id });
    return;
  }
  const { error } = await supabase.from("incomes").delete().eq("id", id);
  if (error) throw error;
  await logActivity("income", `Deleted income record`, { income_id: id }, "treasurer");
  await createNotification("Income record deleted", "income", { income_id: id });
}

export async function createExpense(input: TablesInsert<"expenses">) {
  if (isDemo()) {
    const data = mockDb.createExpense(input);
    await logActivity(
      "expense",
      `Added expense for ${input.vendor}`,
      { expense_id: data.id, amount: input.amount },
      "treasurer",
    );
    await createNotification(`Expense approved for ${input.vendor}`, "expense", {
      expense_id: data.id,
    });
    return data;
  }
  const { data, error } = await supabase.from("expenses").insert(input).select().single();
  if (error) throw error;
  await logActivity(
    "expense",
    `Added expense for ${input.vendor}`,
    { expense_id: data.id, amount: input.amount },
    "treasurer",
  );
  await createNotification(`Expense approved for ${input.vendor}`, "expense", {
    expense_id: data.id,
  });
  return data;
}

export async function updateExpense(id: string, updates: TablesUpdate<"expenses">) {
  if (isDemo()) {
    const data = mockDb.updateExpense(id, updates);
    await logActivity("expense", `Updated expense record`, { expense_id: id }, "treasurer");
    return data;
  }
  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await logActivity("expense", `Updated expense record`, { expense_id: id }, "treasurer");
  return data;
}

export async function deleteExpense(id: string) {
  if (isDemo()) {
    mockDb.deleteExpense(id);
    await logActivity("expense", `Deleted expense record`, { expense_id: id }, "treasurer");
    await createNotification("Expense record deleted", "expense", { expense_id: id });
    return;
  }
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
  await logActivity("expense", `Deleted expense record`, { expense_id: id }, "treasurer");
  await createNotification("Expense record deleted", "expense", { expense_id: id });
}

export async function uploadExpenseInvoice(file: File, expenseId: string) {
  if (isDemo()) {
    return URL.createObjectURL(file);
  }
  const path = `invoices/${expenseId}/${file.name}`;
  const { error } = await supabase.storage.from("invoices").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("invoices").getPublicUrl(path);
  return data.publicUrl;
}

export async function createResident(input: TablesInsert<"residents">) {
  if (isDemo()) {
    const data = mockDb.createResident(input);
    await logActivity(
      "resident",
      `Added resident ${input.name}`,
      { resident_id: data.id },
      "admin",
    );
    await createNotification(`Resident added: ${input.name}`, "resident", { resident_id: data.id });
    return data;
  }
  const { data, error } = await supabase.from("residents").insert(input).select().single();
  if (error) throw error;
  await logActivity("resident", `Added resident ${input.name}`, { resident_id: data.id }, "admin");
  await createNotification(`Resident added: ${input.name}`, "resident", { resident_id: data.id });
  return data;
}

export async function updateResident(id: string, updates: TablesUpdate<"residents">) {
  if (isDemo()) {
    const data = mockDb.updateResident(id, updates);
    await logActivity("resident", `Updated resident ${data.name}`, { resident_id: id }, "admin");
    return data;
  }
  const { data, error } = await supabase
    .from("residents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await logActivity("resident", `Updated resident ${data.name}`, { resident_id: id }, "admin");
  return data;
}

export async function deleteResident(id: string) {
  if (isDemo()) {
    mockDb.deleteResident(id);
    await logActivity("resident", `Deleted resident record`, { resident_id: id }, "admin");
    await createNotification("Resident record deleted", "resident", { resident_id: id });
    return;
  }
  const { error } = await supabase.from("residents").delete().eq("id", id);
  if (error) throw error;
  await logActivity("resident", `Deleted resident record`, { resident_id: id }, "admin");
  await createNotification("Resident record deleted", "resident", { resident_id: id });
}

export async function generateReport(kind: string, range: string) {
  if (isDemo()) {
    const data = mockDb.generateReport(kind, range);
    await logActivity(
      "report",
      `Generated ${kind} report`,
      { report_id: data.id, range },
      "treasurer",
    );
    await createNotification(`Report generated: ${kind}`, "report", { report_id: data.id });
    return data;
  }
  const { data, error } = await (supabase as any)
    .from("reports")
    .insert({
      kind,
      range,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity(
    "report",
    `Generated ${kind} report`,
    { report_id: data.id, range },
    "treasurer",
  );
  await createNotification(`Report generated: ${kind}`, "report", { report_id: data.id });
  return data;
}

export async function markNotificationRead(id: string) {
  if (isDemo()) {
    mockDb.markNotificationRead(id);
    return;
  }
  const { error } = await (supabase as any)
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function getCurrentUserRole(userId?: string): Promise<AppRole> {
  if (isDemo()) {
    return localStorage.getItem("demo_mode") === "admin@society.in" ? "treasurer" : "resident";
  }
  if (!userId) return "resident";
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.role) {
    const metadataRole = supabase.auth
      .getUser()
      .then(({ data }) => data.user?.user_metadata?.role) as unknown as Promise<string | undefined>;
    const role = await metadataRole;
    return (role as AppRole | undefined) ?? "resident";
  }
  return (data.role as unknown as AppRole) ?? "resident";
}

export function buildSimplePdf(text: string) {
  const lines = text.split("\n");
  const content = lines.map((line) => `${line}\n`).join("");
  const pdf = `%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n4 0 obj<< /Length 44 >>stream\nBT /F1 12 Tf 72 720 Td (${content.replace(/\(/g, "\\(").replace(/\)/g, "\\)")}) Tj ET\nendstream\nendobj\n5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000119 00000 n \n0000000206 00000 n \n0000000305 00000 n \ntrailer<< /Root 1 0 R /Size 6 >>\nstartxref\n0\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
