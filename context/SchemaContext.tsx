
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Attribute, ProfileSection } from '../types';
import { INITIAL_ATTRIBUTES, INITIAL_SECTIONS } from '../constants';

interface SchemaContextType {
  attributes: Attribute[];
  sections: ProfileSection[];
  isLoading: boolean;
  addField: (key: string, label: string, type: Attribute['data_type']) => Promise<void>;
  hideField: (key: string) => Promise<void>;
  nukeField: (key: string) => Promise<void>;
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

const SECTION_KEY = 'axis_schema_sections';

export const SchemaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const initSchema = async () => {
      // Detection of live environment based on active client configuration
      const live = !supabase.supabaseUrl.includes('placeholder-project-id');
      setIsLive(live);

      // 1. Load Sections (Maintain existing localStorage behavior for sections as requested)
      const savedSec = localStorage.getItem(SECTION_KEY);
      if (savedSec) {
        setSections(JSON.parse(savedSec));
      } else {
        setSections(INITIAL_SECTIONS);
        localStorage.setItem(SECTION_KEY, JSON.stringify(INITIAL_SECTIONS));
      }

      // 2. Load Attributes from Supabase
      if (live) {
        try {
          const { data, error } = await supabase
            .from('schema_attributes')
            .select('*')
            .order('display_order', { ascending: true });

          if (error) {
            console.error("[AXIS] Supabase Schema Fetch Error:", error.message);
            setAttributes(INITIAL_ATTRIBUTES);
          } else if (data && data.length > 0) {
            // Mapping DB columns to our Attribute interface
            setAttributes(data as Attribute[]);
          } else {
            // If table exists but is empty, use defaults
            setAttributes(INITIAL_ATTRIBUTES);
          }
        } catch (err) {
          console.error("[AXIS] Critical Schema Init Error:", err);
          setAttributes(INITIAL_ATTRIBUTES);
        }
      } else {
        setAttributes(INITIAL_ATTRIBUTES);
      }

      setIsLoading(false);
    };

    initSchema();
  }, []);

  const addField = async (key: string, label: string, type: Attribute['data_type']) => {
    const newAttr: Attribute = {
      key,
      label,
      data_type: type,
      options: null,
      is_public: true
    };

    // Store previous state for rollback
    const previousAttributes = [...attributes];
    
    // Optimistic UI update
    setAttributes(prev => [...prev, newAttr]);

    if (isLive) {
      try {
        const { error } = await supabase
          .from('schema_attributes')
          .insert({ 
            key, 
            label, 
            data_type: type, 
            options: null, 
            is_public: true,
            display_order: attributes.length 
          });

        if (error) throw error;
      } catch (err) {
        console.error("[AXIS] Supabase AddField Error. Rolling back UI state...", err);
        setAttributes(previousAttributes);
      }
    }
  };

  const hideField = async (key: string) => {
    const target = attributes.find(a => a.key === key);
    if (!target) return;

    const previousAttributes = [...attributes];
    const updatedValue = !target.is_public;

    // Optimistic UI update
    setAttributes(prev => prev.map(a => 
      a.key === key ? { ...a, is_public: updatedValue } : a
    ));

    if (isLive) {
      try {
        const { error } = await supabase
          .from('schema_attributes')
          .update({ is_public: updatedValue })
          .eq('key', key);

        if (error) throw error;
      } catch (err) {
        console.error("[AXIS] Supabase HideField Error. Rolling back UI state...", err);
        setAttributes(previousAttributes);
      }
    }
  };

  const nukeField = async (key: string) => {
    const previousAttributes = [...attributes];

    // Optimistic UI update
    setAttributes(prev => prev.filter(a => a.key !== key));

    if (isLive) {
      try {
        const { error } = await supabase
          .from('schema_attributes')
          .delete()
          .eq('key', key);

        if (error) throw error;
      } catch (err) {
        console.error("[AXIS] Supabase NukeField Error. Rolling back UI state...", err);
        setAttributes(previousAttributes);
      }
    }
  };

  return (
    <SchemaContext.Provider value={{ attributes, sections, isLoading, addField, hideField, nukeField }}>
      {children}
    </SchemaContext.Provider>
  );
};

export const useSchema = () => {
  const context = useContext(SchemaContext);
  if (!context) throw new Error("useSchema must be used within a SchemaProvider");
  return context;
};
