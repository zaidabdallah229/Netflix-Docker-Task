using Microsoft.EntityFrameworkCore;

namespace WatchlistService;

public class WatchlistItem
{
    public int Id { get; set; }
    public long UserId { get; set; }
    public string MovieId { get; set; } = "";
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}

public class WatchProgress
{
    public int Id { get; set; }
    public long UserId { get; set; }
    public string MovieId { get; set; } = "";
    public double PositionSeconds { get; set; }
    public double DurationSeconds { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// Filled from the user.registered event published by auth-service.
public class Profile
{
    public long UserId { get; set; }
    public string Username { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class WatchlistDb(DbContextOptions<WatchlistDb> options) : DbContext(options)
{
    public DbSet<WatchlistItem> Items => Set<WatchlistItem>();
    public DbSet<WatchProgress> Progress => Set<WatchProgress>();
    public DbSet<Profile> Profiles => Set<Profile>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<WatchlistItem>().HasIndex(x => new { x.UserId, x.MovieId }).IsUnique();
        b.Entity<WatchProgress>().HasIndex(x => new { x.UserId, x.MovieId }).IsUnique();
        b.Entity<Profile>().HasKey(x => x.UserId);
        b.Entity<Profile>().Property(x => x.UserId).ValueGeneratedNever();
    }
}
