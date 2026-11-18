"""MinIO access through the S3 API (boto3). Swap the endpoint for AWS S3 and nothing else changes."""
import json
import logging

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from django.conf import settings

log = logging.getLogger(__name__)


def client():
    return boto3.client(
        "s3",
        endpoint_url=settings.MINIO_ENDPOINT,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        region_name="us-east-1",
    )


def ensure_bucket():
    s3 = client()
    bucket = settings.MINIO_BUCKET
    try:
        s3.head_bucket(Bucket=bucket)
    except ClientError:
        s3.create_bucket(Bucket=bucket)
        log.info("Created bucket %s", bucket)
    # Public read so the browser can stream through the gateway (/netflix-media/...).
    # In production you would keep it private and hand out presigned URLs instead.
    policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"AWS": ["*"]},
            "Action": ["s3:GetObject"],
            "Resource": [f"arn:aws:s3:::{bucket}/*"],
        }],
    }
    s3.put_bucket_policy(Bucket=bucket, Policy=json.dumps(policy))


def upload(fileobj, key, content_type):
    client().upload_fileobj(fileobj, settings.MINIO_BUCKET, key, ExtraArgs={"ContentType": content_type})


def delete(keys):
    if keys:
        client().delete_objects(Bucket=settings.MINIO_BUCKET, Delete={"Objects": [{"Key": k} for k in keys]})
