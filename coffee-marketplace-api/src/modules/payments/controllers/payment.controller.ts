import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { CreatePaymentDto } from '../dto/create-payment.dto';

import { PaymentService } from '../services/payment.service';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';

/**
 * ------------------------------------------------------------------------
 * Payment Controller
 * ------------------------------------------------------------------------
 *
 * Handles HTTP requests related to payments.
 *
 * Responsibilities:
 *
 * - Initiate a payment for an order.
 * - Verify payments manually.
 * - Handle payment gateway callbacks.
 *
 * Business logic remains inside PaymentService.
 * ------------------------------------------------------------------------
 */
@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * ------------------------------------------------------------------------
   * Create Payment
   * ------------------------------------------------------------------------
   *
   * Starts the payment process for an order.
   *
   * Flow:
   *
   * 1. Get the authenticated user.
   * 2. Receive the order ID and callback URL.
   * 3. Validate the payment request.
   * 4. Create or reuse a payment record.
   * 5. Request payment authority from the gateway.
   * 6. Return the payment URL to the client.
   * ------------------------------------------------------------------------
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create and initiate a payment',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment initiated successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payment request.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  async createPayment(
    @CurrentUser('id') userId: string,

    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentService.createPayment(
      userId,
      dto.orderId,
      dto.callbackUrl,
    );
  }

  /**
   * ------------------------------------------------------------------------
   * Verify Payment
   * ------------------------------------------------------------------------
   *
   * Verifies a payment using the authority
   * returned by the payment gateway.
   *
   * Flow:
   *
   * 1. Receive the payment authority.
   * 2. Verify the payment through PaymentService.
   * 3. Update the payment status.
   * 4. Mark the order as paid.
   * 5. Settle inventory and product sales.
   * ------------------------------------------------------------------------
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a payment',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment verified successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payment verification failed.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found.',
  })
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentService.verifyPayment(dto.authority);
  }

  /**
   * ------------------------------------------------------------------------
   * Payment Callback
   * ------------------------------------------------------------------------
   *
   * Handles the callback sent by the payment gateway
   * after the customer completes the payment process.
   *
   * Flow:
   *
   * 1. Customer completes payment on the gateway.
   * 2. Gateway redirects the customer to this endpoint.
   * 3. The authority is received from the query parameters.
   * 4. PaymentService verifies the payment.
   * 5. The payment settlement process is executed.
   *
   * Example:
   *
   * GET /payments/callback?authority=AUTH-123
   * ------------------------------------------------------------------------
   */
  @Get('callback')
  @ApiOperation({
    summary: 'Handle payment gateway callback',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment callback processed successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payment callback verification failed.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found.',
  })
  async handleCallback(@Query('authority') authority: string) {
    return this.paymentService.verifyPayment(authority);
  }
}
