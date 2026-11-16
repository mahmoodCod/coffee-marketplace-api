import { Injectable } from '@nestjs/common';
import { ProductService } from '../../products/services/product.service';
import { SupportTool } from '../tools/interfaces/support-tool.interface';

interface SearchProductsArguments {
  query: string;
}

@Injectable()
export class SearchProductsTool implements SupportTool<SearchProductsArguments> {
  readonly name = 'search_products';

  readonly description =
    'Search the active product catalog for products matching the customer query. Use this tool when the customer asks about a specific product, product type, origin, flavor, ingredients, or product features.';

  readonly parameters = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'The customer search query.',
      },
    },
    required: ['query'],
    additionalProperties: false,
  };

  constructor(private readonly productService: ProductService) {}

  /**
   * Searches active products and returns only customer-safe information.
   */
  async execute(arguments_: SearchProductsArguments): Promise<unknown> {
    const products = await this.productService.searchForSupportChat(
      arguments_.query,
    );

    return {
      count: products.length,
      products: products.map((product) => {
        // Calculate sellable stock without exposing reserved inventory.
        const availableStock = product.inventory
          ? Math.max(
              product.inventory.stock - product.inventory.reservedStock,
              0,
            )
          : 0;

        return {
          title: product.title,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice,
          type: product.productType,
          weight: product.weight,
          caffeineLevel: product.caffeineLevel,
          flavorNotes: product.flavorNotes,
          originCountry: product.originCountry,
          ingredients: product.ingredients,
          benefits: product.benefits,
          howToUse: product.howToUse,
          recommended: product.recommended,
          availableStock,
          isAvailable: availableStock > 0,
        };
      }),
    };
  }
}
