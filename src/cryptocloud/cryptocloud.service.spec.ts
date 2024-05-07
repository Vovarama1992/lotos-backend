import { Test, TestingModule } from '@nestjs/testing';
import { CryptocloudService } from './cryptocloud.service';

describe('CryptocloudService', () => {
  let service: CryptocloudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptocloudService],
    }).compile();

    service = module.get<CryptocloudService>(CryptocloudService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
