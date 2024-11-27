import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CohereClientV2 } from 'cohere-ai';

@Injectable()
export class CohereService {
  private readonly cohere: CohereClientV2;
  private readonly cohereApiKey: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.cohereApiKey = this.configService.get<string>('cohere_api_key');
    this.cohere = new CohereClientV2({
      token: this.cohereApiKey
    });
  }

  /**
   * Relaciona texto extraído con los campos esperados.
   * @param extractedText - Texto extraído del documento.
   * @param expectedFields - Campos esperados para la comparación.
   * @returns Un objeto que mapea los campos esperados con el texto extraído.
   */
  async matchFields(extractedText: string[], expectedFields: string[]): Promise<Record<string, string>> {
    try {
      const prompt = `
        Match the following fields with the given text. 
        Return JSON with each field as key and the most relevant part of the text as value.

        Fields: ${expectedFields.join(', ')}
        Text: ${extractedText.join(' ')}
      `;

      const response = await this.cohere.chat({
        model: "command-r-plus-08-2024",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.2,
      });

      const matchedFields = JSON.parse(response.message.content[0].text);
      return matchedFields;
    } catch (error) {
      console.error('Error al procesar con Cohere:', error.message);
      throw new InternalServerErrorException('Error al procesar los datos con Cohere');
    }
  }
}
