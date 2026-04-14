import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, User, Users, Check, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, limit, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * FarmerLookupField - Searchable field for selecting farmers from Firestore
 * Auto-fills linked fields (like group/club) on selection.
 */
export default function FarmerLookupField({ field }) {
  const { setValue, register, watch } = useFormContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimer = useRef(null);

  const searchFarmers = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const farmersRef = collection(db, 'farmers');
      // Simple search by name or ID
      const q = query(
        farmersRef,
        or(
          where('name', '>=', term),
          where('name', '<=', term + '\uf8ff'),
          where('farmerId', '==', term)
        ),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setResults(docs);
      setShowDropdown(true);
    } catch (error) {
      console.error('Farmer lookup error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Native debounce implementation
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      searchFarmers(value);
    }, 500);
  };

  const handleSelect = (farmer) => {
    // Set the main field value
    setValue(field.id, farmer.name, { shouldValidate: true, shouldDirty: true });
    
    // Auto-fill linked fields if defined in config
    if (field.autoFill) {
      Object.entries(field.autoFill).forEach(([sourceKey, targetFieldId]) => {
        const value = farmer[sourceKey];
        if (value) {
          setValue(targetFieldId, value, { shouldValidate: true, shouldDirty: true });
        }
      });
    }

    setSearchTerm(farmer.name);
    setShowDropdown(false);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor={field.id}>{field.label}</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <Input
          {...register(field.id)}
          id={field.id}
          placeholder={field.placeholder || "Search farmer by name or ID..."}
          className="pl-10"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          autoComplete="off"
        />
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((farmer) => (
            <div
              key={farmer.id}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between border-b last:border-0"
              onClick={() => handleSelect(farmer)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{farmer.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {farmer.clubName || farmer.groupName || 'No Group'}
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono text-gray-400">
                {farmer.farmerId || 'No ID'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
