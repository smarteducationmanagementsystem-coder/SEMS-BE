function validate(parse) {
  return (req, res, next) => {
    try {
      req.body = parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { validate };
