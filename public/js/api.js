/**
 * VillageKeep API Client
 */

const API_BASE = '/api/v1';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        data?.error || data?.message || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error
    throw new ApiError('Network error. Please check your connection.', 0);
  }
}

// API methods
const api = {
  // Access check
  async checkAccess(resourceType, resourceId) {
    return request(`/access/check?type=${resourceType}&id=${resourceId}`);
  },

  // Organizations
  async getOrg() {
    return request('/org');
  },

  async updateOrg(data) {
    return request('/org', { method: 'PUT', body: data });
  },

  // Members
  async getMembers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/members${query ? '?' + query : ''}`);
  },

  async getMember(id) {
    return request(`/members/${id}`);
  },

  async createMember(data) {
    return request('/members', { method: 'POST', body: data });
  },

  async updateMember(id, data) {
    return request(`/members/${id}`, { method: 'PUT', body: data });
  },

  async deleteMember(id) {
    return request(`/members/${id}`, { method: 'DELETE' });
  },

  // Tiers
  async getTiers() {
    return request('/tiers');
  },

  async createTier(data) {
    return request('/tiers', { method: 'POST', body: data });
  },

  async updateTier(id, data) {
    return request(`/tiers/${id}`, { method: 'PUT', body: data });
  },

  async deleteTier(id) {
    return request(`/tiers/${id}`, { method: 'DELETE' });
  },

  // Donations
  async getDonations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/donations${query ? '?' + query : ''}`);
  },

  async createDonation(data) {
    return request('/donations', { method: 'POST', body: data });
  },

  // Campaigns
  async getCampaigns() {
    return request('/campaigns');
  },

  async createCampaign(data) {
    return request('/campaigns', { method: 'POST', body: data });
  },

  // CEU
  async getCEUCredits(memberId) {
    return request(`/members/${memberId}/ceu`);
  },

  async addCEUCredit(memberId, data) {
    return request(`/members/${memberId}/ceu`, { method: 'POST', body: data });
  }
};

// Export
window.api = api;
window.ApiError = ApiError;
