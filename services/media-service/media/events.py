import json
import logging
from datetime import datetime, timezone

import pika
from django.conf import settings

log = logging.getLogger(__name__)


def publish(routing_key, payload):
    """Short-lived connection per event: simple and fine for low volume."""
    body = {**payload, "occurredAt": datetime.now(timezone.utc).isoformat()}
    try:
        conn = pika.BlockingConnection(pika.URLParameters(settings.RABBITMQ_URL))
        try:
            ch = conn.channel()
            ch.exchange_declare(settings.EVENTS_EXCHANGE, exchange_type="topic", durable=True)
            ch.basic_publish(
                settings.EVENTS_EXCHANGE,
                routing_key,
                json.dumps(body),
                pika.BasicProperties(content_type="application/json", delivery_mode=2),
            )
        finally:
            conn.close()
        log.info("Published %s", routing_key)
    except Exception as exc:  # broker down must not fail the upload
        log.warning("Could not publish %s: %s", routing_key, exc)
