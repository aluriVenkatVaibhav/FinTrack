from fastapi import APIRouter, Request, status, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from mysql.connector import Error as MYSQLError
from schemas import (
    Transaction,
    CreateTransaction,
    UpdateTransaction,
    User,
    BaseSuccessResponse,
    BaseErrorResponse,
)
from db.db import create_connection
from utils.logger import logger
from json import loads as json_loads

router = APIRouter(prefix="/transaction")
conn = create_connection()


class TransactionSuccessResponse(BaseSuccessResponse):
    results: Transaction


class TransactionsSuccessResponse(BaseSuccessResponse):
    results: list[Transaction]


column_names = [
    "transaction_id",
    "user_id",
    "amount",
    "description",
    "transaction_date",
    "type",
    "created_at",
]


@router.get(
    "/get_transaction/{transaction_id}",
    responses={
        200: {"model": TransactionSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_transaction(transaction_id: int, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM transactions WHERE transaction_id = %s AND user_id = %s",
                (transaction_id, vuser.user_id),
            )
            row = cursor.fetchone()
            cursor.close()

            if not row:
                return not_found_response(f"Transaction ID {transaction_id} not found")

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    TransactionSuccessResponse(
                        success=True,
                        message="Transaction fetched successfully",
                        results=Transaction(**dict(zip(column_names, row))),
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
    "/get_transactions",
    responses={
        200: {"model": TransactionsSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_transactions(request: Request, transaction_ids: str = Query(...)):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            transaction_ids = json_loads(transaction_ids)
            placeholders = ", ".join(["%s"] * len(transaction_ids))
            cursor = conn.cursor()
            cursor.execute(
                f"SELECT * FROM transactions WHERE transaction_id IN ({placeholders}) AND user_id = %s",
                tuple(transaction_ids) + (vuser.user_id,),
            )
            rows = cursor.fetchall()
            cursor.close()

            if not rows:
                return not_found_response(
                    f"No transactions found for IDs {transaction_ids}"
                )

            transactions = [Transaction(**dict(zip(column_names, row))) for row in rows]
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    TransactionsSuccessResponse(
                        success=True,
                        message="Transactions fetched",
                        results=transactions,
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
    "/get_all_transactions",
    responses={
        200: {"model": TransactionsSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_all_transactions(request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM transactions WHERE user_id = %s", (vuser.user_id,)
            )
            rows = cursor.fetchall()
            cursor.close()

            if not rows:
                return not_found_response(
                    f"No transactions found for user ID {vuser.user_id}"
                )

            transactions = [Transaction(**dict(zip(column_names, row))) for row in rows]
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    TransactionsSuccessResponse(
                        success=True,
                        message="All transactions fetched successfully",
                        results=transactions,
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
    "/post_transaction",
    responses={
        200: {"model": TransactionSuccessResponse},
        422: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def create_transaction(transaction_data: CreateTransaction, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO transactions (user_id, amount, description, transaction_date, type) VALUES (%s, %s, %s, %s, %s)",
                (
                    transaction_data.user_id,
                    transaction_data.amount,
                    transaction_data.description,
                    transaction_data.transaction_date,
                    transaction_data.type,
                ),
            )
            conn.commit()

            transaction_id = cursor.lastrowid
            cursor.execute(
                "SELECT * FROM transactions WHERE transaction_id = %s",
                (transaction_id,),
            )
            row = cursor.fetchone()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    TransactionSuccessResponse(
                        success=True,
                        message="Transaction created",
                        results=Transaction(**dict(zip(column_names, row))),
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
    "/put_transaction",
    responses={
        200: {"model": TransactionSuccessResponse},
        404: {"model": BaseErrorResponse},
        422: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def update_transaction(update_data: UpdateTransaction, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            uud = update_data.model_dump(exclude_none=True)
            transaction_id = uud.get("transaction_id")

            if not transaction_id:
                return validation_error_response("transaction_id is required")

            update_fields = {k: v for k, v in uud.items() if k != "transaction_id"}
            if not update_fields:
                return validation_error_response("No fields provided to update")

            set_clause = ", ".join(f"{k} = %s" for k in update_fields)
            values = tuple(update_fields.values()) + (transaction_id,)
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE transactions SET {set_clause} WHERE transaction_id = %s",
                values,
            )
            conn.commit()

            if cursor.rowcount == 0:
                cursor.close()
                return not_found_response(
                    f"Transaction ID {transaction_id} not found or not updated"
                )

            cursor.execute(
                "SELECT * FROM transactions WHERE transaction_id = %s",
                (transaction_id,),
            )
            row = cursor.fetchone()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    TransactionSuccessResponse(
                        success=True,
                        message="Transaction updated",
                        results=Transaction(**dict(zip(column_names, row))),
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
    "/delete_transaction/{transaction_id}",
    responses={
        200: {"model": TransactionSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def delete_transaction(transaction_id: int, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM transactions WHERE transaction_id = %s",
                (transaction_id,),
            )
            row = cursor.fetchone()

            if not row:
                cursor.close()
                return not_found_response(f"Transaction ID {transaction_id} not found")

            transaction = Transaction(**dict(zip(column_names, row)))
            cursor.execute(
                "DELETE FROM transactions WHERE transaction_id = %s", (transaction_id,)
            )
            conn.commit()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    TransactionSuccessResponse(
                        success=True,
                        message="Transaction deleted",
                        results=transaction,
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


# Error Response Utilities
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
