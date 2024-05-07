export interface OpenGameRequest {
  cmd: string;
  hall: string;
  language: string;
  key: string;
  demo: number;
  login: string;
  gameId: string;
  bm?: string;
}