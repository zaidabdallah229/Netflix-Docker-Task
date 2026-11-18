from django.urls import path

from media import views

urlpatterns = [
    path("health", views.health),
    path("api/media/upload", views.upload),
    path("api/media/assets", views.assets),
]
