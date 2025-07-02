function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.details || err.message;
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'File Upload Error';
    details = err.message;
  } else if (err.code === 'ENOENT') {
    statusCode = 404;
    message = 'File Not Found';
    details = err.message;
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File Too Large';
    details = 'The uploaded file exceeds the maximum allowed size';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected File';
    details = 'An unexpected file was uploaded';
  } else if (err.message && err.message.includes('SQLITE_CONSTRAINT')) {
    statusCode = 409;
    message = 'Conflict';
    details = 'A resource with this identifier already exists';
  } else if (err.message && err.message.includes('SQLITE_NOTFOUND')) {
    statusCode = 404;
    message = 'Not Found';
    details = 'The requested resource was not found';
  }

  // In development, include stack trace
  const response = {
    error: message,
    message: details || err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
}

module.exports = {
  errorHandler
}; 