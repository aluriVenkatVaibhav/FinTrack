from fastapi import APIRouter, Request, status, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError
from mysql.connector import Error as MYSQLError
from schemas import (
    Income,
    User,
    CreateIncome,
    UpdateIncome,
    BaseSuccessResponse,
    BaseErrorResponse,
)
from db.db import create_connection
from utils.logger import logger
from json import loads as json_loads

router = APIRouter(prefix="/income")
conn = create_connection()


class IncomeSuccessResponse(BaseSuccessResponse):
    results: Income


class IncomesSuccessResponse(BaseSuccessResponse):
    results: list[Income]


column_names = [
    "income_id",
    "user_id",
    "amount",
    "description",
    "income_date",
    "created_at",
]


@router.get(
    "/get_income/{income_id}",
    responses={
        200: {"model": IncomeSuccessResponse, "description": "Income fetched"},
        404: {"model": BaseErrorResponse, "description": "Income not found"},
        500: {"model": BaseErrorResponse, "description": "Server error"},
    },
)
def get_income(income_id: int, request: Request):
    try:
        if conn:
            vuser: User = request.state.user

            if not vuser:
                return JSONResponse(
                    status_code=401,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="AuthRequired",
                        error="User is not authenticated.",
                    ).model_dump(),
                )
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM income WHERE income_id = %s and user_id=%s",
                (income_id, vuser.user_id),
            )
            row = cursor.fetchone()
            cursor.close()

            if not row:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="NotFoundError",
                        error=f"Income ID {income_id} not found",
                    ).model_dump(),
                )

            income = Income(**dict(zip(column_names, row)))
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=jsonable_encoder(
                    IncomeSuccessResponse(
                        success=True,
                        message="Income fetched successfully",
                        results=income,
                    ).model_dump()
                ),
            )

    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return validation_error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.get(
    "/get_incomes",
    responses={
        200: {"model": IncomesSuccessResponse, "description": "Incomes fetched"},
        404: {"model": BaseErrorResponse, "description": "No records"},
        500: {"model": BaseErrorResponse, "description": "Server error"},
    },
)
def get_incomes(request: Request, income_ids: str = Query(...)):
    try:
        if conn:
            vuser: User = request.state.user

            if not vuser:
                return JSONResponse(
                    status_code=401,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="AuthRequired",
                        error="User is not authenticated.",
                    ).model_dump(),
                )
            income_ids = json_loads(income_ids)
            cursor = conn.cursor()
            placeholders = ", ".join(["%s"] * len(income_ids))
            cursor.execute(
                f"SELECT * FROM income WHERE income_id IN ({placeholders})",
                tuple(income_ids),
            )
            rows = cursor.fetchall()
            cursor.close()

            if not rows:
                return JSONResponse(
                    status_code=404,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="NotFoundError",
                        error=f"No incomes found for IDs {income_ids}",
                    ).model_dump(),
                )

            incomes = [Income(**dict(zip(column_names, row))) for row in rows]
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    IncomesSuccessResponse(
                        success=True, message="Incomes fetched", results=incomes
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return validation_error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.get(
    "/get_all_incomes",
    responses={
        200: {
            "model": IncomesSuccessResponse,
            "description": "All incomes fetched",
        },
        500: {"model": BaseErrorResponse, "description": "Server error"},
    },
)
def get_all_incomes(request: Request):
    try:
        if conn:
            vuser: User = request.state.user

            if not vuser:
                return JSONResponse(
                    status_code=401,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="AuthRequired",
                        error="User is not authenticated.",
                    ).model_dump(),
                )

            cursor = conn.cursor()
            cursor.execute("SELECT * FROM income WHERE user_id = %s", (vuser.user_id,))
            rows = cursor.fetchall()
            cursor.close()

            if not rows:
                return JSONResponse(
                    status_code=404,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="NotFoundError",
                        error="No incomes found for the user.",
                    ).model_dump(),
                )

            incomes = [Income(**dict(zip(column_names, row))) for row in rows]
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    IncomesSuccessResponse(
                        success=True,
                        message="All incomes fetched",
                        results=incomes,
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return validation_error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.post(
    "/post_income",
    responses={
        200: {"model": IncomeSuccessResponse, "description": "Income created"},
        422: {"model": BaseErrorResponse, "description": "Validation error"},
        500: {"model": BaseErrorResponse, "description": "Server error"},
    },
)
def create_income(income_data: CreateIncome, request: Request):
    try:
        if conn:
            vuser: User = request.state.user

            if not vuser:
                return JSONResponse(
                    status_code=401,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="AuthRequired",
                        error="User is not authenticated.",
                    ).model_dump(),
                )
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO income (user_id, amount, description, income_date) VALUES (%s, %s, %s, %s)""",
                (
                    income_data.user_id,
                    income_data.amount,
                    income_data.description,
                    income_data.income_date,
                ),
            )
            conn.commit()

            income_id = cursor.lastrowid
            cursor.execute("SELECT * FROM income WHERE income_id = %s", (income_id,))
            row = cursor.fetchone()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    IncomeSuccessResponse(
                        success=True,
                        message="Income created",
                        results=Income(**dict(zip(column_names, row))),
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return validation_error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.put(
    "/put_income",
    responses={
        200: {"model": IncomeSuccessResponse, "description": "Income updated"},
        404: {"model": BaseErrorResponse, "description": "Income not found"},
        422: {"model": BaseErrorResponse, "description": "Validation error"},
        500: {"model": BaseErrorResponse, "description": "Server error"},
    },
)
def update_income(update_data: UpdateIncome, request: Request):
    try:
        if conn:
            vuser: User = request.state.user

            if not vuser:
                return JSONResponse(
                    status_code=401,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="AuthRequired",
                        error="User is not authenticated.",
                    ).model_dump(),
                )

            uud = update_data.model_dump(exclude_none=True)
            income_id = uud.get("income_id")

            if not income_id:
                return JSONResponse(
                    status_code=422,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="ValidationError",
                        error="income_id is required",
                    ).model_dump(),
                )

            update_fields = {k: v for k, v in uud.items() if k != "income_id"}
            if not update_fields:
                return JSONResponse(
                    status_code=422,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="ValidationError",
                        error="No fields provided to update",
                    ).model_dump(),
                )

            set_clause = ", ".join(f"{k} = %s" for k in update_fields.keys())
            values = tuple(update_fields.values()) + (income_id,)

            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE income SET {set_clause} WHERE income_id = %s", values
            )
            conn.commit()

            if cursor.rowcount == 0:
                cursor.close()
                return JSONResponse(
                    status_code=404,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="NotFoundError",
                        error=f"Income with ID {income_id} not found or nothing to updated.",
                    ).model_dump(),
                )

            cursor.execute("SELECT * FROM income WHERE income_id = %s", (income_id,))
            row = cursor.fetchone()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    IncomeSuccessResponse(
                        success=True,
                        message="Income updated",
                        results=Income(**dict(zip(column_names, row))),
                    ).model_dump()
                ),
            )

    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return validation_error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.delete(
    "/delete_income/{income_id}",
    responses={
        200: {"model": IncomeSuccessResponse, "description": "Income deleted"},
        404: {"model": BaseErrorResponse, "description": "Income not found"},
        500: {"model": BaseErrorResponse, "description": "Server error"},
    },
)
def delete_income(income_id: int, request: Request):
    try:
        if conn:
            vuser: User = request.state.user

            if not vuser:
                return JSONResponse(
                    status_code=401,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="AuthRequired",
                        error="User is not authenticated.",
                    ).model_dump(),
                )

            cursor = conn.cursor()
            cursor.execute("SELECT * FROM income WHERE income_id = %s", (income_id,))
            row = cursor.fetchone()

            if not row:
                cursor.close()
                return JSONResponse(
                    status_code=404,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="NotFoundError",
                        error=f"Income with ID {income_id} not found",
                    ).model_dump(),
                )

            income = Income(**dict(zip(column_names, row)))

            cursor.execute("DELETE FROM income WHERE income_id = %s", (income_id,))
            conn.commit()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    IncomeSuccessResponse(
                        success=True, message="Income deleted", results=income
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return validation_error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


def error_response(e: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=BaseErrorResponse(
            success=False,
            errorType=type(e).__name__,
            error=str(e),
        ).model_dump(),
    )


def validation_error_response(e: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=BaseErrorResponse(
            success=False,
            errorType=type(e).__name__,
            error=e.json(),
        ).model_dump(),
    )
