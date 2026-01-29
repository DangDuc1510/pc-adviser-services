require("dotenv").config();

const vnpayConfig = {
  vnp_TmnCode: process.env.VNP_TMN_CODE,
  vnp_HashSecret: process.env.VNP_HASH_SECRET,
  vnp_Url: process.env.VNP_URL,
  vnp_Api: process.env.VNP_API,
  vnp_ReturnUrl: process.env.VNP_RETURN_URL,
  vnp_Command: "pay",
  vnp_Version: "2.1.0",
  vnp_CurrCode: "VND",
  vnp_Locale: "vn",
  vnp_OrderType: "other",
};

module.exports = vnpayConfig;
