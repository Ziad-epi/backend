/**
 * Module racine de l'application NestJS.
 * Configure les modules et les providers.
 */
import { Module } from '@nestjs/common';
import { QuotesController } from './quotes/quotes.controller';
import { QuotesService } from './quotes/quotes.service';
import { AIServiceClient } from './ai-service/ai-service.client';

@Module({
  imports: [],
  controllers: [QuotesController],
  providers: [
    QuotesService,
    AIServiceClient,
  ],
})
export class AppModule {}