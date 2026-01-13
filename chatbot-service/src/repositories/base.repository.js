const { DatabaseError } = require('../errors');

const createBaseRepository = (model) => {
  const create = async (data) => {
    try {
      const result = await model.create(data);
      return result;
    } catch (error) {
      throw new DatabaseError(`Error creating ${model.modelName}: ${error.message}`);
    }
  };

  const findById = async (id, options = {}) => {
    try {
      const { select, populate } = options;
      let query = model.findById(id);
      
      if (select) query = query.select(select);
      if (populate) query = query.populate(populate);
      
      return await query.exec();
    } catch (error) {
      throw new DatabaseError(`Error finding ${model.modelName} by id: ${error.message}`);
    }
  };

  const findOne = async (filter, options = {}) => {
    try {
      const { select, populate } = options;
      let query = model.findOne(filter);
      
      if (select) query = query.select(select);
      if (populate) query = query.populate(populate);
      
      return await query.exec();
    } catch (error) {
      throw new DatabaseError(`Error finding ${model.modelName}: ${error.message}`);
    }
  };

  const find = async (filter = {}, options = {}) => {
    try {
      const { select, populate, sort, skip, limit } = options;
      let query = model.find(filter);
      
      if (select) query = query.select(select);
      if (populate) query = query.populate(populate);
      if (sort) query = query.sort(sort);
      if (skip) query = query.skip(skip);
      if (limit) query = query.limit(limit);
      
      return await query.exec();
    } catch (error) {
      throw new DatabaseError(`Error finding ${model.modelName}s: ${error.message}`);
    }
  };

  const updateById = async (id, updateData, options = { new: true, runValidators: true }) => {
    try {
      return await model.findByIdAndUpdate(id, updateData, options);
    } catch (error) {
      throw new DatabaseError(`Error updating ${model.modelName}: ${error.message}`);
    }
  };

  const deleteById = async (id) => {
    try {
      return await model.findByIdAndDelete(id);
    } catch (error) {
      throw new DatabaseError(`Error deleting ${model.modelName}: ${error.message}`);
    }
  };

  const count = async (filter = {}) => {
    try {
      return await model.countDocuments(filter);
    } catch (error) {
      throw new DatabaseError(`Error counting ${model.modelName}s: ${error.message}`);
    }
  };

  const exists = async (filter) => {
    try {
      return await model.exists(filter);
    } catch (error) {
      throw new DatabaseError(`Error checking ${model.modelName} existence: ${error.message}`);
    }
  };

  return {
    create,
    findById,
    findOne,
    find,
    updateById,
    deleteById,
    count,
    exists
  };
};

module.exports = createBaseRepository;

