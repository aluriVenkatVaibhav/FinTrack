from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from mysql.connector import Error as MYSQLError
from schemas import (
    Budget,
    CreateBudget,
    UpdateBudget,
    User,
    BaseSuccessResponse,
    BaseErrorResponse,
)
from db.db import create_connection
from utils.logger import logger
from json import loads as json_loads

router = APIRouter(prefix="/budget")
conn = create_connection()


class BudgetSuccessResponse(BaseSuccessResponse):
    results: Budget


class BudgetsSuccessResponse(BaseSuccessResponse):
    results: list[Budget]


column_names = [
    "budget_id",
    "user_id",
    "amount",
    "start_date",
    "end_date",
    "created_at",
]


@router.get(
    "/get_budget/{budget_id}",
    responses={
        200: {"model": BudgetSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_budget(budget_id: int, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM budgets WHERE budget_id = %s AND user_id = %s",
                (budget_id, vuser.user_id),
            )
            row = cursor.fetchone()
            cursor.close()

            if not row:
                return not_found_response(f"Budget ID {budget_id} not found")

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    BudgetSuccessResponse(
                        success=True,
                        message="Budget fetched successfully",
                        results=Budget(**dict(zip(column_names, row))),
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
    "/get_budgets",
    responses={
        200: {"model": BudgetsSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_budgets(request: Request, budget_ids: str):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            budget_ids = json_loads(budget_ids)
            placeholders = ", ".join(["%s"] * len(budget_ids))
            cursor = conn.cursor()
            cursor.execute(
                f"SELECT * FROM budgets WHERE budget_id IN ({placeholders}) AND user_id = %s",
                tuple(budget_ids) + (vuser.user_id,),
            )
            rows = cursor.fetchall()
            cursor.close()

            if not rows:
                return not_found_response(f"No budgets found for IDs {budget_ids}")

            budgets = [Budget(**dict(zip(column_names, row))) for row in rows]
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    BudgetsSuccessResponse(
                        success=True,
                        message="Budgets fetched",
                        results=budgets,
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
    "/get_all_budgets",
    responses={
        200: {"model": BudgetsSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_user_budgets(request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM budgets WHERE user_id = %s",
                (vuser.user_id,),
            )
            rows = cursor.fetchall()
            cursor.close()

            if not rows:
                return not_found_response(
                    f"No budgets found for user ID {vuser.user_id}"
                )

            budgets = [Budget(**dict(zip(column_names, row))) for row in rows]
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    BudgetsSuccessResponse(
                        success=True,
                        message="User budgets fetched successfully",
                        results=budgets,
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
    "/post_budget",
    responses={
        200: {"model": BudgetSuccessResponse},
        422: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def create_budget(budget_data: CreateBudget, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO budgets (user_id, amount, start_date, end_date) VALUES (%s, %s, %s, %s)",
                (
                    budget_data.user_id,
                    budget_data.amount,
                    budget_data.start_date,
                    budget_data.end_date,
                ),
            )
            conn.commit()

            budget_id = cursor.lastrowid
            cursor.execute(
                "SELECT * FROM budgets WHERE budget_id = %s",
                (budget_id,),
            )
            row = cursor.fetchone()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    BudgetSuccessResponse(
                        success=True,
                        message="Budget created",
                        results=Budget(**dict(zip(column_names, row))),
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.put(
    "/put_budget",
    responses={
        200: {"model": BudgetSuccessResponse},
        404: {"model": BaseErrorResponse},
        422: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def update_budget(update_data: UpdateBudget, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            uud = update_data.model_dump(exclude_none=True)
            budget_id = uud.get("budget_id")

            if not budget_id:
                return validation_error_response("budget_id is required")

            update_fields = {k: v for k, v in uud.items() if k != "budget_id"}
            if not update_fields:
                return validation_error_response("No fields provided to update")

            set_clause = ", ".join(f"{k} = %s" for k in update_fields)
            values = tuple(update_fields.values()) + (budget_id,)
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE budgets SET {set_clause} WHERE budget_id = %s",
                values,
            )
            conn.commit()

            if cursor.rowcount == 0:
                cursor.close()
                return not_found_response(
                    f"Budget ID {budget_id} not found or not updated"
                )

            cursor.execute(
                "SELECT * FROM budgets WHERE budget_id = %s",
                (budget_id,),
            )
            row = cursor.fetchone()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    BudgetSuccessResponse(
                        success=True,
                        message="Budget updated",
                        results=Budget(**dict(zip(column_names, row))),
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
    "/delete_budget/{budget_id}",
    responses={
        200: {"model": BudgetSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def delete_budget(budget_id: int, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM budgets WHERE budget_id = %s",
                (budget_id,),
            )
            row = cursor.fetchone()

            if not row:
                cursor.close()
                return not_found_response(f"Budget ID {budget_id} not found")

            budget = Budget(**dict(zip(column_names, row)))
            cursor.execute("DELETE FROM budgets WHERE budget_id = %s", (budget_id,))
            conn.commit()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    BudgetSuccessResponse(
                        success=True,
                        message="Budget deleted",
                        results=budget,
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


# Reuse shared utilities from transaction router
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
