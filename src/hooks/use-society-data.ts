import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  expensesQuery,
  incomesQuery,
  notificationsQuery,
  residentsQuery,
  reportsQuery,
  societiesQuery,
} from "@/lib/queries";

export function useSocietyData() {
  const { data: residents } = useSuspenseQuery(residentsQuery);
  const { data: incomes } = useSuspenseQuery(incomesQuery);
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const { data: notifications } = useSuspenseQuery(notificationsQuery);
  const { data: reports } = useSuspenseQuery(reportsQuery);
  const { data: society } = useSuspenseQuery(societiesQuery);

  return useMemo(
    () => ({
      residents,
      incomes,
      expenses,
      notifications,
      reports,
      society,
    }),
    [residents, incomes, expenses, notifications, reports, society],
  );
}
