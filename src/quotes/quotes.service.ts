/**
 * Service contenant la logique métier pour l'analyse de devis.
 * Orchestre les appels au service IA et applique les règles business.
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { AIServiceClient } from '../ai-service/ai-service.client';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { AnalysisResultDto } from './dto/analysis-result.dto';

@Injectable()
export class QuotesService {
  constructor(private readonly aiServiceClient: AIServiceClient) {}

  /**
   * Analyse un ensemble de devis et applique des règles métier.
   * 
   * Règles de scoring supplémentaires (côté business) :
   * - Si prix manquant → pénalité de 10 points
   * - Si moins de 2 strengths → pénalité de 5 points
   * - Si plus de 3 risques → pénalité de 10 points
   * 
   * @param quotes - Devis à analyser
   * @returns Résultat enrichi avec scoring ajusté
   */
  async analyzeQuotes(quotes: CreateQuoteDto[]): Promise<AnalysisResultDto> {
    // Validation business
    if (quotes.length < 2) {
      throw new BadRequestException(
        'Veuillez soumettre au moins 2 devis pour une comparaison pertinente',
      );
    }

    if (quotes.length > 10) {
      throw new BadRequestException(
        'Maximum 10 devis par analyse',
      );
    }

    // Appel au service IA
    const result = await this.aiServiceClient.analyzeQuotes(quotes);

    // Application des règles métier supplémentaires
    result.analyses = result.analyses.map(analysis => {
      let adjustedScore = analysis.score;
      const penalties: string[] = [];

      // Règle 1 : Prix manquant
      if (analysis.price === null) {
        adjustedScore -= 10;
        penalties.push('Prix non spécifié (-10 pts)');
      }

      // Règle 2 : Peu de points forts
      if (analysis.strengths.length < 2) {
        adjustedScore -= 5;
        penalties.push('Peu d\'avantages identifiés (-5 pts)');
      }

      // Règle 3 : Trop de risques
      if (analysis.risks.length > 3) {
        adjustedScore -= 10;
        penalties.push('Nombreux risques détectés (-10 pts)');
      }

      // Score minimum de 0
      adjustedScore = Math.max(0, adjustedScore);

      // Ajout des pénalités au raisonnement
      if (penalties.length > 0) {
        analysis.scoreReasoning += ` | Ajustements : ${penalties.join(', ')}`;
      }

      return {
        ...analysis,
        score: adjustedScore,
      };
    });

    // Tri par score décroissant
    result.analyses.sort((a, b) => b.score - a.score);

    return result;
  }

  /**
   * Récupère les catégories de devis disponibles.
   * En prod, cela viendrait d'une base de données.
   */
  getAvailableCategories(): string[] {
    return [
      'Cloud & Infrastructure',
      'Cybersecurity',
      'Software Development',
      'Data Analytics',
      'IT Support',
      'Networking',
    ];
  }
}