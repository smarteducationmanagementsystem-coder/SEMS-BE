const express = require("express");
const { requireAuth, requireOwner } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { peopleController } = require("../controllers/people.controller");

function peopleRoutes(service, parseBody) {
  const router = express.Router();
  const controller = peopleController(service);
  router.get("/", requireAuth, controller.list);
  router.post("/", requireAuth, requireOwner, validate(parseBody), controller.create);
  router.put("/:id", requireAuth, requireOwner, validate(parseBody), controller.update);
  router.delete("/:id", requireAuth, requireOwner, controller.remove);
  return router;
}

module.exports = { peopleRoutes };
