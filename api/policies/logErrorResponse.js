module.exports = async function (req, res, proceed) {
  const logError = (originalFn, label) => {
    return function (data) {
      sails.log.error(`[${label}] ${req.method} ${req.url}`, data);

      if (typeof originalFn !== 'function') {
        return;
      }
      return originalFn.call(this, data);
    };
  };

  res.badRequest = logError(res.badRequest, "400 Bad Request");
  res.serverError = logError(res.serverError, "500 Server Error");
  res.forbidden = logError(res.forbidden, "403 Forbidden");
  res.notFound = logError(res.notFound, "404 Not Found");
  res.unauthorized = logError(res.unauthorized, "401 Unauthorized");

  return proceed();
};
