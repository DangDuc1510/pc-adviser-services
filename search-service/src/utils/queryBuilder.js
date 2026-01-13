const config = require('../config');

class QueryBuilder {
  constructor() {
    this.defaultSize = config.search.defaultSize;
    this.maxSize = config.search.maxSize;
  }

  buildSearchQuery(params) {
    const {
      q = '',
      page = 1,
      size = this.defaultSize,
      category,
      brand,
      minPrice,
      maxPrice,
      status = 'active',
      sortBy = 'relevance',
      sortOrder = 'desc',
    } = params;

    const from = (page - 1) * size;
    const limit = Math.min(size, this.maxSize);

    const query = {
      from: from,
      size: limit,
      query: {
        bool: {
          must: [],
          filter: [],
          should: [],
        },
      },
      sort: this.buildSort(sortBy, sortOrder),
      aggs: this.buildAggregations(),
    };

    // Text search
    if (q) {
      query.query.bool.must.push({
        multi_match: {
          query: q,
          fields: [
            'name^3', // Boost name field
            'brand^2', // Boost brand field
            'specs^1.5',
            'description',
            'type',
            'category',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
          operator: 'or',
        },
      });

      // Add fuzzy match for typo tolerance
      query.query.bool.should.push({
        match: {
          name: {
            query: q,
            fuzziness: 2,
            boost: 0.5,
          },
        },
      });
    } else {
      // Match all if no query
      query.query.bool.must.push({ match_all: {} });
    }

    // Filters
    if (status) {
      query.query.bool.filter.push({
        term: { status: status },
      });
    }

    if (category) {
      query.query.bool.filter.push({
        term: { category: category },
      });
    }

    if (brand) {
      query.query.bool.filter.push({
        term: { 'brand.keyword': brand },
      });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceRange = {};
      if (minPrice !== undefined) priceRange.gte = minPrice;
      if (maxPrice !== undefined) priceRange.lte = maxPrice;

      query.query.bool.filter.push({
        range: {
          price: priceRange,
        },
      });
    }

    // Filter out-of-stock products
    query.query.bool.filter.push({
      term: {
        'inventory.inStock': true,
      },
    });

    // In-stock boost (for ranking, not filtering)
    query.query.bool.should.push({
      term: {
        'inventory.inStock': {
          value: true,
          boost: 2.0,
        },
      },
    });

    // Popularity boost
    query.query.bool.should.push({
      range: {
        popularity: {
          gt: 0,
          boost: 1.5,
        },
      },
    });

    return query;
  }

  buildSort(sortBy, sortOrder) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    switch (sortBy) {
      case 'price':
        return [{ price: { order: order } }];
      case 'popularity':
        return [{ popularity: { order: order } }];
      case 'rating':
        return [{ rating: { order: order } }];
      case 'name':
        return [{ 'name.keyword': { order: order } }];
      case 'created':
        return [{ createdAt: { order: order } }];
      default:
        // Default: relevance (score)
        return [{ _score: { order: 'desc' } }];
    }
  }

  buildAggregations() {
    return {
      categories: {
        terms: {
          field: 'category',
          size: 20,
        },
      },
      brands: {
        terms: {
          field: 'brand.keyword',
          size: 20,
        },
      },
      price_ranges: {
        range: {
          field: 'price',
          ranges: [
            { to: 1000000 },
            { from: 1000000, to: 5000000 },
            { from: 5000000, to: 10000000 },
            { from: 10000000, to: 20000000 },
            { from: 20000000 },
          ],
        },
      },
      price_stats: {
        stats: {
          field: 'price',
        },
      },
    };
  }

  buildAutocompleteQuery(prefix) {
    return {
      suggest: {
        product_suggest: {
          prefix: prefix,
          completion: {
            field: 'suggest',
            fuzzy: {
              fuzziness: 1,
              min_length: 3,
              prefix_length: 1,
            },
            size: 10,
          },
        },
      },
      _source: ['name', 'brand', 'category', 'price'],
    };
  }
}

module.exports = new QueryBuilder();

