/**
 * Structure de la réponse d'analyse.
 * Correspond au modèle Python côté FastAPI.
 */
export class QuoteAnalysisDto {
  vendorName: string;
  price: number | null;
  currency: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  score: number;
  scoreReasoning: string;
}

export class AnalysisResultDto {
  analyses: QuoteAnalysisDto[];
  recommendation: string;
  analyzedAt: Date;
}