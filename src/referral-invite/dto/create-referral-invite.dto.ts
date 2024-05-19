import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsUUID } from "class-validator";

export class CreateReferralInviteDto {
    @IsDateString()
    @IsNotEmpty()
    expire_date: string;
}
