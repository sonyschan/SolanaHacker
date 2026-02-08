/**
 * Colosseum API Client
 * Handles hackathon project management
 */

const COLOSSEUM_API = 'https://agents.colosseum.com/api';

export class ColosseumAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Make authenticated request
   */
  async request(endpoint, options = {}) {
    const url = `${COLOSSEUM_API}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Colosseum API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get agent status
   */
  async getStatus() {
    return this.request('/agents/status');
  }

  /**
   * Get active hackathon info
   */
  async getActiveHackathon() {
    const response = await fetch(`${COLOSSEUM_API}/hackathons/active`);
    if (!response.ok) {
      throw new Error('Failed to get active hackathon');
    }
    return response.json();
  }

  /**
   * Create a new project (draft)
   */
  async createProject(projectData) {
    return this.request('/my-project', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  /**
   * Update project
   */
  async updateProject(projectData) {
    return this.request('/my-project', {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  /**
   * Get my project
   */
  async getMyProject() {
    return this.request('/my-project');
  }

  /**
   * Submit project (locks it)
   */
  async submitProject() {
    return this.request('/my-project/submit', {
      method: 'POST',
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard() {
    const response = await fetch(`${COLOSSEUM_API}/leaderboard`);
    if (!response.ok) {
      throw new Error('Failed to get leaderboard');
    }
    return response.json();
  }

  /**
   * Get all projects
   */
  async getProjects() {
    const response = await fetch(`${COLOSSEUM_API}/projects`);
    if (!response.ok) {
      throw new Error('Failed to get projects');
    }
    return response.json();
  }

  /**
   * Check heartbeat for updates
   */
  async checkHeartbeat() {
    try {
      const response = await fetch('https://colosseum.com/heartbeat.md');
      if (response.ok) {
        return response.text();
      }
    } catch {
      console.log('[Colosseum] Heartbeat check failed');
    }
    return null;
  }

  /**
   * Create forum post
   */
  async createForumPost(title, content, tags = []) {
    return this.request('/forum/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content, tags }),
    });
  }

  /**
   * Get forum posts
   */
  async getForumPosts() {
    const response = await fetch(`${COLOSSEUM_API}/forum/posts`);
    if (!response.ok) {
      throw new Error('Failed to get forum posts');
    }
    return response.json();
  }
}
