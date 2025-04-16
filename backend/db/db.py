import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

host, user, password, database, port = (
    os.getenv("HOST"),
    os.getenv("USER"),
    os.getenv("PASSWORD"),
    os.getenv("DATABASE"),
    os.getenv("DB_PORT"),
)


def create_connection():
    try:
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port or 3306,
        )
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error: {e}")
        return None
