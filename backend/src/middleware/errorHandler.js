// Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  // Global error handling middleware
  const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
  
    // Handle different types of errors
    if (err.name === 'ValidationError') {
      // Mongoose validation error
      err.statusCode = 400;
      err.message = Object.values(err.errors).map(val => val.message).join(', ');
    } else if (err.code === 11000) {
      // Duplicate key error
      err.statusCode = 400;
      err.message = `Duplicate value for ${Object.keys(err.keyValue)}`;
    } else if (err.name === 'JsonWebTokenError') {
      // JWT error
      err.statusCode = 401;
      err.message = 'Invalid token. Please log in again.';
    }
  
    // Development vs Production error response
    if (process.env.NODE_ENV === 'development') {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack
      });
    } else {
      // Production: don't leak error details
      res.status(err.statusCode).json({
        status: err.status,
        message: err.isOperational ? err.message : 'Something went wrong'
      });
    }
  };
  
  module.exports = { AppError, errorHandler };