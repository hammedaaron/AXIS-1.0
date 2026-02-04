
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Role, Project } from '../types';
import { Plus, X, ExternalLink, Tag, DollarSign, Layout, ChevronRight, Briefcase } from 'lucide-react';

const Campaigns: React.FC = () => {
  const { projects, addProject } = useData();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ title: '', link: '', price: '', niche: '', description: '' });

  const isAdmin = user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMIN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProject(formData);
    setFormData({ title: '', link: '', price: '', niche: '', description: '' });
    setIsAdding(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Campaign Grid</h1>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-wider">{projects.length} Active Vectors</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20"
          >
            <Plus className="w-4 h-4" /> Initialize Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div 
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-violet-500/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:bg-violet-600/10 group-hover:border-violet-500/50 transition-all">
                <Briefcase className="w-6 h-6 text-zinc-500 group-hover:text-violet-500" />
              </div>
              <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
                {project.price}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">{project.title}</h3>
            
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-400 font-medium">{project.niche}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[10px] text-zinc-600 font-mono uppercase">Details</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Overlay */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedProject(null)} />
           <div className="relative w-full max-w-2xl bg-[#09090b] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-zinc-800 bg-zinc-900/20">
                 <button onClick={() => setSelectedProject(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X /></button>
                 <div className="text-[10px] font-bold text-violet-500 uppercase tracking-[0.3em] mb-4">Project Overview</div>
                 <h2 className="text-4xl font-black text-white leading-tight mb-2 tracking-tighter">{selectedProject.title}</h2>
                 <div className="flex items-center gap-6 mt-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
                       <DollarSign className="w-4 h-4 text-violet-500" />
                       <span className="text-lg font-bold text-white">{selectedProject.price}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
                       <Tag className="w-4 h-4 text-zinc-500" />
                       <span className="text-sm font-bold text-zinc-400">{selectedProject.niche}</span>
                    </div>
                 </div>
              </div>
              <div className="p-8 space-y-6">
                 <div className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap font-light max-h-96 overflow-y-auto pr-4">
                    {selectedProject.description}
                 </div>
                 <div className="pt-6 border-t border-zinc-800 flex gap-4">
                    <a 
                      href={selectedProject.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 py-4 bg-violet-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-violet-500 transition-all text-center flex items-center justify-center gap-2"
                    >
                      Apply Now <ChevronRight className="w-4 h-4" />
                    </a>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Form Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAdding(false)} />
           <form onSubmit={handleSubmit} className="relative w-full max-w-xl bg-[#09090b] border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-4">
              <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">Initialize Project Node</h2>
              
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Project Title</label>
                <input required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-violet-500 outline-none transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Q4 Ecosystem Expansion" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Price Tag</label>
                  <input required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-violet-500 outline-none transition-all" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="e.g. $5,000" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Target Niche</label>
                  <input required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-violet-500 outline-none transition-all" value={formData.niche} onChange={e => setFormData({...formData, niche: e.target.value})} placeholder="e.g. Marketing" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Project Link (External)</label>
                <input required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-violet-500 outline-none transition-all" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Project Description (Max 10k chars)</label>
                <textarea required maxLength={10000} rows={5} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-violet-500 outline-none resize-none transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detail the scope of work..." />
              </div>

              <button type="submit" className="w-full py-4 bg-violet-600 text-white font-bold uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-violet-500 transition-all mt-4">
                Commit to Campaign Grid
              </button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
