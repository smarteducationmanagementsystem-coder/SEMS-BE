const { asyncHandler } = require("../utils/asyncHandler");

function peopleController(service) {
  return {
    list: asyncHandler(async (req, res) => {
      res.json({ data: await service.list(req.auth) });
    }),
    create: asyncHandler(async (req, res) => {
      res.status(201).json({ data: await service.create(req.auth, req.body) });
    }),
    update: asyncHandler(async (req, res) => {
      res.json({ data: await service.update(req.auth, req.params.id, req.body) });
    }),
    remove: asyncHandler(async (req, res) => {
      await service.remove(req.auth, req.params.id);
      res.json({ ok: true });
    }),
  };
}

module.exports = { peopleController };
