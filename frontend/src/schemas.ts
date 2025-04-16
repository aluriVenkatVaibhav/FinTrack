import * as yup from "yup";

// User Models
export const BaseUserModelSchema = yup.object({
    username: yup.string().notRequired(),
    email: yup.string().email().notRequired(),
});

export const UserSchema = yup.object({
    user_id: yup.number().required(),
    username: yup.string().required(),
    email: yup.string().email().required(),
    password_hash: yup.string().required(),
    created_at: yup.date().required(),
    updated_at: yup.date().required(),
});

export const CreateUserSchema = yup.object({
    username: yup.string().required(),
    email: yup.string().email().required(),
    password: yup.string().required(),
});

export const UpdateUserSchema = yup.object({
    user_id: yup.number().required(),
    username: yup.string().notRequired(),
    email: yup.string().email().notRequired(),
    password: yup.string().notRequired(),
});

export type BaseUserModel = yup.InferType<typeof BaseUserModelSchema>;
export type User = yup.InferType<typeof UserSchema>;
export type CreateUser = yup.InferType<typeof CreateUserSchema>;
export type UpdateUser = yup.InferType<typeof UpdateUserSchema>;

// Income Models
export const BaseIncomeModelSchema = yup.object({
    income_id: yup.number().notRequired(),
    user_id: yup.number().notRequired(),
    amount: yup.number().notRequired(),
    description: yup.string().notRequired(),
    income_date: yup.date().notRequired(),
    created_at: yup.date().notRequired(),
});

export const IncomeSchema = BaseIncomeModelSchema.shape({
    income_id: yup.number().required(),
    user_id: yup.number().required(),
    amount: yup.number().required(),
    description: yup.string().required(),
    income_date: yup.date().required(),
    created_at: yup.date().required(),
});

export const CreateIncomeSchema = yup.object({
    user_id: yup.number().required(),
    amount: yup.number().required(),
    description: yup.string().notRequired(),
    income_date: yup.date().required(),
});

export const UpdateIncomeSchema = yup.object({
    income_id: yup.number().required(),
    user_id: yup.number().notRequired(),
    amount: yup.number().notRequired(),
    description: yup.string().notRequired(),
    income_date: yup.date().notRequired(),
});

export type BaseIncomeModel = yup.InferType<typeof BaseIncomeModelSchema>;
export type Income = yup.InferType<typeof IncomeSchema>;
export type CreateIncome = yup.InferType<typeof CreateIncomeSchema>;
export type UpdateIncome = yup.InferType<typeof UpdateIncomeSchema>;

// Expense Models
export const BaseExpenseModelSchema = yup.object({
    expense_id: yup.number().notRequired(),
    user_id: yup.number().notRequired(),
    amount: yup.number().notRequired(),
    description: yup.string().notRequired(),
    expense_date: yup.date().notRequired(),
    created_at: yup.date().notRequired(),
});

export const ExpenseSchema = BaseExpenseModelSchema.shape({
    expense_id: yup.number().required(),
    user_id: yup.number().required(),
    amount: yup.number().required(),
    expense_date: yup.date().required(),
    created_at: yup.date().required(),
});

export const CreateExpenseSchema = yup.object({
    user_id: yup.number().required(),
    amount: yup.number().required(),
    description: yup.string().notRequired(),
    expense_date: yup.date().required(),
});

export const UpdateExpenseSchema = yup.object({
    expense_id: yup.number().required(),
    user_id: yup.number().notRequired(),
    amount: yup.number().notRequired(),
    description: yup.string().notRequired(),
    expense_date: yup.date().notRequired(),
});

export type BaseExpenseModel = yup.InferType<typeof BaseExpenseModelSchema>;
export type Expense = yup.InferType<typeof ExpenseSchema>;
export type CreateExpense = yup.InferType<typeof CreateExpenseSchema>;
export type UpdateExpense = yup.InferType<typeof UpdateExpenseSchema>;

// Transaction Models
export const TransactionTypeEnum = yup.mixed().oneOf(["income", "expense"]);

export const BaseTransactionModelSchema = yup.object({
    transaction_id: yup.number().notRequired(),
    user_id: yup.number().notRequired(),
    amount: yup.number().notRequired(),
    description: yup.string().notRequired(),
    transaction_date: yup.date().notRequired(),
    type: TransactionTypeEnum.notRequired(),
    created_at: yup.date().notRequired(),
});

