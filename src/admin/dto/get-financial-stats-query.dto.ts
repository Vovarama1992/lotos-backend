import { IsDateString, IsOptional, IsUUID } from "class-validator";

export class GetFinancialStatsQueryDto {
    @IsOptional()
    @IsUUID()
    user_id?: string;

    @IsOptional()
    @IsDateString()
    start_date: string;

    @IsOptional()
    @IsDateString()
    end_date: string
}