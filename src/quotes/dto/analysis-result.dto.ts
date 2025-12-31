/**
 * DTO pour la structure de la réponse d'analyse.
 * Correspond au modèle Python côté FastAPI (avec transformation camelCase).
 */

/**
 * Analyse individuelle d'un devis.
 */
export class QuoteAnalysisDto {
  /**
   * Nom du fournisseur
   */
  vendorName: string;

  /**
   * Prix total extrait du devis (null si non trouvé)
   */
  price: number | null;

  /**
   * Devise (EUR, USD, etc.)
   */
  currency: string;

  /**
   * Liste des points forts identifiés
   */
  strengths: string[];

  /**
   * Liste des points faibles identifiés
   */
  weaknesses: string[];

  /**
   * Liste des risques détectés
   */
  risks: string[];

  /**
   * Score de qualité sur 100
   */
  score: number;

  /**
   * Justification textuelle du score
   */
  scoreReasoning: string;
}

/**
 * Résultat complet de l'analyse de plusieurs devis.
 */
export class AnalysisResultDto {
  /**
   * Liste des analyses individuelles (triées par score décroissant)
   */
  analyses: QuoteAnalysisDto[];

  /**
   * Recommandation finale comparative
   */
  recommendation: string;

  /**
   * Date et heure de l'analyse
   */
  analyzedAt: Date;
}