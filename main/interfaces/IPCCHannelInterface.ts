export type IPCResponse<T> = {
    status: "OK" | "CLIENT_ERROR" | "INTERNAL_ERROR",
    message?: string,
    response: T
}