require("dotenv").config();

const vnpayConfig = {
  vnp_TmnCode: process.env.VNP_TMN_CODE || "FTBW7SJ9",
  vnp_HashSecret:
    process.env.VNP_HASH_SECRET || "LSEF047PHY43X3I6B1UVA72MNKVYD00C",
  vnp_Url:
    process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_Api:
    process.env.VNP_API ||
    "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  vnp_ReturnUrl:
    process.env.VNP_RETURN_URL || "http://localhost:3003/payment/vnpay/return",
  vnp_Command: "pay",
  vnp_Version: "2.1.0",
  vnp_CurrCode: "VND",
  vnp_Locale: "vn",
  vnp_OrderType: "other",
};

module.exports = vnpayConfig;
