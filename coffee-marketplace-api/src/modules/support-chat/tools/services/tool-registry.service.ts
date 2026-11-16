import { Injectable } from '@nestjs/common';
import { SupportTool } from '../interfaces/support-tool.interface';

@Injectable()
export class ToolRegistryService {
  private readonly tools = new Map<string, SupportTool>();

  /**
   * Registers a new tool.
   * Duplicate tool names are rejected to prevent accidental overrides.
   */
  register(tool: SupportTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }

    this.tools.set(tool.name, tool);
  }

  /**
   * Returns a registered tool by its name.
   */
  get(name: string): SupportTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Returns all registered tools.
   */
  getAll(): SupportTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Checks whether a tool is registered.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Returns tool definitions in a format suitable for AI providers.
   */
  getDefinitions(): Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }> {
    return this.getAll().map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
}
