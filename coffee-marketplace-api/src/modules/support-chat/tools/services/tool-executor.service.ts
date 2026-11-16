import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ToolRegistryService } from './tool-registry.service';

@Injectable()
export class ToolExecutorService {
  constructor(private readonly toolRegistry: ToolRegistryService) {}

  /**
   * Executes a registered tool using JSON arguments received from the AI.
   */
  async execute(toolName: string, rawArguments: string): Promise<unknown> {
    // Resolve the requested tool from the trusted registry.
    const tool = this.toolRegistry.get(toolName);

    if (!tool) {
      throw new NotFoundException(`Tool "${toolName}" is not registered.`);
    }

    // Parse the JSON arguments returned by the AI model.
    let parsedArguments: unknown;

    try {
      parsedArguments = JSON.parse(rawArguments);
    } catch {
      throw new BadRequestException('The tool arguments must be valid JSON.');
    }

    // Tool arguments must be a JSON object, not an array or primitive.
    if (
      parsedArguments === null ||
      typeof parsedArguments !== 'object' ||
      Array.isArray(parsedArguments)
    ) {
      throw new BadRequestException(
        'The tool arguments must be a JSON object.',
      );
    }

    // Execute the registered backend function.
    return tool.execute(parsedArguments);
  }
}
