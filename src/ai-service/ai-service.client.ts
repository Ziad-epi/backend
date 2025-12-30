/**
 * Client HTTP pour communiquer avec le service FastAPI.
 * Encapsule les appels réseau et la gestion d'erreurs.
 */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { CreateQuoteDto } from '../quotes/dto/create-quote.dto';
import { AnalysisResultDto } from '../quotes/dto/analysis-result.dto';

@Injectable()
export class AIServiceClient {
  private readonly client: AxiosInstance;
  private readonly AI_SERVICE_URL: string;

  constructor() {
    // URL du service FastAPI (configurable via env)
    this.AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // Configuration du client HTTP avec timeout
    this.client = axios.create({
      baseURL: this.AI_SERVICE_URL,
      timeout: 30000, // 30 secondes (l'IA peut être lente)
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Envoie les devis au service IA pour analyse.
   * 
   * @param quotes - Liste des devis à analyser
   * @returns Résultat de l'analyse
   * @throws HttpException si le service IA est indisponible
   */
  async analyzeQuotes(quotes: CreateQuoteDto[]): Promise<AnalysisResultDto> {
    try {
      // Transformation des données au format attendu par FastAPI
      const payload = {
        quotes: quotes.map(q => ({
          vendor_name: q.vendorName,
          content: q.content,
          category: q.category,
        })),
      };

      // Appel HTTP POST vers /analyze
      const response = await this.client.post('/analyze', payload);

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
      // Gestion détaillée des erreurs
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new HttpException(
            'Le service IA est indisponible. Veuillez réessayer plus tard.',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
        
        if (error.response) {
          // L'API a répondu avec un code d'erreur
          throw new HttpException(
            `Erreur du service IA : ${error.response.data.detail || error.message}`,
            error.response.status,
          );
        }
      }

      // Erreur générique
      throw new HttpException(
        'Erreur lors de l\'analyse des devis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Vérifie si le service IA est accessible.
   * Utile pour les healthchecks.
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/');
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }
}