import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateQuoteDto } from './create-quote.dto';

export class AnalyzeQuotesDto {
  @IsArray({ message: 'quotes must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteDto)
  @ArrayMinSize(2, { message: 'at least two quotes are required' })
  @ArrayMaxSize(10, { message: 'maximum 10 quotes per analysis' })
  quotes: CreateQuoteDto[];
}
