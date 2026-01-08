/**
 * Error handling middleware
 */

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // Default error
    let status = err.status || err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let details = err.details || null;

    // MySQL errors
    if (err.code === 'ER_DUP_ENTRY') {
        status = 409;
        message = 'Duplicate entry';
        details = 'A record with this information already exists';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        status = 400;
        message = 'Invalid reference';
        details = 'Referenced record does not exist';
    } else if (err.code === 'ECONNREFUSED') {
        status = 503;
        message = 'Database connection failed';
        details = 'Unable to connect to database';
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        status = 400;
        message = 'Validation Error';
        details = err.message;
    }

    // JSON parse errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        status = 400;
        message = 'Invalid JSON';
        details = 'Request body contains invalid JSON';
    }

    const errorResponse = {
        error: {
            message,
            status,
            ...(details && { details }),
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    };

    res.status(status).json(errorResponse);
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
    res.status(404).json({
        error: {
            message: 'Not Found',
            status: 404,
            path: req.originalUrl
        }
    });
}

/**
 * Async error wrapper - wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler
};

