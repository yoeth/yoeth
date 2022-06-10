/**
 * random operations
 */
 export class Random {
    constructor(private value = Math.random()) {}
  
    bool(probability: number) {
      if (probability >= 1) return true
      if (probability <= 0) return false
      return this.value < probability
    }
  
    /**
     * random real
     * @param start start number
     * @param end end number
     * @returns a random real in the interval [start, end)
     */
    real(end: number): number
    real(start: number, end: number): number
    real(...args: [number, number?]): number {
      const start = args.length > 1 ? args[0] : 0
      const end = args[args.length - 1]
      return this.value * (end! - start) + start
    }
  
    pick<T>(source: readonly T[]) {
      return source[Math.floor(this.value * source.length)]
    }
  
    splice<T>(source: T[]) {
      return source.splice(Math.floor(this.value * source.length), 1)[0]
    }
  }
  
  export namespace Random {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  
    export function id(length = 8, radix = 16) {
      let result = ''
      for (let i = 0; i < length; ++i) {
        result += chars[Math.floor(Math.random() * radix)]
      }
      return result
    }
  
    export function pick<T>(source: readonly T[]) {
      return new Random().pick(source)
    }
  
    export function shuffle<T>(source: readonly T[]) {
      const clone = source.slice()
      const result: T[] = []
      for (let i = source.length; i > 0; --i) {
        result.push(new Random().splice(clone))
      }
      return result
    }
  
    export function multiPick<T>(source: T[], count: number) {
      source = source.slice()
      const result: T[] = []
      const length = Math.min(source.length, count)
      for (let i = 0; i < length; i += 1) {
        const index = Math.floor(Math.random() * source.length)
        const [item] = source.splice(index, 1)
        result.push(item)
      }
      return result
    }
  
    export function bool(probability: number) {
      return new Random().bool(probability)
    }
  }