const { ValidationError } = require("../errors");
const { USER_ROLES, GENDERS, VALIDATION } = require("../constants");

// Validate email format
const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    throw new ValidationError("Email là bắt buộc");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Email không hợp lệ");
  }

  return email.toLowerCase().trim();
};

// Validate password
const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    throw new ValidationError("Mật khẩu là bắt buộc");
  }

  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    throw new ValidationError(
      `Mật khẩu phải có ít nhất ${VALIDATION.MIN_PASSWORD_LENGTH} ký tự`
    );
  }

  if (password.length > VALIDATION.MAX_PASSWORD_LENGTH) {
    throw new ValidationError(
      `Mật khẩu không được vượt quá ${VALIDATION.MAX_PASSWORD_LENGTH} ký tự`
    );
  }

  return password;
};

// Validate userName
const validateUserName = (userName) => {
  if (!userName || typeof userName !== "string") {
    throw new ValidationError("Tên là bắt buộc");
  }

  const trimmedUserName = userName.trim();
  if (trimmedUserName.length === 0) {
    throw new ValidationError("Tên không được để trống");
  }

  if (trimmedUserName.length > VALIDATION.MAX_NAME_LENGTH) {
    throw new ValidationError(
      `Tên không được vượt quá ${VALIDATION.MAX_NAME_LENGTH} ký tự`
    );
  }

  return trimmedUserName;
};

// Validate userName (for login/registration)
const validateUserNameForAuth = (userName) => {
  if (!userName || typeof userName !== "string") {
    throw new ValidationError("Tên đăng nhập là bắt buộc");
  }

  const trimmedUserName = userName.trim();
  if (trimmedUserName.length < VALIDATION.MIN_USERNAME_LENGTH) {
    throw new ValidationError(
      `Tên đăng nhập phải có ít nhất ${
        VALIDATION.MIN_USERNAME_LENGTH || 3
      } ký tự`
    );
  }

  if (trimmedUserName.length > VALIDATION.MAX_USERNAME_LENGTH) {
    throw new ValidationError(
      `Tên đăng nhập không được vượt quá ${
        VALIDATION.MAX_USERNAME_LENGTH || 100
      } ký tự`
    );
  }

  return trimmedUserName;
};

// Validate role
const validateRole = (role) => {
  if (!role) {
    return USER_ROLES.CUSTOMER; // Default role
  }

  const validRoles = Object.values(USER_ROLES);
  if (!validRoles.includes(role)) {
    throw new ValidationError(
      `Vai trò phải là một trong: ${validRoles.join(", ")}`
    );
  }

  return role;
};

// Validate gender
const validateGender = (gender) => {
  if (!gender) {
    return undefined; // Gender is optional
  }

  const validGenders = Object.values(GENDERS);
  if (!validGenders.includes(gender)) {
    throw new ValidationError(
      `Giới tính phải là một trong: ${validGenders.join(", ")}`
    );
  }

  return gender;
};

// Validate phone
const validatePhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    throw new ValidationError("Số điện thoại là bắt buộc");
  }

  const trimmedPhone = phone.trim();
  if (trimmedPhone.length === 0) {
    throw new ValidationError("Số điện thoại không được để trống");
  }

  if (trimmedPhone.length > VALIDATION.MAX_PHONE_LENGTH) {
    throw new ValidationError(
      `Số điện thoại không được vượt quá ${VALIDATION.MAX_PHONE_LENGTH} ký tự`
    );
  }

  // Basic phone validation (can be enhanced)
  const phoneRegex = /^[+]?[\d\s-()]+$/;
  if (!phoneRegex.test(trimmedPhone)) {
    throw new ValidationError("Số điện thoại không hợp lệ");
  }

  return trimmedPhone;
};

// Validate date of birth
const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) {
    return undefined; // Date of birth is optional
  }

  const date = new Date(dateOfBirth);
  if (isNaN(date.getTime())) {
    throw new ValidationError("Ngày sinh không hợp lệ");
  }

  const now = new Date();
  if (date > now) {
    throw new ValidationError("Ngày sinh không thể là tương lai");
  }

  // Check if age is reasonable (e.g., not more than 120 years old)
  const age = now.getFullYear() - date.getFullYear();
  if (age > 120) {
    throw new ValidationError("Ngày sinh không hợp lệ");
  }

  return date;
};

