export function isInteger(source: any) {
    return typeof source === 'number' && Math.floor(source) === source
}

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function enumKeys<T extends string>(data: Record<T, string | number>) {
    return Object.values(data).filter(value => typeof value === 'string') as T[]
}

export function assertProperty<O, K extends keyof O & string>(config: O, key: K) {
    if (!config[key]) throw new Error(`missing configuration "${key}"`)
    return config[key]
}

export function coerce(val: any) {
    const { stack } = val instanceof Error ? val : new Error(val as any)
    return stack
}

export function renameProperty<O extends object, K extends keyof O, T extends string>(config: O, key: K, oldKey: T) {
    config[key] = Reflect.get(config, oldKey)
    Reflect.deleteProperty(config, oldKey)
}