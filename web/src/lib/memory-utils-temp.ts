// Temporary fix for missing dependencies until they can be properly installed
export const memoryMonitor = {
    checkUsage: () => false,
    forceGC: () => { }
}

export const createSafeSupabaseQuery = () => ({
    select: () => Promise.resolve({ data: [], error: null })
})