const voucherTriggerService = require("../services/voucherTrigger.service");
const { ValidationError } = require("../errors");

/**
 * Handle trigger from external service
 * POST /voucher-triggers/trigger
 * Body: { type, jwtSecret, userId }
 */
const handleTrigger = async (req, res, next) => {
  try {
    const { type, jwtSecret, userId } = req.body;

    if (!type) {
      throw new ValidationError("type là bắt buộc");
    }

    if (!jwtSecret) {
      throw new ValidationError("jwtSecret là bắt buộc");
    }

    if (!userId) {
      throw new ValidationError("userId là bắt buộc");
    }

    const result = await voucherTriggerService.handleTrigger(
      type,
      jwtSecret,
      userId
    );

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleTrigger,
};
