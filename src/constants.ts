enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  USER = "user",
}


export enum ENVIRONMENT {
  LOCAL = 'local',
  STAGING = 'staging',
  PRODUCTION = 'prod'
}
enum Lang {
  RU = "ru",
  EN = "en",
}

export { UserRole, Lang };

export enum SocketEvent {
  PAYMENT_CRYPTO_PENDING = "payment.crypto.pending",
  PAYMENT_CRYPTO_SUCCESS = "payment.crypto.success",
  PAYMENT_BANK_PENDING = "payment.bank.pending",
  PAYMENT_BANK_WAITING_CONFIRMATION = "payment.bank.waiting-confirmation",
  PAYMENT_BANK_SUCCESS = "payment.bank.success",
  PAYMENT_BANK_CANCELLED = "payment.bank.cancelled",
  WITHDRAW_CANCELLED = "withdraw.cancelled",
  WITHDRAW_SUCCESS = "withdraw.success",
  WITHDRAW_PENDING = "withdraw.pending",
  PAYMENT_CASHBACK_WAITING_CONFIRMATION = "payment.cashback.waiting-confirmation",
  ADMIN_MESSAGE = "admin-message",
}
