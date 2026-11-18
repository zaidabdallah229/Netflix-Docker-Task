import os

env = os.environ.get

SECRET_KEY = env("DJANGO_SECRET_KEY", "dev-only-not-secret")
DEBUG = env("DJANGO_DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = ["media"]
MIDDLEWARE = ["django.middleware.common.CommonMiddleware"]
ROOT_URLCONF = "media_service.urls"
WSGI_APPLICATION = "media_service.wsgi.application"
APPEND_SLASH = False
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "HOST": env("DB_HOST", "localhost"),
        "PORT": env("DB_PORT", "5432"),
        "NAME": env("DB_NAME", "mediadb"),
        "USER": env("DB_USER", "media"),
        "PASSWORD": env("DB_PASSWORD", "media"),
    }
}

# Large uploads are streamed to a temp file on disk, not held in memory.
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

JWT_SECRET = env("JWT_SECRET", "change-me-this-is-a-dev-secret-at-least-32-bytes")

MINIO_ENDPOINT = env("MINIO_ENDPOINT", "http://localhost:9000")
MINIO_ACCESS_KEY = env("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = env("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = env("MINIO_BUCKET", "netflix-media")
# Path the browser uses to fetch objects (the gateway proxies it to MinIO).
MEDIA_PUBLIC_BASE = env("MEDIA_PUBLIC_BASE", "/" + MINIO_BUCKET)

RABBITMQ_URL = env("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/%2F")
EVENTS_EXCHANGE = "netflix.events"

LOGGING = {
    "version": 1,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
