import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Plus } from 'lucide-react';

/**
 * FirestoreMultiselectWithManualField
 *
 * Multi-select from Firestore + manual text entry for names not in the system.
 * Total count is auto-calculated from (Firestore selections + manual entries)
 * and written to countField.
 *
 * Config properties used:
 *   field.collection            — Firestore collection name
 *   field.filters               — array of { field, operator, value } conditions (optional)
 *   field.displayField          — document field to use as label e.g. 'name'
 *   field.manualInputLabel      — label for the manual input section
 *   field.manualInputPlaceholder — placeholder text for manual input
 *   field.countField            — sibling field id to auto-populate with total count
 *   field.countLabel            — label shown next to the count
 *   field.required
 *
 * Stored value shape (written to field.id):
 *   { selected: string[], manual: string[] }
 */
export default function FirestoreMultiselectWithManualField({ field }) {
    const { setValue, watch, formState: { errors } } = useFormContext();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [manualInput, setManualInput] = useState('');

    const storedValue = watch(field.id) || { selected: [], manual: [] };
    const selectedFromFirestore = storedValue.selected || [];
    const manualEntries = storedValue.manual || [];
    const totalCount = selectedFromFirestore.length + manualEntries.length;

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
                console.error(`FirestoreMultiselectWithManualField [${field.id}] fetch error:`, err);
                setFetchError('Failed to load options. Please refresh.');
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [field.collection, field.id]);

    const updateValue = (newSelected, newManual) => {
        const updated = { selected: newSelected, manual: newManual };
        setValue(field.id, updated, { shouldValidate: true, shouldDirty: true });

        if (field.countField) {
            setValue(field.countField, newSelected.length + newManual.length, { shouldDirty: true });
        }
    };

    const toggleFirestoreOption = (name) => {
        let updatedSelected;
        if (selectedFromFirestore.includes(name)) {
            updatedSelected = selectedFromFirestore.filter(v => v !== name);
        } else {
            updatedSelected = [...selectedFromFirestore, name];
        }
        updateValue(updatedSelected, manualEntries);
    };

    const removeFirestoreSelection = (name) => {
        updateValue(selectedFromFirestore.filter(v => v !== name), manualEntries);
    };

    const addManualEntry = () => {
        const trimmed = manualInput.trim();
        if (!trimmed) return;
        if (manualEntries.includes(trimmed)) {
            setManualInput('');
            return;
        }
        updateValue(selectedFromFirestore, [...manualEntries, trimmed]);
        setManualInput('');
    };

    const removeManualEntry = (name) => {
        updateValue(selectedFromFirestore, manualEntries.filter(v => v !== name));
    };

    const handleManualKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addManualEntry();
        }
    };

    return (
        <div className="space-y-3">
            <Label>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {/* ── Selected badges (Firestore + Manual) */}
            {(selectedFromFirestore.length > 0 || manualEntries.length > 0) && (
                <div className="flex flex-wrap gap-2">
                    {selectedFromFirestore.map(name => (
                        <Badge key={name} className="flex items-center gap-1 pr-1 bg-blue-100 text-blue-800 border border-blue-200">
                            {name}
                            <button type="button" onClick={() => removeFirestoreSelection(name)} className="ml-1 hover:text-red-600">
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                    {manualEntries.map(name => (
                        <Badge key={name} className="flex items-center gap-1 pr-1 bg-orange-100 text-orange-800 border border-orange-200">
                            {name} <span className="text-orange-400 text-xs">(manual)</span>
                            <button type="button" onClick={() => removeManualEntry(name)} className="ml-1 hover:text-red-600">
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* ── Firestore options list */}
            {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading casuals...
                </div>
            )}

            {fetchError && (
                <p className="text-sm text-red-600">{fetchError}</p>
            )}

            {!loading && !fetchError && (
                <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {options.length === 0 ? (
                        <p className="text-sm text-gray-400 p-3">No casual labourers found in system.</p>
                    ) : (
                        options.map(option => {
                            const name = option[field.displayField];
                            const isSelected = selectedFromFirestore.includes(name);
                            return (
                                <div
                                    key={option.id}
                                    onClick={() => toggleFirestoreOption(name)}
                                    className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm transition-colors ${isSelected ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <span>{name}</span>
                                    {isSelected && <span className="text-blue-500 font-bold text-xs">✓</span>}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ── Manual entry */}
            <div>
                <p className="text-xs text-gray-500 mb-1">
                    {field.manualInputLabel || 'Add person not in system'}
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={manualInput}
                        onChange={e => setManualInput(e.target.value)}
                        onKeyDown={handleManualKeyDown}
                        placeholder={field.manualInputPlaceholder || 'Type name and press Enter'}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="button"
                        onClick={addManualEntry}
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </div>
            </div>

            {/* ── Auto count */}
            {field.countField && (
                <p className="text-xs text-gray-500">
                    {field.countLabel || 'Total'}: <strong>{totalCount}</strong>
                    {selectedFromFirestore.length > 0 && ` (${selectedFromFirestore.length} from system`}
                    {manualEntries.length > 0 && `, ${manualEntries.length} manual`}
                    {(selectedFromFirestore.length > 0 || manualEntries.length > 0) && ')'}
                </p>
            )}

            {errors[field.id] && (
                <p className="text-sm text-red-600">{errors[field.id]?.message}</p>
            )}
        </div>
    );
}