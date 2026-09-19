import { UserStatus } from '../../users/enums/user-status.enum';
import { SystemRole } from '../../../common/constants/system-roles.constant';

export class AdminUserReportItemDto {
  /**
   * Unique identifier of the user.
   */
  userId: string;

  /**
   * Display name of the user.
   */
  name: string | null;

  /**
   * User's phone number used for account identification.
   */
  phone: string;

  /**
   * Current role assigned to the user.
   */
  role: SystemRole;

  /**
   * Current account status.
   */
  status: UserStatus;

  /**
   * Date and time when the user account was created.
   */
  createdAt: string;
}
