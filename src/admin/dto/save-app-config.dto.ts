import { IsBoolean, IsEnum, IsNumber, IsOptional } from "class-validator";
import { DepositMode } from "src/config/entities/config.entity";

export class SaveAppConfigDto {
    @IsOptional()
    @IsEnum(DepositMode)
    depositMode?: DepositMode;

    @IsOptional()
    @IsNumber()
    depositSessionDuration?: number;

    @IsOptional()
    @IsBoolean()
    deleteExpiredDepositSessions?: boolean;
}