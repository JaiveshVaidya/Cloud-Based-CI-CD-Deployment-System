import api from './api';

const monitoringService = {
  getLiveMetrics: async () => {
    const response = await api.get('/monitoring/metrics');
    return response.data;
  },

  getKubernetesPods: async (namespace = 'default', projectName = '') => {
    const response = await api.get(`/monitoring/pods?namespace=${namespace}&projectName=${projectName}`);
    return response.data;
  }
};

export default monitoringService;
export { monitoringService };
