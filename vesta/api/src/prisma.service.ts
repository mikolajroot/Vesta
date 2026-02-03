import { Injectable } from '@nestjs/common';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const envCandidates = [
  resolve(process.cwd(), 'api/.env'),
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '../../.env'),
  resolve(__dirname, '../../../.env'),
];

const envPath = envCandidates.find((path) => existsSync(path));
if (envPath) {
  config({ path: envPath });
} else {
  config();
}

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }
}
