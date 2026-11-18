import { Controller, Get, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MoviesModule } from './movies/movies.module';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'catalog-service' };
  }
}

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URL ?? 'mongodb://localhost:27017/catalogdb'),
    MoviesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
