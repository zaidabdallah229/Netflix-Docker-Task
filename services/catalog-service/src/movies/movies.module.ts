import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './movie.schema';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { EventsService } from '../common/events.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }])],
  controllers: [MoviesController],
  providers: [MoviesService, EventsService],
})
export class MoviesModule {}
