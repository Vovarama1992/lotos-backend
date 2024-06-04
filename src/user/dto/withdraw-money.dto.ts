import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";
import { PaymentDetailsDto } from "src/payment/entities/bankInvoice.entity";
import { WithdrawMethod } from "src/withdraw-history/entities/withdraw-history.entity";

export class WithdrawMoneyDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty()
  @IsEnum(WithdrawMethod)
  @IsNotEmpty()
  method: WithdrawMethod;

  @ApiProperty({ type: () => PaymentDetailsDto })
  @IsNotEmpty()
  payment_details: PaymentDetailsDto;
}
