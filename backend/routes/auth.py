from fastapi import APIRouter, status, Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db.db import create_connection
from schemas import User, BaseSuccessResponse, BaseErrorResponse
from pydantic import ValidationError, BaseModel
from mysql.connector import Error as MySQLError
from utils.logger import logger
from hashlib import sha256
from jwt import encode as jwt_encode, decode as jwt_decode
from dotenv import load_dotenv
from os import getenv as os_getenv
from datetime import timezone, timedelta, datetime

load_dotenv()

JWT_SECRET_KEY = os_getenv("JWT_SECRET_KEY")

router = APIRouter(prefix="/auth")
conn = create_connection()
security = HTTPBearer()


class LoginResults(BaseModel):
    jwt: str
    user: User


class LoginSuccessResponse(BaseSuccessResponse):
    results: LoginResults


class LoginUser(BaseModel):
    username_or_email: str
    password: str


class SignupUser(BaseModel):
    username: str
    email: str
    password: str


class AuthUser(BaseModel):
    jwt: str


column_names = [
    "user_id",
    "username",
    "email",
    "password_hash",
    "created_at",
    "updated_at",
]


@router.post(
    "/login",
    responses={
        200: {
            "model": LoginSuccessResponse,
            "description": "User fetched successfully",
        },
        404: {"model": BaseErrorResponse, "description": "User not found"},
        422: {"model": BaseErrorResponse, "description": "Validation error"},
        500: {"model": BaseErrorResponse, "description": "Internal server error"},
    },
)
def login(login_user_data: LoginUser):
    try:
        if conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM users WHERE username = %s OR email = %s",
                (login_user_data.username_or_email, login_user_data.username_or_email),
            )
            user_data = cursor.fetchone()

            if not user_data:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="InvalidUsernameOrEmail",
                        error=f"User with {login_user_data.username_or_email} not found.",
                    ).model_dump(),
                )

            user = User(**dict(zip(column_names, user_data)))

            hashed_password = sha256(login_user_data.password.encode()).hexdigest()

            if user.password_hash != hashed_password:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="WrongPassword",
                        error="Wrong password.",
                    ).model_dump(),
                )

            expiration = datetime.now(tz=timezone.utc) + timedelta(days=3.0)

            token = jwt_encode(
                payload={
                    "user_id": user.user_id,
                    "username": user.username,
                    "email": user.email,
                    "exp": expiration,
                    "expiso": expiration.isoformat(),
                },
                key=JWT_SECRET_KEY,
                algorithm="HS256",
            )

            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=jsonable_encoder(
                    LoginSuccessResponse(
                        success=True,
                        message=f"Fetched user with id {user.user_id}",
                        results=LoginResults(
                            jwt=token,
                            user=user,
                        ),
                    )
                ),
            )

    except MySQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return validation_error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.get(
    "/auth",
    responses={
        200: {
            "model": LoginSuccessResponse,
            "description": "User fetched successfully",
        },
        404: {"model": BaseErrorResponse, "description": "User not found"},
        422: {"model": BaseErrorResponse, "description": "Validation error"},
        500: {"model": BaseErrorResponse, "description": "Internal server error"},
    },
)
def auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        if conn:
            token = credentials.credentials
            auth_token_data = jwt_decode(
                jwt=token, key=JWT_SECRET_KEY, algorithms=["HS256"]
            )

            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM users WHERE email = %s",
                (auth_token_data["email"],),
            )
            user_data = cursor.fetchone()

            if not user_data:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="InvalidUsernameOrEmail",
                        error=f'User with {auth_token_data["username"]} not found.',
                    ).model_dump(),
                )

            user = User(**dict(zip(column_names, user_data)))

            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=jsonable_encoder(
                    LoginSuccessResponse(
                        success=True,
                        message=f"Fetched user with id {user.user_id}",
                        results=LoginResults(
                            jwt="",
                            user=user,
                        ),
                    )
                ),
            )

    except MySQLError as e:
        logger.error(f"MySQL error: {e}")
        return error_response(e)
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return validation_error_response(e)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return error_response(e)


@router.post(
    "/signup",
    responses={
        201: {
            "model": LoginSuccessResponse,
            "description": "User created successfully",
        },
        400: {"model": BaseErrorResponse, "description": "Bad request"},
        422: {"model": BaseErrorResponse, "description": "Validation error"},
        500: {"model": BaseErrorResponse, "description": "Internal server error"},
    },
)
def signup(user_data: SignupUser):
    try:
        if conn:
            cursor = conn.cursor()

            cursor.execute(
                "SELECT * FROM users WHERE username = %s OR email = %s",
                (user_data.username, user_data.username),
            )
            existing_user = cursor.fetchone()

            if existing_user:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content=BaseErrorResponse(
                        success=False,
                        errorType="UserAlreadyExists",
                        error="Username or email already exists.",
                    ).model_dump(),
                )

            hashed_password = sha256(user_data.password.encode()).hexdigest()

            cursor.execute(
                "INSERT INTO users (username, email, password_hash ) "
                "VALUES (%s, %s, %s )",
                (user_data.username, user_data.email, hashed_password),
            )
            conn.commit()

            cursor.execute(
                "SELECT * FROM users WHERE username = %s OR email = %s",
                (user_data.username, user_data.email),
            )
            new_user_data = cursor.fetchone()

            new_user = User(**dict(zip(column_names, new_user_data)))

            expiration = datetime.now(tz=timezone.utc) + timedelta(days=3.0)
            token = jwt_encode(
                payload={
                    "user_id": new_user.user_id,
                    "username": new_user.username,
                    "email": new_user.email,
                    "exp": expiration,
                    "expiso": expiration.isoformat(),
                },
                key=JWT_SECRET_KEY,
                algorithm="HS256",
            )

            return JSONResponse(
                status_code=status.HTTP_201_CREATED,
                content=jsonable_encoder(
                    LoginSuccessResponse(
                        success=True,
                        message=f"User created with id {new_user.user_id}",
                        results=LoginResults(
                            jwt=token,
                            user=new_user,
                        ),
                    )
                ),
            )

    except MySQLError as e:
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
