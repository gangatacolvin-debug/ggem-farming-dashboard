import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';

/**
 * FirestoreMultiselectField
 *
 * Multi-select field populated from Firestore. Selected items shown as badges.
 * Count is auto-calculated from the number of selections and written to countField.
 *
 * Config properties used:
 *   field.collection   — Firestore collection name
 *   field.filters      — array of { field, operator, value } where() conditions (optional)
 *   field.displayField — document field to use as the option label e.g. 'name'
 *   field.countField   — id of the sibling field to auto-populate with the count
 *   field.countLabel   — label shown next to the auto count
 *   field.required
 */
export default function FirestoreMultiselectField({ field }) {
    const { setValue, watch, formState: { errors } } = useFormContext();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const selectedValues = watch(field.id) || [];

    useEffect(() => {
        const fetchOptions = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                let firestoreQuery;

                if (field.filters && field.filters.length > 0) {
                    const conditions = field.filters.map(f => where(f.field, f.operator, f.value));
                    firestoreQuery = query(collection(db, field.collection), ...conditions);
                } else {
                    firestoreQuery = query(collection(db, field.collection));
                }

                const snapshot = await getDocs(firestoreQuery);
                const docs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setOptions(docs);
            } catch (err) {
                console.error(`FirestoreMultiselectField [${field.id}] fetch error:`, err);
                setFetchError('Failed to load options. Please refresh.');
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [field.collection, field.id]);

    const toggleOption = (name) => {
        const current = selectedValues || [];
        let updated;

        if (current.includes(name)) {
            updated = current.filter(v => v !== name);
        } else {
            updated = [...current, name];
        }

        setValue(field.id, updated, { shouldValidate: true, shouldDirty: true });

        // Auto-update the count field
        if (field.countField) {
            setValue(field.countField, updated.length, { shouldDirty: true });
        }
    };

    const removeSelected = (name) => {
        const updated = (selectedValues || []).filter(v => v !== name);
        setValue(field.id, updated, { shouldValidate: true, shouldDirty: true });
        if (field.countField) {
            setValue(field.countField, updated.length, { shouldDirty: true });
        }
    };

    return (
        <div className="space-y-2">
            <Label>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading {field.label}...
                </div>
            )}

            {fetchError && (
                <p className="text-sm text-red-600">{fetchError}</p>
            )}

            {!loading && !fetchError && (
                <>
                    {/* Selected badges */}
                    {selectedValues.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedValues.map(name => (
                                <Badge key={name} variant="secondary" className="flex items-center gap-1 pr-1">
                                    {name}
                                    <button
                                        type="button"
                                        onClick={() => removeSelected(name)}
                                        className="ml-1 hover:text-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Options list */}
                    <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto divide-y divide-gray-100">
                        {options.length === 0 ? (
                            <p className="text-sm text-gray-400 p-3">No records found in {field.collection}.</p>
                        ) : (
                            options.map(option => {
                                const name = option[field.displayField];
                                const isSelected = (selectedValues || []).includes(name);
                                return (
                                    <div
                                        key={option.id}
                                        onClick={() => toggleOption(name)}
                                        className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm transition-colors ${isSelected ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <span>{name}</span>
                                        {isSelected && (
                                            <span className="text-blue-500 font-bold text-xs">✓</span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Auto count */}
                    {field.countField && (
                        <p className="text-xs text-gray-500">
                            {field.countLabel || 'Count'}: <strong>{selectedValues.length}</strong>
                        </p>
                    )}
                </>
            )}

            {errors[field.id] && (
                <p className="text-sm text-red-600">{errors[field.id]?.message}</p>
            )}
        </div>
    );
}