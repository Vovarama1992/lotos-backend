export class RegisterUserDto {
  email?: string;
  phone?: string;
  password: string;
  referral_invitation_id?: string;
}


export class CheckUserRegister {
  email?: string;
  phone?: string;
}