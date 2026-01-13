const { client, indexExists } = require("../elastic/client");
const config = require("../config");
const logger = require("../utils/logger");

class ElasticsearchService {
  constructor() {
    this.indexName = config.elasticsearch.index;
  }

  async indexDocument(doc) {
    try {
      const { _id, ...body } = doc;

      const response = await client.index({
        index: this.indexName,
        id: _id,
        body: body,
      });

      logger.debug("Document indexed", {
        id: _id,
        index: this.indexName,
      });

      return response;
    } catch (error) {
      logger.error("Error indexing document", {
        error: error.message,
        id: doc._id,
      });
      throw error;
    }
  }

  async updateDocument(id, doc) {
    try {
      const response = await client.update({
        index: this.indexName,
        id: id,
        body: {
          doc: doc,
          doc_as_upsert: true,
        },
      });

      logger.debug("Document updated", {
        id: id,
        index: this.indexName,
      });

      return response;
    } catch (error) {
      logger.error("Error updating document", {
        error: error.message,
        id: id,
      });
      throw error;
    }
  }

  async deleteDocument(id) {
    try {
      const response = await client.delete({
        index: this.indexName,
        id: id,
      });

      logger.debug("Document deleted", {
        id: id,
        index: this.indexName,
      });

      return response;
    } catch (error) {
      if (error.statusCode === 404) {
        logger.warn("Document not found for deletion", { id });
        return null;
      }

      logger.error("Error deleting document", {
        error: error.message,
        id: id,
      });
      throw error;
    }
  }

  async bulkIndex(documents) {
    try {
      const body = documents.flatMap((doc) => {
        const { _id, ...document } = doc;
        return [{ index: { _index: this.indexName, _id: _id } }, document];
      });

      const response = await client.bulk({ body: body });

      if (response.errors) {
        const erroredDocuments = [];
        response.items.forEach((action, i) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              document: documents[i],
              error: action[operation].error,
            });
          }
        });

        // Log first few errors in detail
        const firstErrors = erroredDocuments.slice(0, 3);
        firstErrors.forEach((err, idx) => {
          logger.error(`Bulk indexing error ${idx + 1}:`, {
            documentId: err.document?._id || err.document?.id,
            errorType: err.error?.type,
            errorReason: err.error?.reason,
            error: err.error,
          });
        });

        logger.error("Bulk indexing errors", {
          errors: erroredDocuments.length,
          total: documents.length,
          firstError: erroredDocuments[0]?.error,
        });

        throw new Error(
          `Bulk indexing failed for ${
            erroredDocuments.length
          } documents. First error: ${
            erroredDocuments[0]?.error?.reason ||
            erroredDocuments[0]?.error?.type ||
            "Unknown error"
          }`
        );
      }

      logger.info("Bulk indexing completed", {
        indexed: documents.length,
        index: this.indexName,
      });

      return response;
    } catch (error) {
      logger.error("Error in bulk indexing", {
        error: error.message,
        count: documents.length,
      });
      throw error;
    }
  }

  async search(query) {
    try {
      const response = await client.search({
        index: this.indexName,
        ...query,
      });

      return response;
    } catch (error) {
      logger.error("Error performing search", {
        error: error.message,
        query: JSON.stringify(query).substring(0, 200),
      });
      throw error;
    }
  }

  async createIndex(mapping) {
    try {
      const exists = await indexExists(this.indexName);

      if (exists) {
        logger.info("Index already exists", { index: this.indexName });
        return { created: false, message: "Index already exists" };
      }

      const response = await client.indices.create({
        index: this.indexName,
        body: mapping,
      });

      logger.info("Index created", {
        index: this.indexName,
        acknowledged: response.acknowledged,
      });

      return { created: true, response };
    } catch (error) {
      logger.error("Error creating index", {
        error: error.message,
        index: this.indexName,
      });
      throw error;
    }
  }

  async deleteIndex() {
    try {
      const exists = await indexExists(this.indexName);

      if (!exists) {
        logger.info("Index does not exist", { index: this.indexName });
        return { deleted: false, message: "Index does not exist" };
      }

      const response = await client.indices.delete({
        index: this.indexName,
      });

      logger.info("Index deleted", {
        index: this.indexName,
        acknowledged: response.acknowledged,
      });

      return { deleted: true, response };
    } catch (error) {
      logger.error("Error deleting index", {
        error: error.message,
        index: this.indexName,
      });
      throw error;
    }
  }

  async refreshIndex() {
    try {
      await client.indices.refresh({ index: this.indexName });
      logger.debug("Index refreshed", { index: this.indexName });
    } catch (error) {
      logger.error("Error refreshing index", {
        error: error.message,
        index: this.indexName,
      });
      throw error;
    }
  }
}

module.exports = new ElasticsearchService();
