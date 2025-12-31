/**
 * Module racine de l'application NestJS.
 * Configure et importe tous les modules, controllers et providers.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuotesController } from './quotes/quotes.controller';
import { QuotesService } from './quotes/quotes.service';
import { AIServiceClient } from './ai-service/ai-service.client';

@Module({
  imports: [
    // Configuration des variables d'environnement
    ConfigModule.forRoot({
      isGlobal: true, // Rend les variables d'env disponibles partout
      envFilePath: '.env',
    }),
  ],
  controllers: [
    QuotesController, // Contrôleur pour les routes /quotes
  ],
  providers: [
    QuotesService,    // Service contenant la logique métier
    AIServiceClient,  // Client HTTP pour communiquer avec FastAPI
  ],
})
export class AppModule {}