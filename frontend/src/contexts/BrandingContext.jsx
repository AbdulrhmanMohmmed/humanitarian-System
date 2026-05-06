import { createContext, useContext, useState, useEffect } from 'react';

const BrandingContext = createContext();

const defaultBranding = {
  logo: null,
  primaryColor: '#2563eb',
  orgName: 'HIAOS Operating System',
  theme: 'modern'
};

function loadStoredBranding() {
  const saved = localStorage.getItem('hiaos_branding');
  if (!saved) return defaultBranding;
  try {
    return { ...defaultBranding, ...JSON.parse(saved) };
  } catch {
    localStorage.removeItem('hiaos_branding');
    return defaultBranding;
  }
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(loadStoredBranding);

  useEffect(() => {
    localStorage.setItem('hiaos_branding', JSON.stringify(branding));
    // Apply primary color to CSS variable
    document.documentElement.style.setProperty('--brand-primary', branding.primaryColor);
    document.documentElement.style.setProperty('--brand-primary-light', `${branding.primaryColor}20`);
  }, [branding]);

  const updateBranding = (newBranding) => {
    setBranding(prev => ({ ...prev, ...newBranding }));
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
