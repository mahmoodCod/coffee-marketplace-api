import { Injectable, OnModuleInit } from '@nestjs/common';
import { ToolRegistryService } from '../tools/services/tool-registry.service';
import { SearchProductsTool } from './search-products.tool';

@Injectable()
export class SupportChatToolsBootstrap implements OnModuleInit {
  constructor(
    private readonly toolRegistry: ToolRegistryService,
    private readonly searchProductsTool: SearchProductsTool,
  ) {}

  /**
   * Registers all support chat tools when the module initializes.
   */
  onModuleInit(): void {
    this.toolRegistry.register(this.searchProductsTool);
  }
}
