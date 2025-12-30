/**
 * DTO pour valider les données d'un devis soumis.
 * Utilise class-validator pour la validation automatique.
 */
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du fournisseur est requis' })
  @MaxLength(100)
  vendorName: string;

  @IsString()
  @IsNotEmpty({ message: 'Le contenu du devis est requis' })
  @MaxLength(5000, { message: 'Le devis est trop long (max 5000 caractères)' })
  content: string;

  @IsString()
  @IsNotEmpty({ message: 'La catégorie est requise' })
  category: string;
}