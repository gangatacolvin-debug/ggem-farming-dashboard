import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

function formatOptionLabel(option, displayField) {
  if (displayField && option[displayField]) return String(option[displayField]);
  const parts = [option.firstName, option.lastName].filter(Boolean).join(' ').trim();
  return (
    option.displayName ||
    option.name ||
    parts ||
    option.email ||
    option.id ||
    '—'
  );
}

function optionValue(option, valueField) {
  if (valueField === 'docId' || valueField === 'id' || !valueField) {
    return option.id;
  }
  return option[valueField] != null ? String(option[valueField]) : option.id;
}

/**
 * FirestoreSelectField
 *
 * Config:
 *   field.collection     — collection id e.g. 'users'
 *   field.filters        — { field, operator, value }[] static where() clauses
 *   field.displayField   — optional label field; otherwise uses displayName / name / email
 *   field.secondaryField — optional second part of label
 *   field.valueField     — 'docId' (default) stores Firestore document id; or a data field name
 *   field.hubFormField   — optional: form field id for hub slug; adds where('hub','==',value) when set
 *   field.required
 */
export default function FirestoreSelectField({ field }) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext();

  const watchedHub = useWatch({
    control,
    name: field.hubFormField || '__firestoreSelectHubSentinel__',
  });

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const valueField = field.valueField || 'docId';
  const filtersKey = useMemo(() => JSON.stringify(field.filters || []), [field.filters]);

  const prevHubRef = useRef(undefined);

  useEffect(() => {
    if (!field.hubFormField) return;
    if (prevHubRef.current !== undefined && prevHubRef.current !== watchedHub) {
      setValue(field.id, '', { shouldValidate: true, shouldDirty: true });
    }
    prevHubRef.current = watchedHub;
  }, [watchedHub, field.hubFormField, field.id, setValue]);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      setFetchError(null);

      if (field.hubFormField && !watchedHub) {
        setOptions([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch all users and filter fully on client-side to be most robust
        const firestoreQuery = query(collection(db, field.collection));

        const snapshot = await getDocs(firestoreQuery);
        const requiredRole = (field.filters || []).find(f => f.field === 'role')?.value;

        console.log(`Dropdown [${field.id}] fetched ${snapshot.docs.length} users. Filtering for hub: ${watchedHub}, role: ${requiredRole}`);

        let docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })).filter(u => {
          // Force active status check (case-insensitive)
          const status = String(u.status || "").toLowerCase();
          
          // Check legacy fields
          const matchesLegacy = u.hub === watchedHub && (!requiredRole || u.role === requiredRole);
          
          // Check new hubAssignments
          const matchesNew = Array.isArray(u.hubAssignments) && 
                 u.hubAssignments.some(assign => 
                   assign.hub === watchedHub && 
                   (!requiredRole || assign.aggregationRole === requiredRole)
                 );
          
          // Allow empty status OR 'active' (Problem fix)
          const isStatusValid = status === 'active' || status === '';
          
          const finalMatch = isStatusValid && (matchesLegacy || matchesNew);

          if (u.name?.includes('Ndapile') || u.name?.includes('Colvin') || u.name?.includes('Umali')) {
             console.log(`DEBUG [${u.name}]: status="${status}", legacy=${matchesLegacy}, new=${matchesNew}, finalMatch=${finalMatch}`);
          }

          return finalMatch;
        });

        console.log(`Dropdown [${field.id}] matches after filter:`, docs.length);
        setOptions(docs);
      } catch (err) {
        console.error(`FirestoreSelectField [${field.id}] fetch error:`, err);
        setFetchError('Failed to load options. Please refresh.');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [field.collection, field.id, filtersKey, watchedHub, field.hubFormField]);

  const errorMessage = errors[field.id]?.message;

  const showSelectHubFirst = field.hubFormField && !watchedHub;

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading {field.label}...
        </div>
      )}

      {fetchError && <p className="text-sm text-red-600">{fetchError}</p>}

      {showSelectHubFirst && !loading && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Select a hub above to load staff for this location.
        </p>
      )}

      {!loading && !fetchError && !showSelectHubFirst && (
        <select
          id={field.id}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          {...register(field.id, {
            required: field.required ? `${field.label} is required` : false,
          })}
        >
          <option value="">-- Select {field.label} --</option>
          {options.map((option) => {
            const val = optionValue(option, valueField);
            const label = formatOptionLabel(option, field.displayField);
            const secondary =
              field.secondaryField && option[field.secondaryField]
                ? ` · ${option[field.secondaryField]}`
                : '';
            return (
              <option key={option.id} value={val}>
                {label}
                {secondary}
              </option>
            );
          })}
        </select>
      )}

      {!loading && !fetchError && !showSelectHubFirst && options.length === 0 && (
        <p className="text-sm text-gray-500">
          No active users found for this hub and role. Check Firestore{' '}
          <code className="text-xs bg-muted px-1 rounded">users</code> (department, hub, status, role).
        </p>
      )}

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
}
