import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";

export enum PaymentDetailMethod {
    CARD = 'card',
    SBP = 'sbp'
}

export class GetPaymentDetailsQueryDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsEnum(PaymentDetailMethod)
    method: PaymentDetailMethod;
}