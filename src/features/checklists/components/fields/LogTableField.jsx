import React, { useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Clock } from 'lucide-react';
import FarmerSearchCell from './FarmerSearchCell';
import { ensureFarmerRegistry } from '@/features/aggregation/lib/farmerRegistry';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Returns current time as "HH:MM" */
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

/** Round to 2 decimal places */
const fmt2 = (val) => Math.round(val * 100) / 100;

/**
 * Milling-specific derived columns.
 * Called whenever any of the 6 input columns change in a milling log row.
 * Returns an object with the three calculated keys, or null if not applicable.
 */
const deriveMilling = (colKey, rowValues, newVal) => {
  const MILLING_INPUTS = ['paddyFed', 'milledRice', 'brokenRice', 'colorsorter', 'dustLiters', 'stonesRice'];
  if (!MILLING_INPUTS.includes(colKey)) return null;

  const merged = { ...rowValues, [colKey]: newVal };

  const paddy = parseFloat(merged.paddyFed) || 0;
  const milled = parseFloat(merged.milledRice) || 0;
  const broken = parseFloat(merged.brokenRice) || 0;
  const color = parseFloat(merged.colorsorter) || 0;
  const dust = parseFloat(merged.dustLiters) || 0;
  const stones = parseFloat(merged.stonesRice) || 0;

  if (paddy <= 0) return { huskBran: '', recoveryPct: '', breakagePct: '' };

  return {
    huskBran: fmt2(paddy - milled - broken - color - dust - stones),
    recoveryPct: fmt2((milled / paddy) * 100),
    breakagePct: fmt2((broken / paddy) * 100),
  };
};

// ─────────────────────────────────────────────
// LogTableField
// ─────────────────────────────────────────────

