import React, { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import TableTabs from './components/TableTabs';
import DynamicTable from './components/DynamicTable';
import RecordModal from './components/RecordModal';

// Live production API endpoint
const API_BASE_URL = 'https://shakergroup.onrender.com/api'; 

export type TabType = 'locations' | 'users' | 'maintenance' | 'brands';

export interface TableConfig {
  id: TabType;
  label: string;
  endpoint: string;
  idKey: string; 
  fields: { key: string; label: string; type: 'text' | 'number'; placeholder?: string }[];
}

const TABLES_SCHEMA: Record<TabType, TableConfig> = {
  locations: {
    id: 'locations',
    label: 'Locations Management',
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
    label: 'User Profiles',
    endpoint: `${API_BASE_URL}/user_profiles`,
    idKey: 'phone_number',
    fields: [
      { key: 'title', label: 'Title', type: 'text', placeholder: 'e.g., Mr. / Ms.' },
      { key: 'name', label: 'Full Name', type: 'text' },
      { key: 'email', label: 'Email Address', type: 'text' },
      { key: 'phone_number', label: 'Phone Number', type: 'text' },
      { key: 'business_unit', label: 'Business Unit', type: 'text' },
      { key: 'location', label: 'Location Code', type: 'text' },
      { key: 'house_no', label: 'House No.', type: 'text' },
      { key: 'strtno', label: 'Street No.', type: 'text' },
      { key: 'flrno', label: 'Floor No.', type: 'text' },
      { key: 'preferred_language', label: 'Language (E/A)', type: 'text' },
    ]
  },
  maintenance: {
    id: 'maintenance',
    label: 'Maintenance Fees',
    endpoint: `${API_BASE_URL}/maintenance_fees`,
    idKey: 'products_included_en',
    fields: [
      { key: 'products_included_en', label: 'Product Name (EN)', type: 'text' },
      { key: 'products_included_ar', label: 'Product Name (AR)', type: 'text' },
      { key: 'product_category_en', label: 'Category (EN)', type: 'text' },
      { key: 'product_category_ar', label: 'Category (AR)', type: 'text' },
      { key: 'new_service_price', label: 'Service Price', type: 'number' },
    ]
  },
  brands: {
    id: 'brands',
    label: 'Brand Assets',
    endpoint: `${API_BASE_URL}/brands`,
    idKey: 'brand_id',
    fields: [
      { key: 'brand_id', label: 'Brand ID (Required for updates)', type: 'text', placeholder: 'e.g., LG, WHIRLPOOL' },
      { key: 'brand_name', label: 'Brand Name (EN)', type: 'text' },
      { key: 'brand_arabic', label: 'Brand Name (AR)', type: 'text' },
    ]
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('locations');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentSchema = TABLES_SCHEMA[activeTab];

  // 1. READ (GET) Action
  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(currentSchema.endpoint);
      if (!response.ok) throw new Error(`HTTP Error: Status ${response.status}`);
      const result = await response.json();
      
      // Handle potential API response arrays or wrapped objects safely
      setData(Array.isArray(result) ? result : result.data || []);
    } catch (error: any) {
      console.error("Error pulling database records:", error);
      setErrorMessage(`Failed to connect to ${currentSchema.endpoint}. Please verify API health and CORS configurations.`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // 2. CREATE (POST) & UPDATE (PUT) Action
  const handleSaveRecord = async (formData: any) => {
    setErrorMessage(null);
    try {
      let url = currentSchema.endpoint;
      let method = 'POST';

      // Map parameters uniquely based on your specified lookup keys for PUT requests
      if (selectedRecord) {
        method = 'PUT';
        const idValue = selectedRecord[currentSchema.idKey] || formData[currentSchema.idKey];
        
        if (activeTab === 'locations') {
          url += `?locationId=${idValue}`;
        } else if (activeTab === 'users') {
          url += `?phone=${idValue}`;
        } else if (activeTab === 'maintenance') {
          url += `?products_included_en=${encodeURIComponent(idValue)}`;
        } else if (activeTab === 'brands') {
          url += `?brand_id=${idValue}`;
        }
      }

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Server rejected update transaction. Status ${response.status}`);
      }
      
      setIsModalOpen(false);
      fetchData(); // Instantly reload table dataset on success
    } catch (err: any) {
      console.error("API write error:", err);
      alert(`API Transaction Failure: ${err.message}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{currentSchema.label}</h1>
          <p className="text-brand-textMuted text-sm">Shaker Group live gateway database synchronization hub.</p>
        </div>
        <button
          onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }}
          className="bg-brand-accent hover:bg-brand-accentHover text-brand-darkBg font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm shadow-md shadow-emerald-500/10"
        >
          <span>+ Create New Record</span>
        </button>
      </div>

      <TableTabs activeTab={activeTab} setActiveTab={setActiveTab} schemas={TABLES_SCHEMA} />

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-800 text-red-200 rounded-lg text-sm font-mono">
           {errorMessage}
        </div>
      )}

      <DynamicTable 
        data={data} 
        schema={currentSchema} 
        loading={loading} 
        onEdit={(record) => { setSelectedRecord(record); setIsModalOpen(true); }} 
      />

      {isModalOpen && (
        <RecordModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveRecord}
          schema={currentSchema}
          initialData={selectedRecord}
        />
      )}
    </DashboardLayout>
  );
}