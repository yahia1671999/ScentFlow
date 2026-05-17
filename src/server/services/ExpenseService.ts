import { ExpenseRepository } from "../repositories/index.js";
import { Expense } from "../types.js";

export class ExpenseService {
  constructor(private expenseRepository: ExpenseRepository) {}

  getAllExpenses(tenantId: string) {
    return this.expenseRepository.findAll(tenantId);
  }

  createExpense(data: any) {
    if (!data.tenantId) throw new Error("tenantId is required");
    const expense: Expense = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      date: new Date().toISOString()
    };
    this.expenseRepository.create(expense);
    return expense;
  }
}
