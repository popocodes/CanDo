class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// route(method, path, handler): returns the handler's value as JSON and turns errors into {error}.
const makeRoute = (app, prefix, ...guards) => (method, url, handler) => {
  app[method](prefix + url, ...guards, async (req, res) => {
    try {
      req.body ||= {};
      const out = await handler(req);
      res.json(out === undefined ? { success: true } : out);
    } catch (err) {
      if (!err.status) console.error(err);
      res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong on the server' });
    }
  });
};

module.exports = { HttpError, makeRoute };
