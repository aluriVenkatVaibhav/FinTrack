import logging
import sys
from colorama import Fore, Back, Style, init

init(autoreset=True)


class CustomColorFormatter(logging.Formatter):
    def format(self, record):
        # Color definitions
        asctime_color = Fore.BLUE
        message_color = Fore.WHITE

        # Background + Foreground combo for levelname
        level_colors = {
            logging.DEBUG: Back.CYAN + Fore.BLACK,
            logging.INFO: Back.GREEN + Fore.BLACK,
            logging.WARNING: Back.YELLOW + Fore.BLACK,
            logging.ERROR: Back.RED + Fore.BLACK,
            logging.CRITICAL: Back.MAGENTA + Fore.WHITE + Style.BRIGHT,
        }

        msg_colors = {
            logging.DEBUG: Fore.CYAN,
            logging.INFO: Fore.GREEN,
            logging.WARNING: Fore.YELLOW,
            logging.ERROR: Fore.RED,
            logging.CRITICAL: Fore.MAGENTA,
        }

        levelname_color = level_colors.get(record.levelno, Fore.WHITE)
        msg_color = msg_colors.get(record.levelno, Fore.WHITE)

        # Format raw message first
        original = super().format(record)

        # Manually color fields
        record.asctime = f"{asctime_color}{record.asctime}{Style.RESET_ALL}"
        record.levelname = f"{levelname_color}{record.levelname}{Style.RESET_ALL}"
        record.msg = f"{msg_color}{record.getMessage()}{Style.RESET_ALL}"

        return f"{record.asctime} - {record.levelname} - {record.msg}"


# Set up logger
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

stream_handler = logging.StreamHandler(sys.stdout)
formatter = CustomColorFormatter(fmt="%(asctime)s - %(levelname)s - %(message)s")
stream_handler.setFormatter(formatter)

logger.handlers = [stream_handler]
