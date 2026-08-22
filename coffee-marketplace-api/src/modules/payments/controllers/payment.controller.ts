import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PaymentService } from '../services/payment.service';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

/**
 * Payment Controller
 *
 * Handles HTTP requests related to payments.
 *
 * Responsibilities:
 * - Initiate payments.
 * - Verify payment results.
 * - Handle payment callbacks.
 *
 * Business logic is handled by PaymentService.
 */
@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create and initiate a payment for an order.
   *
   * The authenticated user can only pay
   * for orders that belong to them.
   */
  @Post(':orderId')
  @ApiOperation({
    summary: 'Create payment',
    description:
      'Creates and initiates a payment for an order belonging to the authenticated user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment initiated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be paid.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  async createPayment(
    @CurrentUser('id') userId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentService.createPayment(userId, orderId);
  }

  /**
   * Verify a payment using the authority
   * returned by the payment gateway.
   *
   * The authority is provided through the
   * payment gateway callback query parameters.
   */
  @Get('verify')
  @ApiOperation({
    summary: 'Verify payment',
    description:
      'Verifies the payment result using the authority returned by the payment gateway.',
  })
  @ApiQuery({
    name: 'authority',
    required: true,
    description: 'Payment authority returned by the payment gateway.',
    example: 'AUTH-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment verified successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Payment verification failed.',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found.',
  })
  async verifyPayment(@Query('authority') authority: string) {
    return this.paymentService.verifyPayment(authority);
  }

  /**
   * Handle payment gateway callback.
   *
   * This endpoint is reserved for payment gateways
   * that send server-to-server callback notifications.
   *
   * The exact callback payload depends on the
   * payment gateway implementation.
   */
  @Post('callback')
  @ApiOperation({
    summary: 'Handle payment callback',
    description: 'Receives callback notifications from the payment gateway.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment callback received successfully.',
  })
  async handleCallback() {
    return {
      message: 'Payment callback received.',
    };
  }
}
