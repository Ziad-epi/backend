/**
 * DTO (Data Transfer Object) pour valider les données d'un devis soumis.
 * Utilise class-validator pour la validation automatique.
 */
import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateQuoteDto {
  /**
   * Nom du fournisseur (ex: "AWS", "Microsoft Azure")
   */
  @IsString({ message: 'Le nom du fournisseur doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom du fournisseur est requis' })
  @MaxLength(100, { message: 'Le nom du fournisseur ne peut pas dépasser 100 caractères' })
  vendorName: string;

  /**
   * Contenu textuel du devis (prix, services, conditions, etc.)
   */
  @IsString({ message: 'Le contenu doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le contenu du devis est requis' })
  @MinLength(50, { message: 'Le devis doit contenir au moins 50 caractères pour être analysé' })
  @MaxLength(5000, { message: 'Le devis est trop long (maximum 5000 caractères)' })
  content: string;

  /**
   * Catégorie du service (ex: "Cloud & Infrastructure", "Cybersecurity")
   */
  @IsString({ message: 'La catégorie doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La catégorie est requise' })
  @MaxLength(100, { message: 'La catégorie ne peut pas dépasser 100 caractères' })
  category: string;
}