class APIResponse{
    constructor(statusCode, message = 'suceess',data) {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export default APIResponse