// Utility to prevent memory leaks and ArrayBuffer allocation errors
export const createSafeSupabaseQuery = (supabase: any) => {
    const MAX_RESULTS = 100
    const QUERY_TIMEOUT = 30000 // 30 seconds

    return {
        select: (table: string, query: string, options: any = {}) => {
            // Add default limit if not specified
            const limit = options.limit || MAX_RESULTS

            // Create base query
            let queryBuilder = supabase.from(table).select(query)

            // Apply filters
            if (options.eq) {
                Object.entries(options.eq).forEach(([key, value]) => {
                    queryBuilder = queryBuilder.eq(key, value)
                })
            }

            if (options.gt) {
                Object.entries(options.gt).forEach(([key, value]) => {
                    queryBuilder = queryBuilder.gt(key, value)
                })
            }

            if (options.gte) {
                Object.entries(options.gte).forEach(([key, value]) => {
                    queryBuilder = queryBuilder.gte(key, value)
                })
            }

            if (options.lt) {
                Object.entries(options.lt).forEach(([key, value]) => {
                    queryBuilder = queryBuilder.lt(key, value)
                })
            }

            if (options.lte) {
                Object.entries(options.lte).forEach(([key, value]) => {
                    queryBuilder = queryBuilder.lte(key, value)
                })
            }

            if (options.order) {
                queryBuilder = queryBuilder.order(options.order.column, { ascending: options.order.ascending })
            }

            // Always add limit unless it's a count query
            if (!options.count) {
                queryBuilder = queryBuilder.limit(limit)
            }

            // Add timeout protection
            return Promise.race([
                queryBuilder,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT)
                )
            ])
        }
    }
}

// Memory usage monitor
export const memoryMonitor = {
    checkUsage: () => {
        if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
            const memory = (window.performance as any).memory
            const usedMB = memory.usedJSHeapSize / 1024 / 1024
            const limitMB = memory.jsHeapSizeLimit / 1024 / 1024

            console.log(`Memory usage: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB`)

            // Warn if using more than 80% of available memory
            if (usedMB / limitMB > 0.8) {
                console.warn('High memory usage detected. Consider optimizing queries.')
                return true
            }
        }
        return false
    },

    forceGC: () => {
        if (typeof window !== 'undefined' && 'gc' in window) {
            try {
                (window as any).gc()
            } catch (e) {
                // Garbage collection not available
            }
        }
    }
}

// Component cleanup helper
export const useCleanupEffect = () => {
    const abortControllers: AbortController[] = []

    const createAbortController = () => {
        const controller = new AbortController()
        abortControllers.push(controller)
        return controller
    }

    const cleanup = () => {
        abortControllers.forEach(controller => controller.abort())
        abortControllers.length = 0
    }

    return { createAbortController, cleanup }
}