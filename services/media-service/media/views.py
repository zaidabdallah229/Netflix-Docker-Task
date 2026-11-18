import logging
import os
import uuid

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from . import events, storage
from .auth import AuthError, require_admin
from .models import MediaAsset

log = logging.getLogger(__name__)

ALLOWED = {
    "poster": ("image/",),
    "backdrop": ("image/",),
    "video": ("video/",),
}


@require_GET
def health(request):
    return JsonResponse({"status": "ok", "service": "media-service"})


@csrf_exempt
@require_POST
def upload(request):
    try:
        claims = require_admin(request)
    except AuthError as e:
        return JsonResponse({"message": e.message}, status=e.status)

    movie_id = request.POST.get("movieId", "").strip()
    kind = request.POST.get("kind", "").strip()
    f = request.FILES.get("file")
    if not movie_id or kind not in ALLOWED or f is None:
        return JsonResponse({"message": "movieId, kind (poster|backdrop|video) and file are required"}, status=400)
    content_type = f.content_type or "application/octet-stream"
    if not content_type.startswith(ALLOWED[kind]):
        return JsonResponse({"message": f"{kind} must be {ALLOWED[kind][0]}*"}, status=400)

    ext = os.path.splitext(f.name)[1].lower()[:10]
    key = f"{kind}s/{movie_id}/{uuid.uuid4().hex}{ext}"
    storage.upload(f, key, content_type)

    asset = MediaAsset.objects.create(
        movie_id=movie_id, kind=kind, object_key=key, content_type=content_type,
        size=f.size, uploaded_by=claims.get("username", "?"),
    )
    data = asset.to_dict(settings.MEDIA_PUBLIC_BASE)
    # catalog-service listens and stores the URL on the movie.
    events.publish("media.uploaded", {"movieId": movie_id, "kind": kind, "objectKey": key, "url": data["url"]})
    return JsonResponse(data, status=201)


@require_GET
def assets(request):
    qs = MediaAsset.objects.order_by("-created_at")
    movie_id = request.GET.get("movieId")
    if movie_id:
        qs = qs.filter(movie_id=movie_id)
    return JsonResponse([a.to_dict(settings.MEDIA_PUBLIC_BASE) for a in qs[:200]], safe=False)
