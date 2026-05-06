import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

export function useCustomization(entityType) {
  const [runtime, setRuntime] = useState({ reference_lists: [], custom_fields: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/customization/runtime')
      .then((response) => {
        if (!cancelled) setRuntime(response.data);
      })
      .catch(() => {
        if (!cancelled) setRuntime({ reference_lists: [], custom_fields: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fields = useMemo(
    () => runtime.custom_fields.filter((field) => field.entity_type === entityType),
    [runtime.custom_fields, entityType]
  );

  const listsBySlug = useMemo(() => {
    return runtime.reference_lists.reduce((acc, list) => {
      acc[list.slug] = list.items || [];
      return acc;
    }, {});
  }, [runtime.reference_lists]);

  return { loading, fields, listsBySlug, runtime };
}

export function renderCustomFieldValue(field, value) {
  if (value === undefined || value === null || value === '') return '-';
  if (field.field_type === 'boolean') return value ? 'نعم' : 'لا';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
