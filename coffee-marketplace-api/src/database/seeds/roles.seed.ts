import { Role } from '../../modules/roles/entities/role.entity';
import { DataSource, Repository } from 'typeorm';

/**
 * Seeds the default system roles.
 *
 * These roles are required by the RBAC authorization system
 * and are inserted only once during project initialization.
 */
export class RolesSeeder {
  private readonly repository: Repository<Role>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Role);
  }

  /**
   * Executes the seeding process.
   */
  async run(): Promise<void> {
    const roles = [
      {
        name: 'admin',
        description: 'System administrator with full access.',
      },
      {
        name: 'seller',
        description: 'Coffee shop owner who manages products and orders.',
      },
      {
        name: 'customer',
        description: 'Marketplace customer.',
      },
    ];

    for (const role of roles) {
      const exists = await this.repository.findOne({
        where: {
          name: role.name,
        },
      });

      if (!exists) {
        await this.repository.save(this.repository.create(role));
      }
    }

    console.log('✅ Roles seeded successfully.');
  }
}
