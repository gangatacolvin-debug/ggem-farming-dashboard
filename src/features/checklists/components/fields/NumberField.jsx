import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

export default function NumberField({ field }) {
    const { register, control } = useFormContext();
    const value = useWatch({
        control,
        name: field.id
    });

    const min = field.validation?.min;
    const max = field.validation?.max;

    let warning = null;
    if (value && min !== undefined && Number(value) < min) {
        warning = `Value is below recommended minimum (${min})`;
    }
    if (value && max !== undefined && Number(value) > max) {
        warning = `Value is above recommended maximum (${max})`;
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
                id={field.id}
                type="number"
                step="any"
                placeholder={field.placeholder}
                {...register(field.id, {
                    valueAsNumber: true,
                    required: field.required
                })}
                className={warning ? "border-orange-300 focus-visible:ring-orange-300 bg-orange-50" : ""}
            />
            {warning && (
                <div className="flex items-center gap-1 text-xs text-orange-600 font-medium animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3 h-3" />
                    {warning}
                </div>
            )}
        </div>
    );
}
