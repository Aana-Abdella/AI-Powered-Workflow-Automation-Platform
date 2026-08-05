import OpenAI from 'openai';
import config from '@/config';
import logger from '@/utils/logger';
import { InternalServerError } from '@/utils/errors';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface AIProcessingResult {
  output: string;
  tokensUsed: number;
  estimatedCost: number;
}

export class AIService {
  /**
   * Summarize text using OpenAI
   */
  async summarizeText(text: string, maxLength = 200): Promise<AIProcessingResult> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that summarizes text concisely. Keep summaries under ${maxLength} words.`,
          },
          {
            role: 'user',
            content: `Summarize the following text:\n\n${text}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      const output = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const estimatedCost = this.calculateCost(tokensUsed, 'gpt-3.5-turbo');

      logger.info('AI summarization completed', {
        tokensUsed,
        estimatedCost,
      });

      return {
        output,
        tokensUsed,
        estimatedCost,
      };
    } catch (error) {
      logger.error('AI summarization failed:', error);
      throw new InternalServerError('AI processing failed');
    }
  }

  /**
   * Transform text using AI
   */
  async transformText(
    text: string,
    instruction: string
  ): Promise<AIProcessingResult> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that transforms text according to instructions.',
          },
          {
            role: 'user',
            content: `${instruction}\n\nText to transform:\n${text}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const output = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const estimatedCost = this.calculateCost(tokensUsed, 'gpt-3.5-turbo');

      logger.info('AI transformation completed', {
        tokensUsed,
        estimatedCost,
      });

      return {
        output,
        tokensUsed,
        estimatedCost,
      };
    } catch (error) {
      logger.error('AI transformation failed:', error);
      throw new InternalServerError('AI processing failed');
    }
  }

  /**
   * Extract structured data from text
   */
  async extractData(
    text: string,
    schema: Record<string, string>
  ): Promise<AIProcessingResult> {
    try {
      const schemaDescription = Object.entries(schema)
        .map(([key, description]) => `- ${key}: ${description}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts structured data from text. Return only valid JSON.',
          },
          {
            role: 'user',
            content: `Extract the following information from the text and return as JSON:\n\n${schemaDescription}\n\nText:\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const output = response.choices[0]?.message?.content || '{}';
      const tokensUsed = response.usage?.total_tokens || 0;
      const estimatedCost = this.calculateCost(tokensUsed, 'gpt-3.5-turbo');

      logger.info('AI data extraction completed', {
        tokensUsed,
        estimatedCost,
      });

      return {
        output,
        tokensUsed,
        estimatedCost,
      };
    } catch (error) {
      logger.error('AI data extraction failed:', error);
      throw new InternalServerError('AI processing failed');
    }
  }

  /**
   * Calculate estimated cost based on tokens and model
   */
  private calculateCost(tokens: number, model: string): number {
    // Pricing as of 2024 (per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-4': { input: 0.03, output: 0.06 },
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    // Simplified: assume 50/50 split between input and output
    const avgPrice = (modelPricing.input + modelPricing.output) / 2;
    return (tokens / 1000) * avgPrice;
  }
}

export default new AIService();
