/**
 * Database connection pooling for optimal performance
 * Uses Neon's connection pooling with optimized settings
 */

import { Pool, neonConfig } from '@neondatabase/serverless'

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true
neonConfig.pipelineConnect = false

// Connection pool configuration
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL

if (!databaseUrl) {
  console.warn('No database URL found. Connection pooling will not work.')
}

// Create optimized connection pool
export const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,                    // Maximum number of clients in pool
  min: 2,                     // Minimum number of clients in pool
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout after 10 seconds trying to connect
  maxUses: 7500,              // Retire connections after 7500 uses
  allowExitOnIdle: true       // Allow process to exit if pool is idle
})

// Connection pool wrapper with automatic retry and error handling
export class DatabasePool {
  private static instance: DatabasePool
  private pool: Pool

  private constructor() {
    this.pool = pool
    this.setupEventHandlers()
  }

  public static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool()
    }
    return DatabasePool.instance
  }

  private setupEventHandlers() {
    this.pool.on('connect', (_client: unknown) => {
      console.log('📊 Database client connected')
    })

    this.pool.on('error', (err: Error, _client: unknown) => {
      console.error('📊 Database pool error:', err)
    })

    this.pool.on('remove', (_client: unknown) => {
      console.log('📊 Database client removed from pool')
    })
  }

  /**
   * Execute a query with connection pooling and retry logic
   */
  async query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const client = await this.pool.connect()

      try {
        const start = Date.now()
        const result = await client.query(text, params)
        const duration = Date.now() - start

        // Log slow queries
        if (duration > 1000) {
          console.warn(`🐌 Slow query detected (${duration}ms):`, text.substring(0, 100))
        }

        return result.rows as T[]
      } catch (error) {
        lastError = error as Error
        console.error(`📊 Query attempt ${attempt}/${maxRetries} failed:`, error)

        // Don't retry on syntax errors or other non-transient errors
        if (this.isNonRetryableError(error as Error)) {
          throw error
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 100)
        }
      } finally {
        client.release()
      }
    }

    throw lastError || new Error('Query failed after all retries')
  }

  /**
   * Execute a transaction with automatic retry
   */
  async transaction<T>(
    callback: (client: unknown) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get pool statistics for monitoring
   */
  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    }
  }

  /**
   * Health check for the database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health')
      return result.length > 0 && (result[0] as { health: number }).health === 1
    } catch (error) {
      console.error('📊 Database health check failed:', error)
      return false
    }
  }

  /**
   * Gracefully close all connections
   */
  async close(): Promise<void> {
    await this.pool.end()
    console.log('📊 Database pool closed')
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return (
      message.includes('syntax error') ||
      message.includes('column') && message.includes('does not exist') ||
      message.includes('relation') && message.includes('does not exist') ||
      message.includes('permission denied')
    )
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const db = DatabasePool.getInstance()

// Template literal SQL function that uses the pool
export function sql(template: TemplateStringsArray, ...values: unknown[]) {
  // Build the query string
  let query = template[0]
  for (let i = 0; i < values.length; i++) {
    query += `$${i + 1}${template[i + 1]}`
  }

  // Return a promise that executes the query
  return db.query(query, values)
}

// Export pool directly for advanced usage
export { pool as neonPool }

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('📊 Shutting down database pool...')
  await db.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('📊 Shutting down database pool...')
  await db.close()
  process.exit(0)
})