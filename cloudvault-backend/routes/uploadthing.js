const express = require("express");
const { createRouteHandler } = require("uploadthing/express");
const { uploadRouter } = require("../uploadthing-config");

const router = express.Router();

router.use(
  "/uploadthing",
  createRouteHandler({ router: uploadRouter })  // pass a VALID ROUTER here
);

module.exports = router;
