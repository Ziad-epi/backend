/**
 * Contrôleur REST pour les endpoints de devis.
 * Expose les routes HTTP et délègue la logique au service.
 */
import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { AnalysisResultDto } from './dto/analysis-result.dto';
import { AIServiceClient } from '../ai-service/ai-service.client';

@Controller('quotes')
export class QuotesController {
  private readonly logger = new Logger(QuotesController.name);

  constructor(
    private readonly quotesService: QuotesService,
    private readonly aiServiceClient: AIServiceClient,
  ) {}

  /**
   * POST /quotes/analyze
   *
   * Endpoint principal : soumet plusieurs devis pour analyse comparative.
   *
   * Body attendu :
   * {
   *   "quotes": [
   *     {
   *       "vendorName": "AWS",
   *       "content": "...",
   *       "category": "Cloud & Infrastructure"
   *     }
   *   ]
   * }
   *
   * @param quotes - Tableau de devis à analyser
   * @returns Résultat de l'analyse avec recommandation
   */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyzeQuotes(
    @Body('quotes', new ValidationPipe({ transform: true, whitelist: true }))
    quotes: CreateQuoteDto[],
  ): Promise<AnalysisResultDto> {
    this.logger.log(`Requête d'analyse reçue : ${quotes.length} devis`);

    const result = await this.quotesService.analyzeQuotes(quotes);

    this.logger.log('Analyse renvoyée avec succès au client');

    return result;
  }

  /**
   * GET /quotes/categories
   *
   * Retourne les catégories disponibles pour classifier les devis.
   * Permet au frontend de proposer une liste déroulante cohérente.
   *
   * @returns Liste des catégories
   */
  @Get('categories')
  getCategories(): { categories: string[] } {
    this.logger.log('Récupération des catégories');

    return {
      categories: this.quotesService.getAvailableCategories(),
    };
  }

  /**
   * GET /quotes/health
   *
   * Healthcheck pour vérifier que :
   * 1. L'API NestJS fonctionne
   * 2. Le service IA FastAPI est accessible
   *
   * Utile pour le monitoring et les alertes.
   *
   * @returns Statut de santé des services
   */
  @Get('health')
  async checkHealth(): Promise<{
    status: string;
    backend: string;
    aiService: boolean;
    timestamp: string;
  }> {
    this.logger.log('Healthcheck demandé');

    const aiHealthy = await this.aiServiceClient.checkHealth();

    return {
      status: aiHealthy ? 'ok' : 'degraded',
      backend: 'ok',
      aiService: aiHealthy,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /quotes/stats
   *
   * Retourne des statistiques sur les analyses effectuées.
   * (Endpoint bonus pour monitoring)
   *
   * @returns Statistiques basiques
   */
  @Get('stats')
  getStats(): { totalAnalyses: number; averageScore: number } {
    this.logger.log('Récupération des statistiques');

    return this.quotesService.getAnalysisStats();
  }
}