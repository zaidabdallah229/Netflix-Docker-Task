import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      delete ret._id;
      return ret;
    },
  },
})
export class Movie {
  @Prop({ required: true, trim: true }) title: string;
  @Prop({ default: '' }) description: string;
  @Prop({ type: [String], default: [] }) genres: string[];
  @Prop() year: number;
  @Prop({ default: 'PG-13' }) maturityRating: string;
  @Prop({ default: 0 }) durationMinutes: number;
  @Prop({ default: false }) featured: boolean;
  @Prop() posterUrl?: string;
  @Prop() backdropUrl?: string;
  @Prop() videoUrl?: string;
}

export type MovieDocument = HydratedDocument<Movie>;
export const MovieSchema = SchemaFactory.createForClass(Movie);
MovieSchema.index({ title: 'text', description: 'text' });
