const authService = require('../services/auth.service');
const { errorHandler } = require('../errors');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.cmsLogin = async (req, res, next) => {
  try {
    const result = await authService.cmsLogin(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await authService.logout(token);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    const result = await authService.resetPassword(resetToken, newPassword);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await authService.refreshToken(token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await authService.createUser(req.body, req.user);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await authService.changePassword(req.user.id, req.body, token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}; 