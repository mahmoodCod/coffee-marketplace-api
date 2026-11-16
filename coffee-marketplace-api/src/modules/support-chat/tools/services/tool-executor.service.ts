import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import Ajv, { type ValidateFunction } from 'ajv';
import { ToolRegistryService } from './tool-registry.service';

@Injectable()
export class ToolExecutorService {
  private readonly ajv = new Ajv({
    allErrors: true,
    strict: true,
    coerceTypes: false,
    removeAdditional: false,
    useDefaults: false,
  });

  // Cache compiled validators to avoid compiling the same schema repeatedly.
  private readonly validators = new Map<string, ValidateFunction>();

  constructor(private readonly toolRegistry: ToolRegistryService) {}

  /**
   * Executes a registered tool after validating its JSON arguments.
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

    // Tool arguments must be a JSON object.
    if (
      parsedArguments === null ||
      typeof parsedArguments !== 'object' ||
      Array.isArray(parsedArguments)
    ) {
      throw new BadRequestException(
        'The tool arguments must be a JSON object.',
      );
    }

    // Reuse the compiled validator when this tool is executed again.
    let validate = this.validators.get(toolName);

    if (!validate) {
      try {
        validate = this.ajv.compile(tool.parameters);
        this.validators.set(toolName, validate);
      } catch {
        throw new InternalServerErrorException(
          'The registered tool has an invalid JSON Schema.',
        );
      }
    }

    // Reject arguments that do not match the tool's JSON Schema.
    if (!validate(parsedArguments)) {
      const validationErrors = (validate.errors ?? [])
        .map((error) => {
          const path = error.instancePath || '/';

          return `${path} ${error.message ?? 'is invalid'}`;
        })
        .join('; ');

      throw new BadRequestException({
        message: 'The tool arguments are invalid.',
        errors: validationErrors,
      });
    }

    // Execute the backend function only after successful validation.
    return tool.execute(parsedArguments);
  }
}
