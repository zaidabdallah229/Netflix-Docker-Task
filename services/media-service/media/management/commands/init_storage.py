import time

from django.core.management.base import BaseCommand

from media import storage


class Command(BaseCommand):
    help = "Create the MinIO bucket and its read policy (waits for MinIO)."

    def handle(self, *args, **opts):
        for attempt in range(30):
            try:
                storage.ensure_bucket()
                self.stdout.write(self.style.SUCCESS("Storage ready"))
                return
            except Exception as exc:
                self.stdout.write(f"MinIO not ready ({exc}), retry {attempt + 1}/30")
                time.sleep(2)
        raise SystemExit("MinIO unavailable")
