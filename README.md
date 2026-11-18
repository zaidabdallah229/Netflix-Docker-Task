# Netflix — Microservices + Micro-Frontends (learning project)

A streaming web app built to practise **Docker** now and **Kubernetes** later.
Every service is written in a different stack, owns its own database, and talks to
the others only through HTTP (via the gateway) or **RabbitMQ events**.

```
                                   Browser
                                      │  http://localhost:8080
                               ┌──────▼──────┐
                               │   gateway   │  nginx — one entry point, path routing
                               └──────┬──────┘
   ┌───────────── micro-frontends ────┼──────────────────── microservices ──────────────┐
   │                                  │                                                  │
   │  /            shell     (React host, Module Federation)                             │
   │  /mfe/auth/   mfe-auth  (React remote: sign in / sign up)                           │
   │  /mfe/browse/ mfe-browse(React remote: home rows, details, player, My List)         │
   │  /studio      studio    (Next.js: admin catalog + uploads)                          │
   │                                                                                     │
   │  /api/auth/*      auth-service      Spring Boot 3 / Java 21 ── auth-db      (Postgres)│
   │  /api/catalog/*   catalog-service   NestJS 10            ── catalog-db   (MongoDB)  │
   │  /api/media/*     media-service     Django 5             ── media-db     (Postgres) │
   │                   media-worker      Django (same image)     + MinIO (S3 objects)    │
   │  /api/watchlist/* watchlist-service .NET 8 minimal API   ── watchlist-db (Postgres) │
   │  /netflix-media/* MinIO bucket (posters, backdrops, videos — streamed with Range)   │
   └─────────────────────────────────────────────────────────────────────────────────────┘
                          ▲                 RabbitMQ                 ▲
                          └──── topic exchange "netflix.events" ─────┘
```

## Run it

```bash
cd netflix
cp .env.example .env          # optional, defaults work for local use
docker compose up -d --build
docker compose ps             # wait until everything is "running"/"healthy"
```

| URL | What |
|---|---|
| http://localhost:8080 | The app (sign in with **admin / admin123**, or sign up) |
| http://localhost:8080/studio | Studio — create titles, upload poster / backdrop / video |
| http://localhost:15672 | RabbitMQ UI (netflix / netflix) — watch queues and messages |
| http://localhost:9001 | MinIO console (minioadmin / minioadmin) — browse uploaded files |

The catalog is seeded with 10 fictional titles (no media). Open **Studio → Edit** on a
title and upload an image and an `.mp4` to see the whole event flow.

Stop: `docker compose down` · wipe all data: `docker compose down -v`

## Services

| Service | Stack | Database | Port (internal) | Publishes | Consumes |
|---|---|---|---|---|---|
| auth-service | Spring Boot 3.3, Java 21 | PostgreSQL `authdb` | 8081 | `user.registered` | – |
| catalog-service | NestJS 10, Mongoose | MongoDB `catalogdb` | 3000 | `movie.created`, `movie.updated`, `movie.deleted` | `media.uploaded` |
| media-service | Django 5, boto3 | PostgreSQL `mediadb` + MinIO | 8000 | `media.uploaded` | – |
| media-worker | same image as media-service | same | – | – | `movie.deleted` |
| watchlist-service | .NET 8, EF Core | PostgreSQL `watchlistdb` | 8080 | – | `movie.deleted`, `user.registered` |
| gateway | nginx 1.27 | – | 80 → **8080** | – | – |

Every service exposes `GET /health`. Use these for Docker healthchecks now and
Kubernetes liveness/readiness probes later.

### Event flows (eventual consistency)

1. **Upload**: Studio → `POST /api/media/upload` → Django stores the file in MinIO and a row in
   `mediadb` → publishes `media.uploaded` → catalog-service sets `posterUrl` / `videoUrl` on the movie.
2. **Delete a title**: catalog-service deletes it from Mongo → publishes `movie.deleted` →
   media-worker removes the files from MinIO, and watchlist-service removes list entries and progress.
3. **Sign up**: auth-service → `user.registered` → watchlist-service creates a profile row.

No service ever reads another service's database. Stop RabbitMQ (`docker compose stop rabbitmq`)
and the APIs keep working; events are published again once it is back, and consumers reconnect.

### Auth

auth-service issues an HS256 JWT (`sub`, `username`, `role`, `iss=auth-service`). Every other
service validates it locally with the shared `JWT_SECRET`, so there are no extra calls to
auth-service. Writes to the catalog and uploads require `role=ADMIN`.

## Micro-frontends

Two composition styles are used on purpose:

- **Runtime composition (Module Federation)**: `shell` loads `mfe-auth` and `mfe-browse` at runtime from
  `/mfe/*/assets/remoteEntry.js`, sharing a single copy of React. Rebuild and redeploy `mfe-browse`
  and the shell picks it up on reload, with no shell rebuild. If a remote is down, only that area shows
  an error (try `docker compose stop mfe-browse`).
- **Vertical split (route-based)**: `/studio` is a separate Next.js app the gateway routes to.

The MFEs share only a contract: the JWT in `localStorage["nf_token"]` and a browser event `nf:auth`.
Remotes take props (`onOpen`, `onPlay`, `id`) and never import the shell's router.

## Repository layout

```
netflix/
├── docker-compose.yml
├── gateway/                 nginx.conf (routing), Dockerfile
├── services/
│   ├── auth-service/        Spring Boot
│   ├── catalog-service/     NestJS
│   ├── media-service/       Django (api + worker)
│   └── watchlist-service/   .NET 8
└── frontends/
    ├── shell/               React + Vite (host)
    ├── mfe-auth/            React + Vite (remote)
    ├── mfe-browse/          React + Vite (remote)
    └── studio/              Next.js 14 (standalone output)
```

## Docker concepts to practise here

- **Multi-stage builds** in every Dockerfile (SDK image to build, slim runtime image to run).
- **Non-root containers**: `USER node`, `USER app`.
- **One image, two processes**: media-service and media-worker (`command:` override).
- **Healthchecks + `depends_on: condition: service_healthy`** for start-up ordering.
- **Network isolation**: databases sit only on the `backend` network; the gateway can't reach them.
- **Named volumes** for every stateful container.
- Rebuild a single service: `docker compose up -d --build catalog-service`
- Follow events: `docker compose logs -f catalog-service media-worker watchlist-service`

## Moving to Kubernetes later

Each compose service maps cleanly:

| Compose | Kubernetes |
|---|---|
| each service | `Deployment` + `Service` (ClusterIP) |
| databases, RabbitMQ, MinIO | `StatefulSet` + `PersistentVolumeClaim` (or Helm charts) |
| gateway | `Ingress` (path rules are the same as `gateway/nginx.conf`) |
| `environment:` | `ConfigMap` + `Secret` (`JWT_SECRET`, DB passwords) |
| `healthcheck` / `/health` | `livenessProbe` / `readinessProbe` |
| media-worker | second `Deployment` from the same image, scale it on queue depth |
| `depends_on` | gone: services already retry DB / broker connections on their own |

## Notes and limits

- MinIO no longer publishes official Docker images, so compose uses the community build
  `pgsty/minio`. The bucket is **public-read** so `<video>` can stream through the gateway with
  Range requests. In production keep it private and hand out presigned URLs.
- Tables are created on start-up (JPA `ddl-auto`, EF `EnsureCreated`, Django migrations); real
  projects would use versioned migrations everywhere.
- Secrets in `.env.example` are for local use only.