export const TransactionSchema = BaseTransactionModelSchema.shape({
    transaction_id: yup.number().required(),
    user_id: yup.number().required(),
    amount: yup.number().required(),
    transaction_date: yup.date().required(),
    type: TransactionTypeEnum.required(),
    created_at: yup.date().required(),
});

export const CreateTransactionSchema = yup.object({
    user_id: yup.number().required(),
    amount: yup.number().required(),
    description: yup.string().notRequired(),
    transaction_date: yup.date().required(),
    type: TransactionTypeEnum.required(),
});

export const UpdateTransactionSchema = yup.object({
    transaction_id: yup.number().required(),
    user_id: yup.number().notRequired(),
    amount: yup.number().notRequired(),
    description: yup.string().notRequired(),
    transaction_date: yup.date().notRequired(),
    type: TransactionTypeEnum.notRequired(),
});

export type BaseTransactionModel = yup.InferType<typeof BaseTransactionModelSchema>;
export type Transaction = yup.InferType<typeof TransactionSchema>;
export type CreateTransaction = yup.InferType<typeof CreateTransactionSchema>;
export type UpdateTransaction = yup.InferType<typeof UpdateTransactionSchema>;

// Budget Models
export const BaseBudgetModelSchema = yup.object({
    budget_id: yup.number().notRequired(),
    user_id: yup.number().notRequired(),
    amount: yup.number().notRequired(),
    start_date: yup.date().notRequired(),
    end_date: yup.date().notRequired(),
    created_at: yup.date().notRequired(),
});

export const BudgetSchema = BaseBudgetModelSchema.shape({
    budget_id: yup.number().required(),
    user_id: yup.number().required(),
    amount: yup.number().required(),
    start_date: yup.date().required(),
    end_date: yup.date().required(),
    created_at: yup.date().required(),
});

export const CreateBudgetSchema = yup.object({
    user_id: yup.number().required(),
    amount: yup.number().required(),
    start_date: yup.date().required(),
    end_date: yup.date().required(),
});

export const UpdateBudgetSchema = yup.object({
    budget_id: yup.number().required(),
    user_id: yup.number().notRequired(),
    amount: yup.number().notRequired(),
    start_date: yup.date().notRequired(),
    end_date: yup.date().notRequired(),
});

export type BaseBudgetModel = yup.InferType<typeof BaseBudgetModelSchema>;
export type Budget = yup.InferType<typeof BudgetSchema>;
export type CreateBudget = yup.InferType<typeof CreateBudgetSchema>;
export type UpdateBudget = yup.InferType<typeof UpdateBudgetSchema>;

// Savings Goal Models
export const BaseSavingsGoalModelSchema = yup.object({
    goal_id: yup.number().notRequired(),
    user_id: yup.number().notRequired(),
    name: yup.string().notRequired(),
    target_amount: yup.number().notRequired(),
    current_amount: yup.number().notRequired(),
    target_date: yup.date().notRequired(),
    created_at: yup.date().notRequired(),
    updated_at: yup.date().notRequired(),
});

export const SavingsGoalSchema = BaseSavingsGoalModelSchema.shape({
    goal_id: yup.number().required(),
    user_id: yup.number().required(),
    name: yup.string().required(),
    target_amount: yup.number().required(),
    current_amount: yup.number().required(),
    target_date: yup.date().notRequired(),
    created_at: yup.date().required(),
    updated_at: yup.date().required(),
});

export const CreateSavingsGoalSchema = yup.object({
    user_id: yup.number().required(),
    name: yup.string().required(),
    target_amount: yup.number().required(),
    current_amount: yup.number().default(0.0),
    target_date: yup.date().required(),
});

export const UpdateSavingsGoalSchema = yup.object({
    goal_id: yup.number().required(),
    user_id: yup.number().notRequired(),
    name: yup.string().notRequired(),
    target_amount: yup.number().notRequired(),
    current_amount: yup.number().notRequired(),
    target_date: yup.date().notRequired(),
});

export type BaseSavingsGoalModel = yup.InferType<typeof BaseSavingsGoalModelSchema>;
export type SavingsGoal = yup.InferType<typeof SavingsGoalSchema>;
export type CreateSavingsGoal = yup.InferType<typeof CreateSavingsGoalSchema>;
export type UpdateSavingsGoal = yup.InferType<typeof UpdateSavingsGoalSchema>;
