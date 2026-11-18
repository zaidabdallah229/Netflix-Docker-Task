from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name="MediaAsset",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("movie_id", models.CharField(db_index=True, max_length=64)),
                ("kind", models.CharField(choices=[("poster", "Poster"), ("backdrop", "Backdrop"), ("video", "Video")], max_length=16)),
                ("object_key", models.CharField(max_length=512, unique=True)),
                ("content_type", models.CharField(max_length=128)),
                ("size", models.BigIntegerField()),
                ("uploaded_by", models.CharField(max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
