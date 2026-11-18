using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace WatchlistService;

/// Listens on RabbitMQ:
///   movie.deleted   -> remove the movie from everyone's list and progress
///   user.registered -> create a profile row
public class EventConsumer(IServiceScopeFactory scopes, IConfiguration config, ILogger<EventConsumer> log)
    : BackgroundService
{
    private const string Exchange = "netflix.events";
    private const string Queue = "watchlist.events";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = config["RabbitMq:Host"],
                    UserName = config["RabbitMq:User"],
                    Password = config["RabbitMq:Password"],
                    DispatchConsumersAsync = true,
                };
                using var conn = factory.CreateConnection();
                using var channel = conn.CreateModel();
                channel.ExchangeDeclare(Exchange, ExchangeType.Topic, durable: true);
                channel.QueueDeclare(Queue, durable: true, exclusive: false, autoDelete: false);
                channel.QueueBind(Queue, Exchange, "movie.deleted");
                channel.QueueBind(Queue, Exchange, "user.registered");

                var consumer = new AsyncEventingBasicConsumer(channel);
                consumer.Received += async (_, ea) =>
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(Encoding.UTF8.GetString(ea.Body.Span));
                        await Handle(ea.RoutingKey, doc.RootElement);
                        channel.BasicAck(ea.DeliveryTag, false);
                    }
                    catch (Exception ex)
                    {
                        log.LogError(ex, "Failed to handle {Key}", ea.RoutingKey);
                        channel.BasicNack(ea.DeliveryTag, false, false);
                    }
                };
                channel.BasicConsume(Queue, autoAck: false, consumer);
                log.LogInformation("Consuming movie.deleted, user.registered");

                while (conn.IsOpen && !stoppingToken.IsCancellationRequested)
                    await Task.Delay(1000, stoppingToken);
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                log.LogWarning("RabbitMQ not reachable ({Msg}), retrying in 5s", ex.Message);
                await Task.Delay(5000, stoppingToken).ContinueWith(_ => { });
            }
        }
    }

    private async Task Handle(string key, JsonElement e)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WatchlistDb>();
        switch (key)
        {
            case "movie.deleted":
                var movieId = e.GetProperty("movieId").GetString()!;
                var items = await db.Items.Where(x => x.MovieId == movieId).ExecuteDeleteAsync();
                await db.Progress.Where(x => x.MovieId == movieId).ExecuteDeleteAsync();
                log.LogInformation("Movie {Id} deleted, removed {N} list entries", movieId, items);
                break;
            case "user.registered":
                var userId = e.GetProperty("userId").GetInt64();
                if (await db.Profiles.FindAsync(userId) is null)
                {
                    db.Profiles.Add(new Profile { UserId = userId, Username = e.GetProperty("username").GetString()! });
                    await db.SaveChangesAsync();
                    log.LogInformation("Created profile for user {Id}", userId);
                }
                break;
        }
    }
}
