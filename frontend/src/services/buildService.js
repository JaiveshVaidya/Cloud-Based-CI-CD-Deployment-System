import api from './api';

const buildService = {
  triggerBuild: async (projectId, triggerType = 'MANUAL') => {
    const response = await api.post(`/builds/trigger?projectId=${projectId}&triggerType=${triggerType}`);
    return response.data;
  },

  getBuildsForProject: async (projectId) => {
    const response = await api.get(`/builds/project/${projectId}`);
    return response.data;
  },

  getBuildById: async (buildId) => {
    const response = await api.get(`/builds/${buildId}`);
    return response.data;
  },

  getBuildLogs: async (buildId) => {
    const response = await api.get(`/builds/${buildId}/logs`);
    return response.data;
  },

  getBuildStats: async () => {
    const response = await api.get('/builds/stats');
    return response.data;
  }
};

export default buildService;
