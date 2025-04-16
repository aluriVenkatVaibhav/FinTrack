from json import loads as json_loads
from fastapi import APIRouter, status, Query, Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from db.db import create_connection
from schemas import User, BaseSuccessResponse, BaseErrorResponse, CreateUser, UpdateUser
from pydantic import ValidationError
from mysql.connector import Error as MYSQLError
from utils.logger import logger
from hashlib import sha256

router = APIRouter(prefix="/users")
conn = create_connection()


class UserSuccessResponse(BaseSuccessResponse):
    results: User


class GetUserSuccessResponse(UserSuccessResponse):
    pass


class GetUsersSuccessResponse(BaseSuccessResponse):
    results: list[User]


class CreateUserSuccessResponse(UserSuccessResponse):
    pass


class UpdateUserSuccessResponse(UserSuccessResponse):
    pass


class DeleteUserSuccessResponse(UserSuccessResponse):
    pass


column_names = [
    "user_id",
    "username",
    "email",
    "password_hash",
    "created_at",
    "updated_at",
]


@router.get(
    "/get_user/{user_id}",
    responses={
        200: {
            "model": GetUserSuccessResponse,
            "description": "User fetched successfully",
        },
        404: {"model": BaseErrorResponse, "description": "User not found"},
        422: {"model": BaseErrorResponse, "description": "Validation error"},
        500: {"model": BaseErrorResponse, "description": "Internal server error"},
    },
)
def get_user(user_id: int):
    try:
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            user_data = cursor.fetchone()
            cursor.close()

            if not user_data:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="NotFoundError",
                        error=f"User with id {user_id} not found.",
                    ).model_dump(),
                )

            user = User(**dict(zip(column_names, user_data)))
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=jsonable_encoder(
                    GetUserSuccessResponse(
                        success=True,
                        message=f"Fetched user with id {user_id}",
                        results=user,
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
    "/get_users",
    responses={
        200: {
            "model": GetUsersSuccessResponse,
            "description": "Users fetched successfully",
        },
        404: {"model": BaseErrorResponse, "description": "User not found"},
        422: {"model": BaseErrorResponse, "description": "Validation error"},
        500: {"model": BaseErrorResponse, "description": "Internal server error"},
    },
)
def get_users(user_ids: str = Query(...)):
    try:
        if conn:
            user_ids = json_loads(user_ids)
            cursor = conn.cursor()
            query = f"SELECT * FROM users WHERE user_id IN ({', '.join(['%s'] * len(user_ids))})"
            cursor.execute(query, tuple(user_ids))
            data = cursor.fetchall()
            cursor.close()

            if not data:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="NotFoundError",
                        error=f"Users with ids {user_ids} not found.",
                    ).model_dump(),
                )

            users = [User(**dict(zip(column_names, row))) for row in data]
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=jsonable_encoder(
                    GetUsersSuccessResponse(
                        success=True,
                        message=f"Fetched users with ids {user_ids}",
                        results=users,
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
    "/post_user",
    responses={
        200: {
            "model": CreateUserSuccessResponse,
            "description": "User created successfully",
        },
        422: {"model": BaseErrorResponse, "description": "Validation error"},
        500: {"model": BaseErrorResponse, "description": "Internal server error"},
    },
)
def create_user(create_user_data: CreateUser, request: Request):
    try:
        if conn:
            cursor = conn.cursor()
            hashed_password = sha256(create_user_data.password.encode()).hexdigest()

            cursor.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
                (create_user_data.username, create_user_data.email, hashed_password),
            )
            conn.commit()

            cursor.execute(
                "SELECT * FROM users WHERE user_id = %s", (cursor.lastrowid,)
            )
            result = cursor.fetchone()
            cursor.close()

            user = User(**dict(zip(column_names, result)))

            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=jsonable_encoder(
                    CreateUserSuccessResponse(
                        success=True,
                        message="User created successfully.",
                        results=user,
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
    "/put_user",
    responses={
        200: {
            "model": DeleteUserSuccessResponse,
            "description": "User deleted successfully",
        },
        404: {"model": BaseErrorResponse, "description": "User not found"},
        422: {"model": BaseErrorResponse, "description": "Validation error"},
        500: {"model": BaseErrorResponse, "description": "Internal server error"},
    },
)
def put_user(update_user_data: UpdateUser, request: Request):
    try:
        if conn:
            vuser = request.state.user

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

            uud = update_user_data.model_dump(exclude_none=True)

            if "password" in uud:
                uud["password_hash"] = sha256(uud["password"].encode()).hexdigest()
                del uud["password"]

            logger.info(uud)

            user_id = uud.get("user_id")

            if not user_id:
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="ValidationError",
                        error="user_id is required for update.",
                    ).model_dump(),
                )

            update_fields = {k: v for k, v in uud.items() if k != "user_id"}
            if not update_fields:
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="ValidationError",
                        error="At least one field must be provided to update.",
                    ).model_dump(),
                )

            set_clause = ", ".join(f"{field} = %s" for field in update_fields.keys())
            values = tuple(update_fields.values())

            cursor.execute(
                f"UPDATE users SET {set_clause} WHERE user_id = %s", values + (user_id,)
            )
            conn.commit()

            logger.info(user_id)

            if cursor.rowcount == 0:
                cursor.close()
                return JSONResponse(
                    status_code=status.HTTP_406_NOT_ACCEPTABLE,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="UserNotFound",
                        error=f"No user found or there is nothing to update with user_id={user_id}",
                    ).model_dump(),
                )

            cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            updated_data = cursor.fetchone()
            cursor.close()

            user_data = User(**dict(zip(column_names, updated_data)))

            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=jsonable_encoder(
                    UpdateUserSuccessResponse(
                        success=True,
                        message="User updated successfully.",
                        results=user_data,
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
    "/delete_user/{user_id}",
    responses={
        200: {
            "model": DeleteUserSuccessResponse,
            "description": "User deleted successfully",
        },
        404: {"model": BaseErrorResponse, "description": "User not found"},
        422: {"model": BaseErrorResponse, "description": "Validation error"},
        500: {"model": BaseErrorResponse, "description": "Internal server error"},
    },
)
def delete_user(user_id: int, request: Request):
    try:
        if conn:
            vuser = request.state.user

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

            cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            result = cursor.fetchone()

            if not result:
                cursor.close()
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="UserNotFound",
                        error=f"No user found with user_id={user_id}",
                    ).model_dump(),
                )

            user_data = User(**dict(zip(column_names, result)))

            cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
            conn.commit()
            cursor.close()

            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=jsonable_encoder(
                    DeleteUserSuccessResponse(
                        success=True,
                        message="User deleted successfully.",
                        results=user_data,
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
