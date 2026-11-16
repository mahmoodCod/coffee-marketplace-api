/**
 * Defines the structure of a support chatbot tool.
 * Every tool must provide its name, description, schema, and execution logic.
 */
export interface SupportTool<TArguments = unknown> {
    name: string;
  
    description: string;
  
    parameters: Record<string, unknown>;
  
    /**
     * Executes the tool using validated arguments.
     */
    execute(arguments_: TArguments): Promise<unknown>;
}
  