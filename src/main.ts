/**
 * Point d'entrée de l'application NestJS.
 * Configure le serveur, la validation et le CORS.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Création de l'application NestJS
  const app = await NestFactory.create(AppModule);

  // Configuration de la validation automatique des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non déclarées dans les DTOs
      forbidNonWhitelisted: true, // Rejette les requêtes avec des propriétés inconnues
      transform: true, // Transforme automatiquement les types (string → number, etc.)
      transformOptions: {
        enableImplicitConversion: true, // Conversion automatique des types primitifs
      },
    }),
  );

  // Configuration CORS pour autoriser le frontend React
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // URLs Vite par défaut
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Démarrage du serveur
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('\n🚀 ===================================');
  console.log(`✅ Backend NestJS démarré !`);
  console.log(`📍 URL : http://localhost:${port}`);
  console.log(`📊 Endpoints disponibles :`);
  console.log(`   - POST http://localhost:${port}/quotes/analyze`);
  console.log(`   - GET  http://localhost:${port}/quotes/categories`);
  console.log(`   - GET  http://localhost:${port}/quotes/health`);
  console.log('=====================================\n');
}

bootstrap();