// 404 for unknown routes
function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

// One place for all errors, so the response shape is always { message }
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // bad JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  // mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Invalid input' });
  }
  // invalid ObjectId in the URL
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  // duplicate key (for example email already registered)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That value is already in use' });
  }

  // anything else: log details on the server, send a safe message to the client
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
