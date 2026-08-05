import logging
import logging.config
from pythonjsonlogger import json


LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": json.JsonFormatter,
            "fmt": "%(asctime)s %(levelname)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "default": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "root": {
        "handlers": ["default"],
        "level": "INFO",
    },
}


def configure_logging() -> None:
    logging.config.dictConfig(LOGGING_CONFIG)
