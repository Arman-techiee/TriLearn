require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const parseInteger = (value, fallback) => {
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInteger(process.env.PGPOOL_MAX, 10),
  min: parseInteger(process.env.PGPOOL_MIN, 0),
  idleTimeoutMillis: parseInteger(process.env.PGPOOL_IDLE_TIMEOUT_MS, 10000),
  connectionTimeoutMillis: parseInteger(process.env.PGPOOL_CONNECTION_TIMEOUT_MS, 10000),
  maxUses: parseInteger(process.env.PGPOOL_MAX_USES, 0),
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

module.exports = prisma
