import { AdminUserReportItemDto } from './admin-user-report-item.dto';

export class AdminUserReportResponseDto {
  /**
   * Users returned for the current page.
   */
  data: AdminUserReportItemDto[];

  /**
   * Total number of users matching the applied filters.
   */
  total: number;

  /**
   * Current page number.
   */
  page: number;

  /**
   * Maximum number of users returned per page.
   */
  limit: number;

  /**
   * Total number of pages available for the filtered result set.
   */
  totalPages: number;
}
