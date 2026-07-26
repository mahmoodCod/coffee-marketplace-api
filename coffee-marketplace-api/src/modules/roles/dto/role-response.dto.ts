/**
 * ------------------------------------------------------------------------
 * Role Response DTO
 * ------------------------------------------------------------------------
 *
 * Defines the data returned to API consumers.
 *
 * Never expose Entity objects directly.
 * ------------------------------------------------------------------------
 */
export class RoleResponseDto {
  id: string;

  name: string;

  description?: string;

  createdAt: Date;

  updatedAt: Date;
}
