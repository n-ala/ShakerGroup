import React, { useState, useEffect } from 'react';
import { MapPin, Users, Wrench, Award, RotateCw, Plus, Search, ShieldCheck, Settings } from 'lucide-react';
import DynamicTable from './components/DynamicTable';
import RecordModal from './components/RecordModal';

const API_BASE_URL = 'https://shakergroup.onrender.com/api'; 

export type TabType = 'locations' | 'users' | 'maintenance' | 'brands';

export interface TableConfig {
  id: TabType;
  label: string;
  path: string;
  endpoint: string;
  idKey: string;
  fields: { key: string; label: string; type: 'text' | 'number' }[];
}

const TABLES_SCHEMA: Record<TabType, TableConfig> = {
  locations: {
    id: 'locations',
    label: 'Locations',
    path: '/api/locations',
    endpoint: `${API_BASE_URL}/locations`,
    idKey: 'locationId',
    fields: [
      { key: 'subRegionId', label: 'Sub Region ID', type: 'number' },
      { key: 'city', label: 'City (EN)', type: 'text' },
      { key: 'cityArabic', label: 'City (AR)', type: 'text' },
      { key: 'district', label: 'District (EN)', type: 'text' },
      { key: 'districtArabic', label: 'District (AR)', type: 'text' },
    ]
  },
  users: {
    id: 'users',
    label: 'Users',
    path: '/api/user_profiles',
    endpoint: `${API_BASE_URL}/user_profiles`,
    idKey: 'phone_number',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'name', label: 'Full Name', type: 'text' },
      { key: 'email', label: 'Email Address', type: 'text' },
      { key: 'phone_number', label: 'Phone Number', type: 'text' },
      { key: 'business_unit', label: 'Business Unit', type: 'text' },
      { key: 'location', label: 'Location Code', type: 'text' },
    ]
  },
  maintenance: {
    id: 'maintenance',
    label: 'Maintenance fees',
    path: '/api/maintenance_fees',
    endpoint: `${API_BASE_URL}/maintenance_fees`,
    idKey: 'products_included_en',
    fields: [
      { key: 'products_included_en', label: 'Product Name (EN)', type: 'text' },
      { key: 'products_included_ar', label: 'Product Name (AR)', type: 'text' },
      { key: 'product_category_en', label: 'Category (EN)', type: 'text' },
      { key: 'new_service_price', label: 'Service Price', type: 'number' },
    ]
  },
  brands: {
    id: 'brands',
    label: 'Brands',
    path: '/api/brands',
    endpoint: `${API_BASE_URL}/brands`,
    idKey: 'brand_id',
    fields: [
      { key: 'brand_id', label: 'Brand ID', type: 'text' },
      { key: 'brand_name', label: 'Brand Name (EN)', type: 'text' },
      { key: 'brand_arabic', label: 'Brand Name (AR)', type: 'text' },
    ]
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('locations');
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentSchema = TABLES_SCHEMA[activeTab];

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(currentSchema.endpoint);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const result = await response.json();
      setData(Array.isArray(result) ? result : result.data || []);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(`Failed to connect to ${currentSchema.endpoint}. Please verify API health and CORS configurations.`);
      setData([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSaveRecord = async (formData: any) => {
    try {
      let url = currentSchema.endpoint;
      let method = 'POST';

      if (selectedRecord) {
        method = 'PUT';
        const idValue = selectedRecord[currentSchema.idKey] || formData[currentSchema.idKey];
        if (activeTab === 'locations') url += `?locationId=${idValue}`;
        else if (activeTab === 'users') url += `?phone=${idValue}`;
        else if (activeTab === 'maintenance') url += `?products_included_en=${encodeURIComponent(idValue)}`;
        else if (activeTab === 'brands') url += `?brand_id=${idValue}`;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Action rejected by target API');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`API Error: ${err.message}`);
    }
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-brand-darkBg text-neutral-200 flex flex-col font-sans selection:bg-brand-accent/30 selection:text-white">
      {/* Top Console Header */}
      <header className="bg-brand-cardBg border-b border-brand-border px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-neutral-900 px-3 py-2 rounded-xl flex items-center justify-center border border-brand-border">
            <img src="/Logo.png" alt="Shaker Group" className="h-6 object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-wide">Admin Console</h1>
            <p className="text-xs text-brand-textMuted font-medium">Manage your operational data</p>
          </div>
        </div>
        <button className="bg-brand-panelBg hover:bg-neutral-800 border border-brand-border text-neutral-300 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <Settings className="h-4 w-4 text-brand-textMuted" /> API Settings
        </button>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="bg-brand-cardBg border border-brand-border rounded-2xl p-2 flex gap-2 overflow-x-auto">
          {(Object.keys(TABLES_SCHEMA) as TabType[]).map((key) => {
            const schema = TABLES_SCHEMA[key];
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/10' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-brand-panelBg'
                }`}
              >
                {key === 'locations' && <MapPin className="h-4 w-4" />}
                {key === 'users' && <Users className="h-4 w-4" />}
                {key === 'maintenance' && <Wrench className="h-4 w-4" />}
                {key === 'brands' && <Award className="h-4 w-4" />}
                {schema.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Title and Subtitle */}
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{currentSchema.label}</h2>
          <span className="text-xs font-mono bg-brand-panelBg border border-brand-border text-brand-accent px-2.5 py-1 rounded-md inline-block mt-1.5">
            {currentSchema.path}
          </span>
        </div>

        {/* Controls Action Line (Search + Refresh + Create Button) */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-brand-textMuted" />
            <input
              type="text"
              placeholder={`Search ${currentSchema.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-cardBg border border-brand-border rounded-xl pl-11 pr-4 py-3 text-sm text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              className="bg-brand-cardBg hover:bg-brand-panelBg border border-brand-border p-3 rounded-xl transition-colors text-neutral-400 hover:text-white"
              title="Refresh Dataset"
            >
              <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-accent' : ''}`} />
            </button>
            <button
              onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }}
              className="flex-1 sm:flex-none bg-brand-accent hover:bg-brand-accentHover text-white font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-accent/10 transition-all"
            >
              <Plus className="h-4 w-4" /> New {currentSchema.label.replace(/s$/, '')}
            </button>
          </div>
        </div>

        {/* Clean Neutral Error Status Box */}
        {errorMessage && (
          <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-4 space-y-3">
            <div className="h-12 w-12 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center text-brand-accent text-xl font-bold">!</div>
            <h3 className="text-white font-bold text-base">Database Offline or Blocked</h3>
            <p className="text-xs font-mono text-neutral-400 max-w-lg leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Content Render Grid */}
        {!errorMessage && (
          <DynamicTable 
            data={filteredData} 
            schema={currentSchema} 
            loading={loading} 
            onEdit={(record) => { setSelectedRecord(record); setIsModalOpen(true); }} 
          />
        )}
      </main>

      {isModalOpen && (
        <RecordModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveRecord}
          schema={currentSchema}
          initialData={selectedRecord}
        />
      )}
    </div>
  );
}
