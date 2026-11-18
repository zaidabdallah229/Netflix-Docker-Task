import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { AdminGuard } from '../common/auth.guard';
import { Movie } from './movie.schema';

const EDITABLE: (keyof Movie)[] = [
  'title', 'description', 'genres', 'year', 'maturityRating', 'durationMinutes', 'featured',
];

function pick(body: any): Partial<Movie> {
  const out: any = {};
  for (const k of EDITABLE) if (body?.[k] !== undefined) out[k] = body[k];
  if (typeof out.genres === 'string') out.genres = out.genres.split(',').map((g: string) => g.trim()).filter(Boolean);
  return out;
}

@Controller('movies')
export class MoviesController {
  constructor(private readonly movies: MoviesService) {}

  @Get()
  list(@Query('q') q?: string, @Query('genre') genre?: string, @Query('ids') ids?: string) {
    if (ids) return this.movies.byIds(ids.split(','));
    return this.movies.list(q, genre);
  }

  @Get('browse')
  browse() {
    return this.movies.browse();
  }

  @Get('genres')
  genres() {
    return this.movies.genres();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.movies.get(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() body: any) {
    const data = pick(body);
    if (!data.title) throw new BadRequestException('title is required');
    return this.movies.create(data);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.movies.update(id, pick(body));
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.movies.remove(id);
  }
}
