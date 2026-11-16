import { AnySchema } from 'ajv';

/**
 * Defines the structure of a support chatbot tool.
 * Every tool must provide its metadata, JSON Schema, and execution logic.
 */
export interface SupportTool<TArguments = unknown> {
  name: string;

  description: string;

  parameters: AnySchema;

  /**
   * Executes the tool using validated arguments.
   */
  execute(arguments_: TArguments): Promise<unknown>;
}
