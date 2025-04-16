from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from jwt import decode as jwt_decode, InvalidTokenError
from fastapi.responses import JSONResponse
from fastapi import status
from schemas import BaseErrorResponse, User
from dotenv import load_dotenv
from os import getenv as os_getenv
from db.db import create_connection

load_dotenv()

conn = create_connection()

JWT_SECRET_KEY = os_getenv("JWT_SECRET_KEY")

column_names = [
    "user_id",
    "username",
    "email",
    "password_hash",
    "created_at",
    "updated_at",
]


class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if "authorization" in request.headers:
            auth_header = request.headers["authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split("Bearer ")[1]

                try:
                    payload = jwt_decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
                    cursor = conn.cursor()
                    cursor.execute(
                        """-- sql
                            select * from users where username = %s
                        """,
                        tuple([payload["username"]]),
                    )
                    row = cursor.fetchone()
                    user = User(**dict(zip(column_names, row)))
                    request.state.user = user
                except InvalidTokenError:
                    return JSONResponse(
                        status_code=401,
                        content=BaseErrorResponse(
                            success=False,
                            errorType="InvalidToken",
                            error="Invalid or expired JWT token.",
                        ).model_dump(),
                    )
                except Exception as e:
                    return JSONResponse(
                        status_code=500,
                        content=BaseErrorResponse(
                            success=False,
                            errorType="TokenDecodeError",
                            error=f"Failed to decode token: {str(e)}",
                        ).model_dump(),
                    )
        else:
            request.state.user = None

        response = await call_next(request)
        return response
