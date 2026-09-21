import { SellerProductSalesReportItemDto } from './seller-product-sales-report-item.dto';

export class SellerProductSalesReportResponseDto {
  /**
   * Seller product sales records returned for the current page.
   */
  data: SellerProductSalesReportItemDto[];

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
