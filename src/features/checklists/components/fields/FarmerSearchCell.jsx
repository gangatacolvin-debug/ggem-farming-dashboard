import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Loader2, Search, User } from 'lucide-react';
import {
    ensureFarmerRegistry,
    searchFarmers,
} from '@/features/aggregation/lib/farmerRegistry';

/**
 * Inline farmer typeahead for log-table cells (aggregation weighing / QC).
 */
export default function FarmerSearchCell({ name, column, onBlurExtra }) {
    const { setValue, watch } = useFormContext();
    const formValue = watch(name) || '';
    const [input, setInput] = useState(formValue);
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [ready, setReady] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        ensureFarmerRegistry()
            .then(() => {
                if (!cancelled) {
                    setReady(true);
                    setLoadError(null);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setLoadError(err.message || 'Could not load farmers');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        setInput(formValue);
    }, [formValue]);

    useEffect(() => {
        const onDocClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const runSearch = (term) => {
        if (!ready) return;
        setResults(searchFarmers(term));
        setOpen(true);
    };

    const handleChange = (e) => {
        const v = e.target.value;
        setInput(v);
        setValue(name, v, { shouldDirty: true, shouldValidate: true });
        runSearch(v);
    };

    const handleSelect = (farmer) => {
        setValue(name, farmer.displayName, { shouldDirty: true, shouldValidate: true });
        setInput(farmer.displayName);
        setOpen(false);
        onBlurExtra?.(farmer.displayName);
    };

    const handleBlur = () => {
        setTimeout(() => setOpen(false), 150);
        onBlurExtra?.(input);
    };

    return (
        <div ref={wrapRef} className="relative min-w-[160px]">
            <div className="relative">
                {loading ? (
                    <Loader2 className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
                ) : (
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                )}
                <Input
                    value={input}
                    onChange={handleChange}
                    onFocus={() => input.length >= 2 && runSearch(input)}
                    onBlur={handleBlur}
                    placeholder={column?.placeholder || 'Search farmer…'}
                    className="h-9 text-xs pl-8"
                    autoComplete="off"
                />
            </div>
            {loadError && (
                <p className="text-[10px] text-red-600 mt-0.5">{loadError}</p>
            )}
            {open && results.length > 0 && (
                <div className="absolute z-[100] left-0 right-0 mt-1 min-w-[220px] bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {results.map((farmer) => (
                        <button
                            key={farmer.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 border-b last:border-0"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelect(farmer)}
                        >
                            <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">
                                    {farmer.displayName}
                                </p>
                                {farmer.gender && (
                                    <p className="text-[10px] text-gray-500">{farmer.gender}</p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
            {open && ready && input.length >= 2 && results.length === 0 && (
                <div className="absolute z-[100] left-0 mt-1 w-full bg-white border rounded-md shadow px-3 py-2 text-xs text-gray-500">
                    No farmers match &quot;{input}&quot;
                </div>
            )}
        </div>
    );
}
