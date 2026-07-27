import { ValidationPipe } from '@nestjs/common';

/**
 * ------------------------------------------------------------------------
 * Global Validation Pipe
 * ------------------------------------------------------------------------
 *
 * Centralized validation configuration.
 *
 * Responsibilities:
 * - Remove unknown properties
 * - Transform payloads into DTO instances
 * - Reject unexpected fields
 *
 * Notes:
 * This pipe is registered globally in main.ts.
 * ------------------------------------------------------------------------
 */

export const GlobalValidationPipe = new ValidationPipe({
  /**
   * Automatically transform incoming payloads
   * into DTO class instances.
   */
  transform: true,

  /**
   * Removes properties that are not part
   * of the DTO definition.
   */
  whitelist: true,

  /**
   * Throws an exception when extra properties
   * are sent by the client.
   */
  forbidNonWhitelisted: true,

  /**
   * Enables automatic primitive conversion.
   */
  transformOptions: {
    enableImplicitConversion: true,
  },

  /**
   * Do not expose validated object in exceptions.
   */
  validationError: {
    target: false,
  },
});
