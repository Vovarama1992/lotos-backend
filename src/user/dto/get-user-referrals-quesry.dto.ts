import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";

export enum GetUserReferralType {
    ALL='all',
    WEEK='week'
}

export class GetUserReferralsQueryDto {
    @IsOptional()
    @IsEnum(GetUserReferralType)
    type?: GetUserReferralType
}