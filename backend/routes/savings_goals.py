from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from mysql.connector import Error as MYSQLError
from schemas import (
    SavingsGoal,
    CreateSavingsGoal,
    UpdateSavingsGoal,
    User,
    BaseSuccessResponse,
    BaseErrorResponse,
)
from db.db import create_connection
from utils.logger import logger
from json import loads as json_loads

router = APIRouter(prefix="/savings_goals")
conn = create_connection()


class SavingsGoalSuccessResponse(BaseSuccessResponse):
    results: SavingsGoal


class SavingsGoalsSuccessResponse(BaseSuccessResponse):
    results: list[SavingsGoal]


column_names = [
    "goal_id",
    "user_id",
    "name",
    "target_amount",
    "current_amount",
    "target_date",
    "created_at",
    "updated_at",
]


@router.get(
    "/get_goal/{goal_id}",
    responses={
        200: {"model": SavingsGoalSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_savings_goal(goal_id: int, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM savings_goals WHERE goal_id = %s AND user_id = %s",
                (goal_id, vuser.user_id),
            )
            row = cursor.fetchone()
            cursor.close()

            if not row:
                return not_found_response(f"Savings goal ID {goal_id} not found")

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    SavingsGoalSuccessResponse(
                        success=True,
                        message="Savings goal fetched successfully",
                        results=SavingsGoal(**dict(zip(column_names, row))),
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
    "/get_goals",
    responses={
        200: {"model": SavingsGoalsSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_savings_goals(request: Request, goal_ids: str):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            goal_ids = json_loads(goal_ids)
            placeholders = ", ".join(["%s"] * len(goal_ids))
            cursor = conn.cursor()
            cursor.execute(
                f"SELECT * FROM savings_goals WHERE goal_id IN ({placeholders}) AND user_id = %s",
                tuple(goal_ids) + (vuser.user_id,),
            )
            rows = cursor.fetchall()
            cursor.close()

            if not rows:
                return not_found_response(f"No savings goals found for IDs {goal_ids}")

            goals = [SavingsGoal(**dict(zip(column_names, row))) for row in rows]
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    SavingsGoalsSuccessResponse(
                        success=True,
                        message="Savings goals fetched",
                        results=goals,
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
    "/get_all_goals",
    responses={
        200: {"model": SavingsGoalsSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def get_all_savings_goals(request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM savings_goals WHERE user_id = %s", (vuser.user_id,)
            )
            rows = cursor.fetchall()
            cursor.close()

            if not rows:
                return not_found_response(
                    f"No savings goals found for user ID {vuser.user_id}"
                )

            goals = [SavingsGoal(**dict(zip(column_names, row))) for row in rows]
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    SavingsGoalsSuccessResponse(
                        success=True,
                        message="All savings goals fetched successfully",
                        results=goals,
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
    "/post_goal",
    responses={
        200: {"model": SavingsGoalSuccessResponse},
        422: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def create_savings_goal(goal_data: CreateSavingsGoal, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    goal_data.user_id,
                    goal_data.name,
                    goal_data.target_amount,
                    goal_data.current_amount,
                    goal_data.target_date,
                ),
            )
            conn.commit()

            goal_id = cursor.lastrowid
            cursor.execute("SELECT * FROM savings_goals WHERE goal_id = %s", (goal_id,))
            row = cursor.fetchone()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    SavingsGoalSuccessResponse(
                        success=True,
                        message="Savings goal created",
                        results=SavingsGoal(**dict(zip(column_names, row))),
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
    "/put_goal",
    responses={
        200: {"model": SavingsGoalSuccessResponse},
        404: {"model": BaseErrorResponse},
        422: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def update_savings_goal(update_data: UpdateSavingsGoal, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            uud = update_data.model_dump(exclude_none=True)
            goal_id = uud.get("goal_id")

            if not goal_id:
                return validation_error_response("goal_id is required")

            update_fields = {k: v for k, v in uud.items() if k != "goal_id"}
            if not update_fields:
                return validation_error_response("No fields provided to update")

            set_clause = ", ".join(f"{k} = %s" for k in update_fields)
            values = tuple(update_fields.values()) + (goal_id,)
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE savings_goals SET {set_clause} WHERE goal_id = %s",
                values,
            )
            conn.commit()

            if cursor.rowcount == 0:
                cursor.close()
                return not_found_response(
                    f"Savings goal ID {goal_id} not found or not updated"
                )

            cursor.execute("SELECT * FROM savings_goals WHERE goal_id = %s", (goal_id,))
            row = cursor.fetchone()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    SavingsGoalSuccessResponse(
                        success=True,
                        message="Savings goal updated",
                        results=SavingsGoal(**dict(zip(column_names, row))),
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
    "/delete_goal/{goal_id}",
    responses={
        200: {"model": SavingsGoalSuccessResponse},
        404: {"model": BaseErrorResponse},
        500: {"model": BaseErrorResponse},
    },
)
def delete_savings_goal(goal_id: int, request: Request):
    try:
        if conn:
            vuser: User = request.state.user
            if not vuser:
                return auth_error_response()

            cursor = conn.cursor()
            cursor.execute("SELECT * FROM savings_goals WHERE goal_id = %s", (goal_id,))
            row = cursor.fetchone()

            if not row:
                cursor.close()
                return not_found_response(f"Savings goal ID {goal_id} not found")

            goal = SavingsGoal(**dict(zip(column_names, row)))
            cursor.execute("DELETE FROM savings_goals WHERE goal_id = %s", (goal_id,))
            conn.commit()
            cursor.close()

            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    SavingsGoalSuccessResponse(
                        success=True,
                        message="Savings goal deleted",
                        results=goal,
                    ).model_dump()
                ),
            )
    except MYSQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


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
