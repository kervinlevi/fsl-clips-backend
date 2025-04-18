module.exports = async function (req, res, proceed) {
  const logError = (originalFn, type) => {
    return function (...args) {
      sails.log.error(`[${type}] ${req.method} ${req.url}`, args[0]);
      return originalFn.apply(this, args);
    };
  };

  res.badRequest = logError(res.badRequest, "400 Bad Request");
  res.serverError = logError(res.serverError, "500 Server Error");
  res.forbidden = logError(res.forbidden, "403 Forbidden");
  res.notFound = logError(res.notFound, "404 Not Found");
  res.unauthorized = logError(res.unauthorized, "401 Unauthorized");

  return proceed();
};
