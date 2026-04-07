import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

/**
 * FirestoreSelectField
 *
 * Single-select dropdown populated from a Firestore collection.
 *
 * Config properties used:
 *   field.collection     — Firestore collection name e.g. 'employees' or 'fleet'
 *   field.filters        — array of { field, operator, value } where() conditions (optional)
 *   field.displayField   — document field to use as the option label e.g. 'name'
 *   field.secondaryField — optional second field shown alongside label e.g. 'type' → "MK-1234 · Truck"
 *   field.required
 */
export default function FirestoreSelectField({ field }) {
    const { register, formState: { errors } } = useFormContext();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

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
                console.error(`FirestoreSelectField [${field.id}] fetch error:`, err);
                setFetchError('Failed to load options. Please refresh.');
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [field.collection, field.id]);

    const errorMessage = errors[field.id]?.message;

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

            {fetchError && (
                <p className="text-sm text-red-600">{fetchError}</p>
            )}

            {!loading && !fetchError && (
                <select
                    id={field.id}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    {...register(field.id, { required: field.required ? `${field.label} is required` : false })}
                >
                    <option value="">-- Select {field.label} --</option>
                    {options.map(option => (
                        <option key={option.id} value={option[field.displayField]}>
                            {option[field.displayField]}
                            {field.secondaryField && option[field.secondaryField]
                                ? ` · ${option[field.secondaryField]}`
                                : ''}
                        </option>
                    ))}
                </select>
            )}

            {!loading && !fetchError && options.length === 0 && (
                <p className="text-sm text-gray-400">No records found in {field.collection}.</p>
            )}

            {errorMessage && (
                <p className="text-sm text-red-600">{errorMessage}</p>
            )}
        </div>
    );
}