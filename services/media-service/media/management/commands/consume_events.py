import json
import logging
import time

import pika
from django.conf import settings
from django.core.management.base import BaseCommand

from media import storage
from media.models import MediaAsset

log = logging.getLogger(__name__)
QUEUE = "media.movie-deleted"


def on_movie_deleted(payload):
    movie_id = payload.get("movieId")
    assets = MediaAsset.objects.filter(movie_id=movie_id)
    keys = list(assets.values_list("object_key", flat=True))
    storage.delete(keys)
    assets.delete()
    log.info("Removed %d files for deleted movie %s", len(keys), movie_id)


class Command(BaseCommand):
    help = "Worker: consume movie.deleted and clean up files in MinIO."

    def handle(self, *args, **opts):
        while True:
            try:
                conn = pika.BlockingConnection(pika.URLParameters(settings.RABBITMQ_URL))
                ch = conn.channel()
                ch.exchange_declare(settings.EVENTS_EXCHANGE, exchange_type="topic", durable=True)
                ch.queue_declare(QUEUE, durable=True)
                ch.queue_bind(QUEUE, settings.EVENTS_EXCHANGE, routing_key="movie.deleted")
                ch.basic_qos(prefetch_count=10)

                def callback(channel, method, _props, body):
                    try:
                        on_movie_deleted(json.loads(body))
                        channel.basic_ack(method.delivery_tag)
                    except Exception:
                        log.exception("Failed to handle movie.deleted")
                        channel.basic_nack(method.delivery_tag, requeue=False)

                ch.basic_consume(QUEUE, callback)
                log.info("media-worker consuming movie.deleted")
                ch.start_consuming()
            except pika.exceptions.AMQPConnectionError as exc:
                log.warning("RabbitMQ not reachable (%s), retrying in 5s", exc)
                time.sleep(5)
