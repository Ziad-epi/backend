/**
 * Point d'entrée de l'application NestJS.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation automatique des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les champs non déclarés
      forbidNonWhitelisted: true, // Rejette si champs inconnus
      transform: true, // Transforme les types automatiquement
    }),
  );

  // CORS pour autoriser le frontend React
  app.enableCors({
    origin: 'http://localhost:5