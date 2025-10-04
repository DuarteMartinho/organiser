import { useRef, useCallback } from 'react'

// Custom hook to debounce function calls and prevent excessive API requests
export const useDebounce = (func: Function, delay: number) => {
    const timeoutRef = useRef<NodeJS.Timeout>()

    return useCallback((...args: any[]) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            func(...args)
        }, delay)
    }, [func, delay])
}

// Hook to prevent rapid successive API calls
export const useApiThrottle = (delay: number = 1000) => {
    const lastCallRef = useRef<number>(0)

    return useCallback(async (apiCall: () => Promise<any>) => {
        const now = Date.now()
        const timeSinceLastCall = now - lastCallRef.current

        if (timeSinceLastCall < delay) {
            console.log('API call throttled, waiting...')
            await new Promise(resolve => setTimeout(resolve, delay - timeSinceLastCall))
        }

        lastCallRef.current = Date.now()
        return apiCall()
    }, [delay])
}

// Hook to manage component cleanup
export const useComponentCleanup = () => {
    const cleanupFunctionsRef = useRef<(() => void)[]>([])

    const addCleanup = useCallback((cleanupFn: () => void) => {
        cleanupFunctionsRef.current.push(cleanupFn)
    }, [])

    const cleanup = useCallback(() => {
        cleanupFunctionsRef.current.forEach(fn => {
            try {
                fn()
            } catch (error) {
                console.error('Cleanup error:', error)
            }
        })
        cleanupFunctionsRef.current = []
    }, [])

    return { addCleanup, cleanup }
}