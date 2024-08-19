export enum DepositMode {
  MANUAL = "manual",
  AUTO = "auto",
}

export class CasinoConfig {
  depositMode: DepositMode;
  depositSessionDuration: number;
  deleteExpiredDepositSessions: boolean;
  currentDomain: string;
  currentCasinoBotDomain: string;


  public constructor(data: Partial<CasinoConfig>) {
    return Object.assign(this, data);
  }
}
