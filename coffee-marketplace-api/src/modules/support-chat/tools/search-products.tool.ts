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
    'Search active marketplace products by name, type, origin, flavor, ingredients, or product features.';

  readonly parameters = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'The product search query.',
      },
    },
    required: ['query'],
    additionalProperties: false,
  };

  constructor(private readonly productService: ProductService) {}

  /**
   * Searches active products and returns internal IDs separately
   * from customer-safe product information.
   */
  async execute(arguments_: SearchProductsArguments): Promise<unknown> {
    const products = await this.productService.searchForSupportChat(
      arguments_.query,
    );

    return {
      success: true,

      // Internal field: SupportChatService must never send this to the AI.
      productIds: products.map((product) => product.id),

      count: products.length,

      products: products.map((product) => {
        // Calculate sellable stock only when inventory information exists.
        const availableStock = product.inventory
          ? Math.max(
              product.inventory.stock - product.inventory.reservedStock,
              0,
            )
          : null;

        return {
          title: product.title,
          description: product.description,
          price: Number(product.price),
          originalPrice: product.originalPrice
            ? Number(product.originalPrice)
            : null,
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
          availability:
            availableStock === null
              ? 'unknown'
              : availableStock > 0
                ? 'available'
                : 'unavailable',
        };
      }),
    };
  }
}
