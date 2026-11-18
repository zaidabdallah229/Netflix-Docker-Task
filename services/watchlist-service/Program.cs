using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WatchlistService;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<WatchlistDb>(o => o.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddHostedService<EventConsumer>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false; // keep "sub", "username", "role" as issued by auth-service
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "auth-service",
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!)),
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// Create tables on start (retry while the database container boots).
for (var attempt = 1; ; attempt++)
{
    try
    {
        using var scope = app.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<WatchlistDb>().Database.EnsureCreated();
        break;
    }
    catch (Exception ex) when (attempt < 20)
    {
        app.Logger.LogWarning("Database not ready ({Msg}), retry {N}", ex.Message, attempt);
        Thread.Sleep(2000);
    }
}

app.UseAuthentication();
app.UseAuthorization();

static long UserId(ClaimsPrincipal u) => long.Parse(u.FindFirstValue("sub")!);

app.MapGet("/health", () => new { status = "ok", service = "watchlist-service" });

var api = app.MapGroup("/api/watchlist").RequireAuthorization();

// ---- My List ----
api.MapGet("/", async (ClaimsPrincipal u, WatchlistDb db) =>
{
    var userId = UserId(u);
    return await db.Items.Where(x => x.UserId == userId).OrderByDescending(x => x.AddedAt)
        .Select(x => new { x.MovieId, x.AddedAt }).ToListAsync();
});

api.MapPost("/{movieId}", async (string movieId, ClaimsPrincipal u, WatchlistDb db) =>
{
    var userId = UserId(u);
    if (!await db.Items.AnyAsync(x => x.UserId == userId && x.MovieId == movieId))
    {
        db.Items.Add(new WatchlistItem { UserId = userId, MovieId = movieId });
        await db.SaveChangesAsync();
    }
    return Results.NoContent();
});

api.MapDelete("/{movieId}", async (string movieId, ClaimsPrincipal u, WatchlistDb db) =>
{
    var userId = UserId(u);
    await db.Items.Where(x => x.UserId == userId && x.MovieId == movieId).ExecuteDeleteAsync();
    return Results.NoContent();
});

// ---- Continue watching ----
api.MapGet("/progress", async (ClaimsPrincipal u, WatchlistDb db) =>
{
    var userId = UserId(u);
    return await db.Progress.Where(x => x.UserId == userId).OrderByDescending(x => x.UpdatedAt)
        .Select(x => new { x.MovieId, x.PositionSeconds, x.DurationSeconds, x.UpdatedAt }).ToListAsync();
});

api.MapPut("/progress/{movieId}", async (string movieId, ProgressRequest req, ClaimsPrincipal u, WatchlistDb db) =>
{
    var userId = UserId(u);
    var p = await db.Progress.FirstOrDefaultAsync(x => x.UserId == userId && x.MovieId == movieId);
    if (p is null) db.Progress.Add(p = new WatchProgress { UserId = userId, MovieId = movieId });
    p.PositionSeconds = Math.Max(0, req.PositionSeconds);
    p.DurationSeconds = Math.Max(0, req.DurationSeconds);
    p.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();

record ProgressRequest(double PositionSeconds, double DurationSeconds);
