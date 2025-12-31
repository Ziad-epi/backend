/**
 * Client HTTP pour communiquer avec le service FastAPI.
 * Encapsule les appels réseau et la gestion d'erreurs.
 */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { CreateQuoteDto } from '../quotes/dto/create-quote.dto';
import { AnalysisResultDto, QuoteAnalysisDto } from '../quotes/dto/analysis-result.dto';

@Injectable()
export class AIServiceClient {
  private readonly client: AxiosInstance;
  private readonly AI_SERVICE_URL: string;
  private readonly logger = new Logger(AIServiceClient.name);

  constructor(private configService: ConfigService) {
    // URL du service FastAPI (configurable via .env)
    this.AI_SERVICE_URL = this.configService.get<string>(
      'AI_SERVICE_URL',
      'http://localhost:8000',
    );

    // Configuration du client HTTP avec timeout
    this.client = axios.create({
      baseURL: this.AI_SERVICE_URL,
      timeout: 35000, // 35 secondes (l'IA peut prendre du temps)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`AI Service configuré sur : ${this.AI_SERVICE_URL}`);
  }

  /**
   * Envoie les devis au service IA pour analyse.
   *
   * @param quotes - Liste des devis à analyser
   * @returns Résultat de l'analyse avec scores et recommandation
   * @throws HttpException si le service IA est indisponible ou retourne une erreur
   */
  async analyzeQuotes(quotes: CreateQuoteDto[]): Promise<AnalysisResultDto> {
    try {
      this.logger.log(`Envoi de ${quotes.length} devis au service IA...`);

      // Transformation des données au format attendu par FastAPI (snake_case)
      const payload = {
        quotes: quotes.map((q) => ({
          vendor_name: q.vendorName,
          content: q.content,
          category: q.category,
        })),
      };

      // Appel HTTP POST vers /analyze
      const response = await this.client.post('/analyze', payload);

      this.logger.log('Analyse IA terminée avec succès');

      // Transformation de la réponse (snake_case → camelCase)
      const result: AnalysisResultDto = {
        analyses: response.data.analyses.map((analysis: any) => ({
          vendorName: analysis.vendor_name,
          price: analysis.price,
          currency: analysis.currency,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          risks: analysis.risks,
          score: analysis.score,
          scoreReasoning: analysis.score_reasoning,
        })),
        recommendation: response.data.recommendation,
        analyzedAt: new Date(),
      };

      return result;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Vérifie si le service IA est accessible.
   * Utile pour les healthchecks.
   *
   * @returns true si le service répond correctement, false sinon
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/', { timeout: 5000 });
      return response.data.status === 'ok';
    } catch (error) {
      this.logger.warn('Service IA non accessible');
      return false;
    }
  }

  /**
   * Gestion centralisée des erreurs avec messages explicites.
   *
   * @param error - Erreur Axios ou générique
   * @throws HttpException avec code et message appropriés
   */
  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Service IA inaccessible (réseau, serveur éteint)
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
        this.logger.error('Impossible de joindre le service IA');
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Le service d\'analyse IA est temporairement indisponible. Veuillez réessayer dans quelques instants.',
            error: 'Service Unavailable',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Timeout (analyse trop longue)
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        this.logger.error('Timeout lors de l\'appel au service IA');
        throw new HttpException(
          {
            statusCode: HttpStatus.GATEWAY_TIMEOUT,
            message: 'L\'analyse prend trop de temps. Veuillez réduire le nombre de devis ou réessayer.',
            error: 'Gateway Timeout',
          },
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      // Le service IA a répondu avec un code d'erreur
      if (axiosError.response) {
        this.logger.error(
          `Erreur du service IA : ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`,
        );

        const aiErrorMessage =
          axiosError.response.data?.detail ||
          axiosError.response.data?.message ||
          'Erreur inconnue du service IA';

        throw new HttpException(
          {
            statusCode: axiosError.response.status,
            message: `Erreur lors de l'analyse : ${aiErrorMessage}`,
            error: 'AI Service Error',
          },
          axiosError.response.status,
        );
      }
    }

    // Erreur générique non identifiée
    this.logger.error(`Erreur inconnue : ${error.message}`);
    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Une erreur inattendue est survenue lors de l\'analyse des devis',
        error: 'Internal Server Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}