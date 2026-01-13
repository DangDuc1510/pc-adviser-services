const { ValidationError } = require('../errors');

// Generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
};

// Validate brand name
const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Tên thương hiệu là bắt buộc');
  }
  
  const trimmedName = name.trim();
  if (trimmedName.length < 1) {
    throw new ValidationError('Tên thương hiệu không được để trống');
  }
  
  if (trimmedName.length > 100) {
    throw new ValidationError('Tên thương hiệu không được vượt quá 100 ký tự');
  }
  
  return trimmedName;
};

// Validate slug
const validateSlug = (slug, name) => {
  if (slug && typeof slug === 'string') {
    const trimmedSlug = slug.trim();
    if (trimmedSlug.length > 0) {
      return generateSlug(trimmedSlug);
    }
  }
  
  return generateSlug(name);
};

// Validate description
const validateDescription = (description) => {
  if (!description) {
    return undefined;
  }
  
  if (typeof description !== 'string') {
    throw new ValidationError('Mô tả thương hiệu phải là chuỗi văn bản');
  }
  
  const trimmedDescription = description.trim();
  if (trimmedDescription.length > 2000) {
    throw new ValidationError('Mô tả thương hiệu không được vượt quá 2000 ký tự');
  }
  
  return trimmedDescription;
};

// Validate logo URL
const validateLogo = (logo) => {
  if (!logo) {
    return undefined;
  }
  
  if (typeof logo !== 'string') {
    throw new ValidationError('Logo phải là URL hợp lệ');
  }
  
  const trimmedLogo = logo.trim();
  
  // Basic URL validation
  try {
    new URL(trimmedLogo);
    return trimmedLogo;
  } catch (error) {
    throw new ValidationError('Logo phải là URL hợp lệ');
  }
};

// Validate country
const validateCountry = (country) => {
  if (!country) {
    return undefined;
  }
  
  if (typeof country !== 'string') {
    throw new ValidationError('Quốc gia phải là chuỗi');
  }
  
  const trimmedCountry = country.trim();
  if (trimmedCountry.length > 100) {
    throw new ValidationError('Tên quốc gia không được vượt quá 100 ký tự');
  }
  
  return trimmedCountry;
};

// Validate SEO meta fields
const validateMetaTitle = (metaTitle, name) => {
  if (!metaTitle) {
    return name;
  }
  
  if (typeof metaTitle !== 'string') {
    throw new ValidationError('Meta title phải là chuỗi');
  }
  
  const trimmed = metaTitle.trim();
  if (trimmed.length > 60) {
    throw new ValidationError('Meta title không được vượt quá 60 ký tự');
  }
  
  return trimmed;
};

const validateMetaDescription = (metaDescription) => {
  if (!metaDescription) {
    return undefined;
  }
  
  if (typeof metaDescription !== 'string') {
    throw new ValidationError('Meta description phải là chuỗi');
  }
  
  const trimmed = metaDescription.trim();
  if (trimmed.length > 160) {
    throw new ValidationError('Meta description không được vượt quá 160 ký tự');
  }
  
  return trimmed;
};

const validateMetaKeywords = (metaKeywords) => {
  if (!metaKeywords) {
    return undefined;
  }
  
  if (!Array.isArray(metaKeywords)) {
    throw new ValidationError('Meta keywords phải là một mảng');
  }
  
  const validKeywords = metaKeywords
    .filter(keyword => keyword && typeof keyword === 'string')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0);
  
  return validKeywords.length > 0 ? validKeywords : undefined;
};

// Validate create brand data
const validateCreateBrandData = (data) => {
  const validatedData = {
    name: validateName(data.name),
    description: validateDescription(data.description),
    logo: validateLogo(data.logo),
    country: validateCountry(data.country),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    metaTitle: validateMetaTitle(data.metaTitle, validateName(data.name)),
    metaDescription: validateMetaDescription(data.metaDescription),
    metaKeywords: validateMetaKeywords(data.metaKeywords)
  };
  
  // Generate slug
  validatedData.slug = validateSlug(data.slug, validatedData.name);
  
  return validatedData;
};

// Validate update brand data
const validateUpdateBrandData = (data) => {
  const validatedData = {};
  
  if (data.name !== undefined) {
    validatedData.name = validateName(data.name);
    // Update slug if name changes
    validatedData.slug = validateSlug(data.slug, validatedData.name);
    // Update meta title if not explicitly provided
    if (!data.metaTitle) {
      validatedData.metaTitle = validateMetaTitle(data.metaTitle, validatedData.name);
    }
  }
  
  if (data.slug !== undefined && !validatedData.slug) {
    validatedData.slug = validateSlug(data.slug, data.name || 'brand');
  }
  
  if (data.description !== undefined) {
    validatedData.description = validateDescription(data.description);
  }
  
  if (data.logo !== undefined) {
    validatedData.logo = validateLogo(data.logo);
  }
  
  if (data.country !== undefined) {
    validatedData.country = validateCountry(data.country);
  }
  
  if (data.isActive !== undefined) {
    validatedData.isActive = Boolean(data.isActive);
  }
  
  if (data.metaTitle !== undefined) {
    validatedData.metaTitle = validateMetaTitle(data.metaTitle, data.name);
  }
  
  if (data.metaDescription !== undefined) {
    validatedData.metaDescription = validateMetaDescription(data.metaDescription);
  }
  
  if (data.metaKeywords !== undefined) {
    validatedData.metaKeywords = validateMetaKeywords(data.metaKeywords);
  }
  
  return validatedData;
};

// Validate pagination parameters
const validatePaginationParams = (query) => {
  const { page = 1, limit = 20 } = query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  if (isNaN(pageNum) || pageNum < 1) {
    throw new ValidationError('Trang phải là số nguyên dương');
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
    throw new ValidationError('Giới hạn phải từ 1 đến 1000');
  }
  
  return {
    page: pageNum,
    limit: limitNum
  };
};

// Validate search parameters
const validateSearchParams = (query) => {
  const { search, country, isActive } = query;
  const filter = {};
  
  if (search && typeof search === 'string') {
    const searchTerm = search.trim();
    if (searchTerm.length > 0) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }
  }
  
  if (country && typeof country === 'string') {
    const countryTerm = country.trim();
    if (countryTerm.length > 0) {
      filter.country = { $regex: countryTerm, $options: 'i' };
    }
  }
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  return filter;
};

module.exports = {
  validateName,
  validateSlug,
  validateDescription,
  validateLogo,
  validateCountry,
  validateMetaTitle,
  validateMetaDescription,
  validateMetaKeywords,
  validateCreateBrandData,
  validateUpdateBrandData,
  validatePaginationParams,
  validateSearchParams,
  generateSlug
};
