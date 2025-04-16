from fastapi import APIRouter, Request, status, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError
from mysql.connector import Error as MYSQLError
from schemas import (
    Expense,
    CreateExpense,
    UpdateExpense,
    User,
    BaseSuccessResponse,
    BaseErrorResponse,
)
from db.db import create_connection
from utils.logger import logger
from json import loads as json_loads

router = APIRouter(prefix="/expense")
conn = create_connection()


class ExpenseSuccessResponse(BaseSuccessResponse):
    results: Expense


class ExpensesSuccessResponse(BaseSuccessResponse):
    results: list[Expense]


column_names = [
    "expense_id",
    "user_id",
    "amount",
    "description",
    "expense_date",
    "created_at",
]


@router.get(
    "/get_expense/{expense_id}",
    responses={
        200: {"model": ExpenseSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_expense(expense_id: int, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM expenses WHERE expense_id = %s AND user_id = %s",
                (expense_id, vuser.user_id),
            )
            row = cursor.fetchone()
            cursor.close()

            if not row:
                return not_found_response(f"Expense ID {expense_id} not found")

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    ExpenseSuccessResponse(
                        success=True,
                        message="Expense fetched successfully",
                        results=Expense(**dict(zip(column_names, row))),
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.get(
    "/get_expenses",
    responses={
        200: {"model": ExpensesSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_expenses(request: Request, expense_ids: str = Query(...)):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            expense_ids = json_loads(expense_ids)
            placeholders = ", ".join(["%s"] * len(expense_ids))
            cursor = conn.cursor()
            cursor.execute(
                f"SELECT * FROM expenses WHERE expense_id IN ({placeholders}) AND user_id = %s",
                tuple(expense_ids) + (vuser.user_id,),
            )
            rows = cursor.fetchall()
            cursor.close()

            if not rows:
                return not_found_response(f"No expenses found for IDs {expense_ids}")

            expenses = [Expense(**dict(zip(column_names, row))) for row in rows]
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    ExpensesSuccessResponse(
                        success=True, message="Expenses fetched", results=expenses
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.get(
    "/get_all_expenses",
    responses={
        200: {"model": ExpensesSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_all_expenses(request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM expenses WHERE user_id = %s", (vuser.user_id,)
            )
            rows = cursor.fetchall()
            cursor.close()

            if not rows:
                return not_found_response(
                    f"No expenses found for user ID {vuser.user_id}"
                )

            expenses = [Expense(**dict(zip(column_names, row))) for row in rows]
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    ExpensesSuccessResponse(
                        success=True, message="All expenses fetched", results=expenses
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.post(
    "/post_expense",
    responses={
        200: {"model": ExpenseSuccessResponse},
        422: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def create_expense(expense_data: CreateExpense, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO expenses (user_id, amount, description, expense_date) VALUES (%s, %s, %s, %s)",
                (
                    expense_data.user_id,
                    expense_data.amount,
                    expense_data.description,
                    expense_data.expense_date,
                ),
            )
            conn.commit()

            expense_id = cursor.lastrowid
            cursor.execute(
                "SELECT * FROM expenses WHERE expense_id = %s", (expense_id,)
            )
            row = cursor.fetchone()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    ExpenseSuccessResponse(
                        success=True,
                        message="Expense created",
                        results=Expense(**dict(zip(column_names, row))),
                    ).model_dump(),
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.put(
    "/put_expense",
    responses={
        200: {"model": ExpenseSuccessResponse},
        404: {"model": BaseErrorResponse},
        422: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def update_expense(update_data: UpdateExpense, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            uud = update_data.model_dump(exclude_none=True)
            expense_id = uud.get("expense_id")

            if not expense_id:
                return validation_error_response("expense_id is required")

            update_fields = {k: v for k, v in uud.items() if k != "expense_id"}
            if not update_fields:
                return validation_error_response("No fields provided to update")

            set_clause = ", ".join(f"{k} = %s" for k in update_fields)
            values = tuple(update_fields.values()) + (expense_id,)
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE expenses SET {set_clause} WHERE expense_id = %s", values
            )
            conn.commit()

            if cursor.rowcount == 0:
                cursor.close()
                return not_found_response(
                    f"Expense ID {expense_id} not found or not updated"
                )

            cursor.execute(
                "SELECT * FROM expenses WHERE expense_id = %s", (expense_id,)
            )
            row = cursor.fetchone()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    ExpenseSuccessResponse(
                        success=True,
                        message="Expense updated",
                        results=Expense(**dict(zip(column_names, row))),
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.delete(
    "/delete_expense/{expense_id}",
    responses={
        200: {"model": ExpenseSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def delete_expense(expense_id: int, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM expenses WHERE expense_id = %s", (expense_id,)
            )
            row = cursor.fetchone()

            if not row:
                cursor.close()
                return not_found_response(f"Expense ID {expense_id} not found")

            expense = Expense(**dict(zip(column_names, row)))
            cursor.execute("DELETE FROM expenses WHERE expense_id = %s", (expense_id,))
            conn.commit()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    ExpenseSuccessResponse(
                        success=True, message="Expense deleted", results=expense
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


# Common Error Responses
def error_response(e: Exception):
    return JSONResponse(
        status_code=500,
        content=BaseErrorResponse(
            success=False, errorType=type(e).__name__, error=str(e)
        ).model_dump(),
    )


def auth_error_response():
    return JSONResponse(
        status_code=401,
        content=BaseErrorResponse(
            success=False, errorType="AuthRequired", error="User is not authenticated."
        ).model_dump(),
    )


def validation_error_response(msg: str):
    return JSONResponse(
        status_code=422,
        content=BaseErrorResponse(
            success=False, errorType="ValidationError", error=msg
        ).model_dump(),
    )


def not_found_response(msg: str):
    return JSONResponse(
        status_code=404,
        content=BaseErrorResponse(
            success=False, errorType="NotFoundError", error=msg
        ).model_dump(),
    )
