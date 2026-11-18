from django.db import models


class MediaAsset(models.Model):
    KINDS = [("poster", "Poster"), ("backdrop", "Backdrop"), ("video", "Video")]

    movie_id = models.CharField(max_length=64, db_index=True)
    kind = models.CharField(max_length=16, choices=KINDS)
    object_key = models.CharField(max_length=512, unique=True)
    content_type = models.CharField(max_length=128)
    size = models.BigIntegerField()
    uploaded_by = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    def to_dict(self, public_base):
        return {
            "id": self.id,
            "movieId": self.movie_id,
            "kind": self.kind,
            "objectKey": self.object_key,
            "url": f"{public_base}/{self.object_key}",
            "contentType": self.content_type,
            "size": self.size,
            "uploadedBy": self.uploaded_by,
            "createdAt": self.created_at.isoformat(),
        }
