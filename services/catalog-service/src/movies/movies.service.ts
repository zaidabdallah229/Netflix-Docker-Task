import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Movie, MovieDocument } from './movie.schema';
import { EventsService } from '../common/events.service';
import { SEED_MOVIES } from './seed';

@Injectable()
export class MoviesService implements OnModuleInit {
  private readonly log = new Logger(MoviesService.name);

  constructor(
    @InjectModel(Movie.name) private readonly movies: Model<MovieDocument>,
    private readonly events: EventsService,
  ) {}

  async onModuleInit() {
    if ((await this.movies.estimatedDocumentCount()) === 0) {
      await this.movies.insertMany(SEED_MOVIES);
      this.log.log(`Seeded ${SEED_MOVIES.length} movies`);
    }

    // media-service tells us when a poster / backdrop / video has been stored in MinIO.
    await this.events.subscribe('catalog.media-uploaded', 'media.uploaded', async (e) => {
      const field = { poster: 'posterUrl', backdrop: 'backdropUrl', video: 'videoUrl' }[e.kind as string];
      if (!field || !isValidObjectId(e.movieId)) return;
      await this.movies.updateOne({ _id: e.movieId }, { $set: { [field]: e.url } });
      this.log.log(`Movie ${e.movieId}: ${field} updated`);
    });
  }

  list(q?: string, genre?: string) {
    const filter: Record<string, any> = {};
    if (genre) filter.genres = genre;
    if (q) filter.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    return this.movies.find(filter).sort({ createdAt: -1 }).exec();
  }

  async genres(): Promise<string[]> {
    return (await this.movies.distinct('genres')).sort();
  }

  /** Home page rows: one row per genre plus a featured hero. */
  async browse() {
    const all = await this.movies.find().sort({ createdAt: -1 }).exec();
    const featured = all.find((m) => m.featured) ?? all[0] ?? null;
    const byGenre = new Map<string, MovieDocument[]>();
    for (const m of all) for (const g of m.genres) byGenre.set(g, [...(byGenre.get(g) ?? []), m]);
    const rows = [
      { title: 'New on Netflix', movies: all.slice(0, 12) },
      ...[...byGenre.entries()].sort().map(([g, movies]) => ({ title: g, movies })),
    ];
    return { featured, rows };
  }

  async get(id: string) {
    const movie = isValidObjectId(id) ? await this.movies.findById(id).exec() : null;
    if (!movie) throw new NotFoundException('Movie not found');
    return movie;
  }

  async byIds(ids: string[]) {
    return this.movies.find({ _id: { $in: ids.filter(isValidObjectId) } }).exec();
  }

  async create(data: Partial<Movie>) {
    const movie = await this.movies.create(data);
    this.events.publish('movie.created', { movieId: movie.id, title: movie.title });
    return movie;
  }

  async update(id: string, data: Partial<Movie>) {
    const movie = await this.get(id);
    movie.set(data);
    await movie.save();
    this.events.publish('movie.updated', { movieId: movie.id });
    return movie;
  }

  async remove(id: string) {
    const movie = await this.get(id);
    await movie.deleteOne();
    // media-service deletes the files, watchlist-service removes list entries.
    this.events.publish('movie.deleted', { movieId: id });
  }
}
