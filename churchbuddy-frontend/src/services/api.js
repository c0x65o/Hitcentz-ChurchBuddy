const API_BASE_URL = 'http://localhost:5001/api';

class ApiService {
  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Songs API
  async getSongs() {
    return this.request('/songs');
  }

  async createSong(song) {
    return this.request('/songs', {
      method: 'POST',
      body: JSON.stringify(song),
    });
  }

  async updateSong(id, song) {
    return this.request(`/songs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(song),
    });
  }

  async deleteSong(id) {
    return this.request(`/songs/${id}`, {
      method: 'DELETE',
    });
  }

  // Sermons API
  async getSermons() {
    return this.request('/sermons');
  }

  async createSermon(sermon) {
    return this.request('/sermons', {
      method: 'POST',
      body: JSON.stringify(sermon),
    });
  }

  async updateSermon(id, sermon) {
    return this.request(`/sermons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sermon),
    });
  }

  async deleteSermon(id) {
    return this.request(`/sermons/${id}`, {
      method: 'DELETE',
    });
  }

  // Slides API
  async getSlides() {
    return this.request('/slides');
  }

  async createSlide(slide) {
    return this.request('/slides', {
      method: 'POST',
      body: JSON.stringify(slide),
    });
  }

  async updateSlide(id, slide) {
    return this.request(`/slides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(slide),
    });
  }

  async deleteSlide(id) {
    return this.request(`/slides/${id}`, {
      method: 'DELETE',
    });
  }

  // Content sync API (for localStorage sync)
  async getContent(storageKey) {
    return this.request(`/content/${storageKey}`);
  }

  async saveContent(contentData) {
    return this.request('/content', {
      method: 'POST',
      body: JSON.stringify(contentData),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService(); 