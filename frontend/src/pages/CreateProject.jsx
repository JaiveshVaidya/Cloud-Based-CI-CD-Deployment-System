import React, { useState } from 'react';
import projectService from '../services/projectService';
import { Terminal, GitBranch, Shield, Save, ArrowLeft, Loader2, Info } from 'lucide-react';

const CreateProject = ({ navigate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [gitToken, setGitToken] = useState('');
  const [dockerImageName, setDockerImageName] = useState('');
  const [dockerRegistry, setDockerRegistry] = useState('');
  const [k8sNamespace, setK8sNamespace] = useState('default');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const projectData = {
      name,
      description,
      gitRepoUrl,
      branch,
      gitToken: gitToken || null,
      dockerImageName: dockerImageName || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      dockerRegistry: dockerRegistry || 'docker.io',
      k8sNamespace: k8sNamespace || 'default'
    };

    try {
      await projectService.createProject(projectData);
      navigate('#dashboard');
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(
        err.response?.data?.message || 
        'Failed to save project. Ensure repo URL and project name are valid.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto">
      {/* Back Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('#dashboard')}
          className="p-2 bg-dark-card hover:bg-dark-border/40 border border-dark-border/60 rounded-xl text-slate-400 hover:text-white transition-all duration-200"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New CI/CD Project</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Configure git webhook triggers, test builds, and deployments.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 px-4 py-3 rounded-lg text-xs flex items-start space-x-2">
          <Shield size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Config Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl space-y-6">
        
        {/* Section 1: Basic Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-cyan-400/90 tracking-wider flex items-center space-x-2">
            <span className="w-1 h-3.5 bg-cyan-500 rounded-full inline-block"></span>
            <span>1. GENERAL CONFIGURATION</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Project Name *</label>
              <input
                type="text"
                required
                placeholder="frontend-web-app"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0d16]/80 border border-dark-border/60 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Description</label>
              <input
                type="text"
                placeholder="My awesome React user interface app"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0d16]/80 border border-dark-border/60 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Git Repository Info */}
        <div className="space-y-4 pt-4 border-t border-dark-border/40">
          <h2 className="text-sm font-bold text-cyan-400/90 tracking-wider flex items-center space-x-2">
            <span className="w-1 h-3.5 bg-cyan-500 rounded-full inline-block"></span>
            <span>2. GIT REPOSITORY INTEGRATION</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Repository Clone URL *</label>
              <input
                type="url"
                required
                placeholder="https://github.com/myusername/myrepo.git"
                value={gitRepoUrl}
                onChange={(e) => setGitRepoUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0d16]/80 border border-dark-border/60 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                <GitBranch size={12} />
                <span>Target Branch</span>
              </label>
              <input
                type="text"
                required
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0d16]/80 border border-dark-border/60 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500/60 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
              <span>Access Token / Personal OAuth Token</span>
              <span className="text-[10px] text-slate-500 font-normal">(Optional, for private repos)</span>
            </label>
            <input
              type="password"
              placeholder="ghp_••••••••••••••••••••"
              value={gitToken}
              onChange={(e) => setGitToken(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0a0d16]/80 border border-dark-border/60 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-all"
            />
          </div>
          
          <div className="bg-slate-900/30 border border-dark-border/40 rounded-xl p-3 flex items-start space-x-2 text-slate-400 text-xs">
            <Info size={14} className="text-cyan-500 shrink-0 mt-0.5" />
            <span>To simulate a build failure in the demo pipeline, set target branch name to <strong className="text-cyan-400">"fail"</strong>. To trigger the real executor shell process, set branch to <strong className="text-cyan-400">"real"</strong>.</span>
          </div>
        </div>

        {/* Section 3: Docker and K8s Deploy Config */}
        <div className="space-y-4 pt-4 border-t border-dark-border/40">
          <h2 className="text-sm font-bold text-cyan-400/90 tracking-wider flex items-center space-x-2">
            <span className="w-1 h-3.5 bg-cyan-500 rounded-full inline-block"></span>
            <span>3. CONTAINERIZATION & ORCHESTRATION</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Docker Image Name</label>
              <input
                type="text"
                placeholder="my-app"
                value={dockerImageName}
                onChange={(e) => setDockerImageName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0d16]/80 border border-dark-border/60 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">ECR / Docker Registry</label>
              <input
                type="text"
                placeholder="123456789012.dkr.ecr.us-east-1.amazonaws.com"
                value={dockerRegistry}
                onChange={(e) => setDockerRegistry(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0d16]/80 border border-dark-border/60 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">K8s Namespace</label>
              <input
                type="text"
                placeholder="default"
                value={k8sNamespace}
                onChange={(e) => setK8sNamespace(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0d16]/80 border border-dark-border/60 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500/60 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-dark-border/40 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('#dashboard')}
            className="px-5 py-2.5 bg-[#0a0d16] hover:bg-dark-border/30 border border-dark-border/60 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-glow-cyan/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{loading ? 'Creating...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;
