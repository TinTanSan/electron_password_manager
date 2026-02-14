export type IPCResponse<T> = {
    status: "OK" | "ERROR",
    message?: string,
    response: T
}