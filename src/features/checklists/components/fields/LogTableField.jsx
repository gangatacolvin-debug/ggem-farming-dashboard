import React, { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function LogTableField({ field }) {
  const { register, control, watch, setValue } = useFormContext();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: field.id
  });

  // Initialize or Repair rows if prefill is defined
  useEffect(() => {
    if (field.prefillRows && field.prefillRows.length > 0) {
      // If the current field data doesn't match the expected prefill length,
      // it means we likely have old/bad data (e.g. from previous manual testing).
      // In "Scheduled Mode" (prefillRows exists), we strictly enforce the row structure.
      if (fields.length !== field.prefillRows.length) {
        console.warn(`Repairing LogTable ${field.id}: Expected ${field.prefillRows.length} rows, found ${fields.length}. Resetting to template.`);
        replace(field.prefillRows);
      }
    }
  }, [field.prefillRows, replace, fields.length]);

  const handleTimestamp = (index) => {
    const now = new Date();
    setValue(`${field.id}.${index}._timestamp`, now.toISOString());
    // Also set "isLate" if scheduledTime exists
    const row = fields[index];
    if (row && row.scheduledTime) {
      // Simple heuristic: if now is > 1 hour past scheduled time (assuming scheduledTime is HH:00 format contextually)
      // For now, we just log the time.
    }
  };

  // Handle computed columns logic
  const handleFieldChange = (index, colKey, val) => {
    // If this column drives computation
    const row = fields[index];
    // We can't easily access the latest value of *other* fields here inside standard loop easily without watch.
    // But we can check if *any* column has a 'computed' property dependent on this one.

    // Better approach: Iterate all columns, if any has `computed` function, run it.
    // However, functions can't be passed easily in JSON config.
    // So we will support a specific "computedFrom" logic string or hardcode for now?
    // User asked for specific "500kg -> 10 bags".
    // Let's implement a generic "computed" property in column config:
    // computed: { operation: 'divide', source: 'actualOutput', factor: 50 }

    // Let's implement this logic:
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
    });
  };

  const columns = field.columns || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{field.label}</label>
      </div>

      <div className="border rounded-md overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((col) => (
                <TableHead key={col.key} className="text-xs uppercase text-gray-500 font-semibold">{col.label}</TableHead>
              ))}
              <TableHead className="w-[100px]">Log Time</TableHead>
              {!field.prefillRows && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((item, index) => {
              // Check if entry is late (if scheduledTime exists)
              // This logic assumes scheduledTime is like "08:00"
              const timestamp = watch(`${field.id}.${index}._timestamp`);

              return (
                <TableRow key={item.id}>
                  {columns.map((col) => (
                    <TableCell key={`${item.id}-${col.key}`}>
                      {col.readOnly ? (
                        <Input
                          {...register(`${field.id}.${index}.${col.key}`)}
                          readOnly
                          className="h-8 text-xs bg-gray-50"
                        />
                      ) : (
                        <Input
                          {...register(`${field.id}.${index}.${col.key}`)}
                          placeholder={col.placeholder}
                          type={col.type || 'text'}
                          className="h-8 text-xs"
                          onBlur={(e) => {
                            handleTimestamp(index);
                            handleFieldChange(index, col.key, e.target.value);
                          }}
                        />
                      )}
                    </TableCell>
                  ))}

                  {/* Timestamp & Status Column */}
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

      {!field.prefillRows && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({})}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Row
        </Button>
      )}
    </div>
  );
}
