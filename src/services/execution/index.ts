import { SimulatedExecutionService } from './simulatedExecutionService'
import type { ExecutionService } from './types'

let service: ExecutionService | null = null

/**
 * The single place execution is obtained from.
 *
 * Every caller goes through this. When the real sandbox lands (§14) it replaces
 * `SimulatedExecutionService` here and no component needs to change — which is
 * the only reason this indirection exists.
 */
export function getExecutionService(): ExecutionService {
  if (!service) {
    service = new SimulatedExecutionService()
  }
  return service
}

/** Test seam: swap the implementation without touching component code. */
export function setExecutionService(next: ExecutionService | null): void {
  service = next
}

export * from './types'
export { SimulatedExecutionService }
