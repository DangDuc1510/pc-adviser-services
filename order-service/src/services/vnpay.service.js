const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
const axios = require("axios");
const vnpayConfig = require("../config/vnpay");
const Order = require("../models/order.model");
const { PAYMENT_STATUS, ORDER_STATUS } = require("../constants");

// Set timezone
process.env.TZ = "Asia/Ho_Chi_Minh";

/**
 * Sort object by keys for VNPay signature
 */
function sortObject(obj) {
  const sorted = {};
  const str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

/**
 * Create payment URL for VNPay
 * @param {Object} params - Payment parameters
 * @param {string} params.orderId - Order ID
 * @param {number} params.amount - Amount in VND
 * @param {string} params.orderInfo - Order description
 * @param {string} params.ipAddr - Client IP address
 * @param {string} params.bankCode - Optional bank code
 * @param {string} params.locale - Locale (vn/en)
 * @returns {string} Payment URL
 */
function createPaymentUrl(params) {
  const {
    orderId,
    amount,
    orderInfo,
    ipAddr,
    bankCode,
    locale = "vn",
  } = params;

  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");
  const txnRef = orderId || moment(date).format("DDHHmmss");

  const vnp_Params = {};
  vnp_Params["vnp_Version"] = vnpayConfig.vnp_Version;
  vnp_Params["vnp_Command"] = vnpayConfig.vnp_Command;
  vnp_Params["vnp_TmnCode"] = vnpayConfig.vnp_TmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = vnpayConfig.vnp_CurrCode;
  vnp_Params["vnp_TxnRef"] = txnRef;
  vnp_Params["vnp_OrderInfo"] = orderInfo || `Thanh toan cho ma GD: ${txnRef}`;
  vnp_Params["vnp_OrderType"] = vnpayConfig.vnp_OrderType;
  vnp_Params["vnp_Amount"] = amount * 100; // VNPay requires amount in cents
  vnp_Params["vnp_ReturnUrl"] = vnpayConfig.vnp_ReturnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;

  if (bankCode && bankCode !== "") {
    vnp_Params["vnp_BankCode"] = bankCode;
  }

  const sortedParams = sortObject(vnp_Params);

  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  sortedParams["vnp_SecureHash"] = signed;

  const paymentUrl =
    vnpayConfig.vnp_Url + "?" + qs.stringify(sortedParams, { encode: false });

  return paymentUrl;
}

/**
 * Verify return URL signature
 * @param {Object} vnp_Params - VNPay return parameters
 * @returns {boolean} True if signature is valid
 */
function verifyReturnUrl(vnp_Params) {
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sortedParams = sortObject(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return secureHash === signed;
}

/**
 * Verify IPN signature
 * @param {Object} vnp_Params - VNPay IPN parameters
 * @returns {boolean} True if signature is valid
 */
function verifyIPN(vnp_Params) {
  return verifyReturnUrl(vnp_Params);
}

/**
 * Handle IPN callback from VNPay
 * @param {Object} vnp_Params - VNPay IPN parameters
 * @returns {Object} Response object
 */
async function handleIPN(vnp_Params) {
  const secureHash = vnp_Params["vnp_SecureHash"];
  const orderId = vnp_Params["vnp_TxnRef"];
  const rspCode = vnp_Params["vnp_ResponseCode"];
  const amount = parseInt(vnp_Params["vnp_Amount"]) / 100;
  const transactionNo = vnp_Params["vnp_TransactionNo"];

  // Verify signature
  if (!verifyIPN(vnp_Params)) {
    return {
      RspCode: "97",
      Message: "Checksum failed",
    };
  }

  // Find order by orderNumber or transactionId
  const order = await Order.findOne({
    $or: [{ orderNumber: orderId }, { "payment.transactionId": orderId }],
  });

  if (!order) {
    return {
      RspCode: "01",
      Message: "Order not found",
    };
  }

  // Check amount
  if (order.pricing.total !== amount) {
    return {
      RspCode: "04",
      Message: "Amount invalid",
    };
  }

  // Check if payment already processed
  if (order.payment.status === PAYMENT_STATUS.PAID) {
    return {
      RspCode: "02",
      Message: "This order has been updated to the payment status",
    };
  }

  // Update order payment status
  if (rspCode === "00") {
    // Payment successful
    order.payment.status = PAYMENT_STATUS.PAID;
    order.payment.transactionId = transactionNo || orderId;
    order.payment.paidAt = new Date();
    // After successful payment, order should be confirmed
    order.status = ORDER_STATUS.CONFIRMED;

    await order.save();

    // Deduct stock from reserved (convert reserve to deduct)
    try {
      const orderService = require("./order.service");
      await orderService.deductStockOnPayment(order._id);
    } catch (deductError) {
      console.error("Error deducting stock after payment in IPN:", deductError);
      // Log error but don't fail the IPN response
    }

    return {
      RspCode: "00",
      Message: "Success",
    };
  } else {
    // Payment failed
    order.payment.status = PAYMENT_STATUS.FAILED;
    order.status = ORDER_STATUS.PAYMENT_FAILED;

    await order.save();

    return {
      RspCode: "00",
      Message: "Success",
    };
  }
}

/**
 * Query transaction from VNPay
 * @param {Object} params - Query parameters
 * @param {string} params.orderId - Order ID
 * @param {string} params.transDate - Transaction date (YYYYMMDDHHmmss)
 * @param {string} params.ipAddr - Client IP address
 * @returns {Promise<Object>} Transaction result
 */
async function queryTransaction(params) {
  const { orderId, transDate, ipAddr } = params;

  const date = new Date();
  const vnp_RequestId = moment(date).format("HHmmss");
  const vnp_Version = vnpayConfig.vnp_Version;
  const vnp_Command = "querydr";
  const vnp_OrderInfo = `Truy van GD ma: ${orderId}`;
  const vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

  const data =
    vnp_RequestId +
    "|" +
    vnp_Version +
    "|" +
    vnp_Command +
    "|" +
    vnpayConfig.vnp_TmnCode +
    "|" +
    orderId +
    "|" +
    transDate +
    "|" +
    vnp_CreateDate +
    "|" +
    ipAddr +
    "|" +
    vnp_OrderInfo;

  const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  const vnp_SecureHash = hmac.update(Buffer.from(data, "utf-8")).digest("hex");

  const dataObj = {
    vnp_RequestId: vnp_RequestId,
    vnp_Version: vnp_Version,
    vnp_Command: vnp_Command,
    vnp_TmnCode: vnpayConfig.vnp_TmnCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_TransactionDate: transDate,
    vnp_CreateDate: vnp_CreateDate,
    vnp_IpAddr: ipAddr,
    vnp_SecureHash: vnp_SecureHash,
  };

  try {
    const response = await axios.post(vnpayConfig.vnp_Api, dataObj, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(`Failed to query transaction: ${error.message}`);
  }
}

/**
 * Refund transaction
 * @param {Object} params - Refund parameters
 * @param {string} params.orderId - Order ID
 * @param {string} params.transDate - Transaction date (YYYYMMDDHHmmss)
 * @param {number} params.amount - Refund amount in VND
 * @param {string} params.transType - Transaction type
 * @param {string} params.user - User who initiated refund
 * @param {string} params.ipAddr - Client IP address
 * @returns {Promise<Object>} Refund result
 */
async function refundTransaction(params) {
  const { orderId, transDate, amount, transType, user, ipAddr } = params;

  const date = new Date();
  const vnp_RequestId = moment(date).format("HHmmss");
  const vnp_Version = vnpayConfig.vnp_Version;
  const vnp_Command = "refund";
  const vnp_OrderInfo = `Hoan tien GD ma: ${orderId}`;
  const vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");
  const vnp_Amount = amount * 100;
  const vnp_TransactionNo = "0";

  const data =
    vnp_RequestId +
    "|" +
    vnp_Version +
    "|" +
    vnp_Command +
    "|" +
    vnpayConfig.vnp_TmnCode +
    "|" +
    transType +
    "|" +
    orderId +
    "|" +
    vnp_Amount +
    "|" +
    vnp_TransactionNo +
    "|" +
    transDate +
    "|" +
    user +
    "|" +
    vnp_CreateDate +
    "|" +
    ipAddr +
    "|" +
    vnp_OrderInfo;

  const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  const vnp_SecureHash = hmac.update(Buffer.from(data, "utf-8")).digest("hex");

  const dataObj = {
    vnp_RequestId: vnp_RequestId,
    vnp_Version: vnp_Version,
    vnp_Command: vnp_Command,
    vnp_TmnCode: vnpayConfig.vnp_TmnCode,
    vnp_TransactionType: transType,
    vnp_TxnRef: orderId,
    vnp_Amount: vnp_Amount,
    vnp_TransactionNo: vnp_TransactionNo,
    vnp_CreateBy: user,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_TransactionDate: transDate,
    vnp_CreateDate: vnp_CreateDate,
    vnp_IpAddr: ipAddr,
    vnp_SecureHash: vnp_SecureHash,
  };

  try {
    const response = await axios.post(vnpayConfig.vnp_Api, dataObj, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(`Failed to refund transaction: ${error.message}`);
  }
}

module.exports = {
  createPaymentUrl,
  verifyReturnUrl,
  verifyIPN,
  handleIPN,
  queryTransaction,
  refundTransaction,
};
