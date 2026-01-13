const express = require("express");
const router = express.Router();
const voucherRuleController = require("../controllers/voucherRule.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/permission.middleware");

// All routes require authentication and admin/employee role
router.use(verifyToken);
router.use(authorize(["admin", "employee"]));

router.get("/", voucherRuleController.getAllRules);
router.post("/", voucherRuleController.createRule);

// Specific routes must come before /:id route
router.post("/:id/toggle", voucherRuleController.toggleActive);

// Generic :id routes
router.get("/:id", voucherRuleController.getRuleById);
router.put("/:id", voucherRuleController.updateRule);
router.delete("/:id", voucherRuleController.deleteRule);

module.exports = router;
