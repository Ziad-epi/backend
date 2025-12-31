/**
 * Service contenant la logique métier pour l'analyse de devis.
 * Orchestre les appels au service IA et applique les règles business.
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AIServiceClient } from '../ai-service/ai-service.client';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { AnalysisResultDto, QuoteAnalysisDto } from './dto/analysis-result.dto';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(private readonly aiServiceClient: AIServiceClient) {}

  /**
   * Analyse un ensemble de devis et applique des règles métier.
   *
   * Règles de scoring supplémentaires (côté business) :
   * - Si prix manquant → pénalité de 10 points
   * - Si moins de 2 points forts → pénalité de 5 points
   * - Si plus de 3 risques → pénalité de 10 points
   *
   * @param quotes - Devis à analyser
   * @returns Résultat enrichi avec scoring ajusté et tri par score
   * @throws BadRequestException si validation métier échoue
   */
  async analyzeQuotes(quotes: CreateQuoteDto[]): Promise<AnalysisResultDto> {
    this.logger.log(`Début de l'analyse de ${quotes.length} devis`);

    // Validation business : minimum 2 devis pour comparaison
    if (quotes.length < 2) {
      throw new BadRequestException(
        'Veuillez soumettre au moins 2 devis pour une comparaison pertinente',
      );
    }

    // Validation business : maximum 10 devis (limite arbitraire pour performance)
    if (quotes.length > 10) {
      throw new BadRequestException(
        'Maximum 10 devis par analyse pour garantir un temps de réponse acceptable',
      );
    }

    // Appel au service IA pour l'analyse brute
    const result = await this.aiServiceClient.analyzeQuotes(quotes);

    this.logger.log('Application des règles métier supplémentaires...');

    // Application des règles métier et ajustement des scores
    result.analyses = result.analyses.map((analysis) =>
      this.applyBusinessRules(analysis),
    );

    // Tri par score décroissant (meilleur devis en premier)
    result.analyses.sort((a, b) => b.score - a.score);

    this.logger.log('Analyse terminée avec succès');

    return result;
  }

  /**
   * Applique les règles métier spécifiques à un devis.
   *
   * @param analysis - Analyse brute provenant de l'IA
   * @returns Analyse ajustée avec score modifié si nécessaire
   */
  private applyBusinessRules(analysis: QuoteAnalysisDto): QuoteAnalysisDto {
    let adjustedScore = analysis.score;
    const penalties: string[] = [];

    // Règle 1 : Prix manquant
    // Un devis sans prix clair est un red flag majeur
    if (analysis.price === null) {
      adjustedScore -= 10;
      penalties.push('Prix non spécifié (-10 pts)');
      this.logger.debug(`${analysis.vendorName} : pénalité prix manquant`);
    }

    // Règle 2 : Peu de points forts identifiés
    // Si l'IA trouve < 2 avantages, le devis manque probablement de substance
    if (analysis.strengths.length < 2) {
      adjustedScore -= 5;
      penalties.push('Peu d\'avantages identifiés (-5 pts)');
      this.logger.debug(`${analysis.vendorName} : pénalité points forts insuffisants`);
    }

    // Règle 3 : Trop de risques détectés
    // > 3 risques = devis problématique
    if (analysis.risks.length > 3) {
      adjustedScore -= 10;
      penalties.push('Nombreux risques détectés (-10 pts)');
      this.logger.debug(`${analysis.vendorName} : pénalité excès de risques`);
    }

    // Le score ne peut pas être négatif
    adjustedScore = Math.max(0, adjustedScore);

    // Ajout des pénalités à la justification du score
    let updatedReasoning = analysis.scoreReasoning;
    if (penalties.length > 0) {
      updatedReasoning += ` | Ajustements métier : ${penalties.join(', ')}`;
    }

    return {
      ...analysis,
      score: adjustedScore,
      scoreReasoning: updatedReasoning,
    };
  }

  /**
   * Récupère les catégories de devis disponibles.
   * En production, cela viendrait d'une base de données.
   *
   * @returns Liste des catégories
   */
  getAvailableCategories(): string[] {
    return [
      'Cloud & Infrastructure',
      'Cybersecurity',
      'Software Development',
      'Data Analytics',
      'IT Support & Managed Services',
      'Networking & Connectivity',
      'DevOps & CI/CD',
      'Business Software (CRM, ERP)',
    ];
  }

  /**
   * Statistiques sur les analyses (pour monitoring).
   * En prod, cela serait stocké en base de données.
   *
   * @returns Statistiques basiques
   */
  getAnalysisStats(): { totalAnalyses: number; averageScore: number } {
    // Placeholder pour démonstration
    // En prod : requête BDD pour récupérer les vraies stats
    return {
      totalAnalyses: 0,
      averageScore: 0,
    };
  }
}