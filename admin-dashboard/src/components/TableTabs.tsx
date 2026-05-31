import React from 'react';
import { TabType, TableConfig } from '../App';
import { MapPin, Users, Wrench, Award } from 'lucide-react';

interface TabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  schemas: Record<TabType, TableConfig>;
}

export default function TableTabs({ activeTab, setActiveTab, schemas }: TabsProps) {
  const getIcon = (id: TabType) => {
    switch (id) {
      case 'locations': return <MapPin className="h-4 w-4" />;
      case 'users': return <Users className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'brands': return <Award className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex border-b border-brand-border gap-2 overflow-x-auto pb-px mb-6 scrollbar-none">
      {Object.values(schemas).map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-5 py-3.5 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
              isActive 
                ? 'border-brand-accent text-brand-accent bg-gradient-to-t from-emerald-950/10 to-transparent' 
                : 'border-transparent text-brand-textMuted hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span className={isActive ? 'text-brand-accent' : 'text-slate-500'}>
              {getIcon(tab.id)}
            </span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}