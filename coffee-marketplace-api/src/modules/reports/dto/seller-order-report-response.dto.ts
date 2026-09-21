import { SellerOrderReportItemDto } from './seller-order-report-item.dto';

export class SellerOrderReportResponseDto {
  /**
   * Seller-specific orders returned for the current page.
   */
  data: SellerOrderReportItemDto[];

  /**
   * Total number of orders matching the seller-specific filters.
   */
  total: number;

  /**
   * Current page number.
   */
  page: number;

  /**
   * Maximum number of orders returned per page.
   */
  limit: number;

  /**
   * Total number of pages available for the filtered result set.
   */
  totalPages: number;
}
