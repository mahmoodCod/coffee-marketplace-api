import { AdminProductReportItemDto } from './admin-product-report-item.dto';

export class AdminProductReportResponseDto {
  /**
   * Products returned for the current page.
   */
  data: AdminProductReportItemDto[];

  /**
   * Total number of products matching the applied filters.
   */
  total: number;

  /**
   * Current page number.
   */
  page: number;

  /**
   * Maximum number of products returned per page.
   */
  limit: number;

  /**
   * Total number of pages available for the filtered result set.
   */
  totalPages: number;
}