export default function LogTableField({ field }) {
  const { register, control, watch, setValue } = useFormContext();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: field.id
  });

  // ── Prefill rows (existing behaviour, unchanged) ─────────────────────────
  useEffect(() => {
    if (field.prefillRows && field.prefillRows.length > 0) {
      if (fields.length !== field.prefillRows.length) {
        console.warn(
          `Repairing LogTable ${field.id}: Expected ${field.prefillRows.length} rows, found ${fields.length}. Resetting to template.`
        );
        replace(field.prefillRows);
      }
    }
  }, [field.prefillRows, replace, fields.length]);

  // ── Timestamp helper (existing behaviour, unchanged) ─────────────────────
  const handleTimestamp = (index) => {
    const now = new Date();
    setValue(`${field.id}.${index}._timestamp`, now.toISOString());
  };

  // ── Field change handler (existing logic + milling extension) ────────────
  const handleFieldChange = (index, colKey, val) => {
    // EXISTING: legacy single-source computed columns
    field.columns.forEach(col => {
      if (col.computed) {
        const { operation, source, factor } = col.computed;
        if (source === colKey) {
          let result = 0;
          const numVal = parseFloat(val);
          if (!isNaN(numVal)) {
            if (operation === 'divide') result = numVal / factor;
            if (operation === 'multiply') result = numVal * factor;
          }
          setValue(`${field.id}.${index}.${col.key}`, result);
        }
      }

      // EXISTING: multi-source calculation (e.g. weight * price = gross)
      if (col.calculation && col.calculation.sources.includes(colKey)) {
        const { operation, sources } = col.calculation;
        if (operation === 'multiply') {
          const rowValues = watch(`${field.id}.${index}`);
          let result = 1;
          let allPresent = true;
          sources.forEach(src => {
            const currentVal = src === colKey ? val : rowValues[src];
            const num = parseFloat(currentVal);
            if (isNaN(num)) { allPresent = false; } else { result *= num; }
          });
          setValue(
            `${field.id}.${index}.${col.key}`,
            allPresent ? Math.round(result) : 0
          );
        }
      }
    });

    // NEW: milling derived columns (huskBran, recoveryPct, breakagePct)
    const rowValues = watch(`${field.id}.${index}`);
    const milling = deriveMilling(colKey, rowValues, val);
    if (milling) {
      Object.entries(milling).forEach(([key, derived]) => {
        setValue(`${field.id}.${index}.${key}`, derived);
      });
    }
  };

  // ── Add row: auto-fill time + inherit shift variety ──────────────────────
  const handleAddRow = () => {
    const initial = {};

    field.columns.forEach(col => {
      if (col.autoFillTime) {
        initial[col.key] = getCurrentTime();
      } else if (col.key === 'variety' && field.defaultVarietyField) {
        initial[col.key] = watch(field.defaultVarietyField) || '';
      } else {
        initial[col.key] = '';
      }
    });

    append(initial);
  };

  const columns = field.columns || [];

  useEffect(() => {
    if (columns.some((col) => col.type === 'farmer-search')) {
      ensureFarmerRegistry().catch((err) =>
        console.warn('Farmer registry preload failed:', err)
      );
    }
  }, [columns]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{field.label}</label>
      </div>

      {/* Legend — only shown if this table has calculated columns */}
      {columns.some(col => col.calculated) && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block flex-shrink-0" />
          Columns marked <span className="font-semibold text-green-700 mx-1">(auto)</span> are calculated from your inputs
        </div>
      )}

      <div className="border rounded-md overflow-hidden bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`text-xs uppercase font-semibold whitespace-nowrap ${col.calculated ? 'text-green-700' : 'text-gray-500'
                    }`}
                >
                  {col.label}
                  {col.calculated && (
                    <span className="ml-1 normal-case font-normal text-green-500">(auto)</span>
                  )}
                </TableHead>
              ))}
              <TableHead className="w-[100px] text-xs uppercase text-gray-500 font-semibold">
                Log Time
              </TableHead>
              {!field.prefillRows && <TableHead className="w-[50px]" />}
            </TableRow>
          </TableHeader>

          <TableBody>
            {fields.map((item, index) => {
              const timestamp = watch(`${field.id}.${index}._timestamp`);

              return (
                <TableRow key={item.id}>
                  {columns.map((col) => (
                    <TableCell key={`${item.id}-${col.key}`} className="p-2 min-w-[120px]">

                      {/* Read-only / calculated cells */}
                      {(col.readOnly || col.calculated) ? (
                        <Input
                          {...register(`${field.id}.${index}.${col.key}`)}
                          readOnly
                          className="h-9 text-xs bg-gray-50 text-green-700 font-semibold"
                        />

                        /* Farmer search (GGEM export API) */
                      ) : col.type === 'farmer-search' ? (
                        <FarmerSearchCell
                          name={`${field.id}.${index}.${col.key}`}
                          column={col}
                          onBlurExtra={(val) => {
                            handleTimestamp(index);
                            handleFieldChange(index, col.key, val);
                          }}
                        />

                        /* Select cells (e.g. variety) */
                      ) : col.type === 'select' ? (
                        <select
                          {...register(`${field.id}.${index}.${col.key}`)}
                          className="w-full h-9 text-xs border border-gray-200 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          onChange={(e) => {
                            handleTimestamp(index);
                            handleFieldChange(index, col.key, e.target.value);
                          }}
                        >
                          <option value="">-- Select --</option>
                          {col.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>

                        /* Standard input cells */
                      ) : (
                        <Input
                          {...register(`${field.id}.${index}.${col.key}`)}
                          placeholder={col.placeholder}
                          type={col.type || 'text'}
                          className="h-9 text-xs"
                          onBlur={(e) => {
                            handleTimestamp(index);
                            handleFieldChange(index, col.key, e.target.value);
                          }}
                        />
                      )}
                    </TableCell>
                  ))}

                  {/* Log Time column (existing behaviour, unchanged) */}
                  <TableCell>
                    <div className="flex flex-col text-xs text-gray-500">
                      {timestamp ? (
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <Clock className="w-3 h-3" />
                          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="opacity-50">Pending...</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Delete button */}
                  {!field.prefillRows && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add Row button */}
      {!field.prefillRows && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Row
        </Button>
      )}
    </div>
  );
}