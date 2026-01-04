import { Injectable } from '@nestjs/common';
import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Load .env file explicitly
config({ path: resolve(__dirname, '../../.env') });

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