// Validate address
const validateAddress = (address) => {
  if (!address) {
    return undefined; // Address is optional
  }

  if (typeof address !== "string") {
    throw new ValidationError("Địa chỉ phải là một chuỗi văn bản");
  }

  const trimmedAddress = address.trim();

  if (trimmedAddress.length === 0) {
    return undefined;
  }

  if (trimmedAddress.length > 500) {
    throw new ValidationError("Địa chỉ quá dài (tối đa 500 ký tự)");
  }

  return trimmedAddress;
};

// Validate registration data
const validateRegistrationData = (data) => {
  const { email, password, userName, phone } = data;

  return {
    email: validateEmail(email),
    password: validatePassword(password),
    userName: validateUserNameForAuth(userName),
    phone: validatePhone(phone),
  };
};

// Validate admin create user data (includes role, isActive, etc.)
const validateAdminCreateUserData = (data) => {
  const {
    email,
    password,
    userName,
    phone,
    role,
    isActive,
    gender,
    dateOfBirth,
    address,
  } = data;

  const validatedData = {
    email: validateEmail(email),
    password: validatePassword(password),
    userName: validateUserNameForAuth(userName),
    phone: validatePhone(phone),
    role: validateRole(role),
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  };

  // Optional fields
  if (gender !== undefined) {
    validatedData.gender = validateGender(gender);
  }

  if (dateOfBirth !== undefined) {
    validatedData.dateOfBirth = validateDateOfBirth(dateOfBirth);
  }

  if (address !== undefined) {
    validatedData.address = validateAddress(address);
  }

  return validatedData;
};

// Validate login data - accepts email or userName
const validateLoginData = (data) => {
  const { emailOrUsername, password } = data;

  if (!emailOrUsername) {
    throw new ValidationError("Email hoặc tên đăng nhập là bắt buộc");
  }

  if (!password) {
    throw new ValidationError("Mật khẩu là bắt buộc");
  }

  // Check if input is email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = emailRegex.test(emailOrUsername);

  return {
    emailOrUsername: isEmail
      ? emailOrUsername.toLowerCase().trim()
      : emailOrUsername.trim(),
    isEmail,
    password: password, // Don't validate password format on login
  };
};

// Validate update profile data
const validateUpdateProfileData = (data) => {
  const validatedData = {};

  if (data.userName !== undefined) {
    validatedData.userName = validateUserName(data.userName);
  }

  if (data.gender !== undefined) {
    validatedData.gender = validateGender(data.gender);
  }

  if (data.phone !== undefined) {
    validatedData.phone = validatePhone(data.phone);
  }

  if (data.dateOfBirth !== undefined) {
    validatedData.dateOfBirth = validateDateOfBirth(data.dateOfBirth);
  }

  if (data.address !== undefined) {
    validatedData.address = validateAddress(data.address);
  }

  if (data.avatar !== undefined && typeof data.avatar === "string") {
    validatedData.avatar = data.avatar.trim();
  }

  return validatedData;
};

// Validate change password data
const validateChangePasswordData = (data) => {
  const { currentPassword, newPassword } = data;

  if (!currentPassword) {
    throw new ValidationError("Mật khẩu hiện tại là bắt buộc");
  }

  return {
    currentPassword,
    newPassword: validatePassword(newPassword),
  };
};

// Validate pagination parameters
const validatePaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 100); // Max 100 items per page

  if (page < 1) {
    throw new ValidationError("Số trang phải lớn hơn 0");
  }

  if (limit < 1) {
    throw new ValidationError("Số lượng mỗi trang phải lớn hơn 0");
  }

  return { page, limit };
};

// Validate search and filter parameters
const validateSearchParams = (query) => {
  const { search, role, isActive } = query;
  const filter = {};

  if (search && typeof search === "string") {
    const searchTerm = search.trim();
    if (searchTerm.length > 0) {
      filter.$or = [
        { userName: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ];
    }
  }

  if (role && Object.values(USER_ROLES).includes(role)) {
    filter.role = role;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  return filter;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUserName,
  validateUserNameForAuth,
  validateRole,
  validateGender,
  validatePhone,
  validateDateOfBirth,
  validateAddress,
  validateRegistrationData,
  validateAdminCreateUserData,
  validateLoginData,
  validateUpdateProfileData,
  validateChangePasswordData,
  validatePaginationParams,
  validateSearchParams,
};
