import { AdminOrderReportItemDto } from './admin-order-report-item.dto';

export class AdminOrderReportResponseDto {
  /**
   * Orders returned for the current page.
   */
  data: AdminOrderReportItemDto[];

  /**
   * Total number of orders matching the applied filters.
   *
   * This value represents the complete result set, not only
   * the records included in the current page.
   */
  total: number;

  /**
   * Current page number.
   */
  page: number;

  /**
   * Maximum number of records returned per page.
   */
  limit: number;

  /**
   * Total number of pages available for the filtered result set.
   */
  totalPages: number;
}
