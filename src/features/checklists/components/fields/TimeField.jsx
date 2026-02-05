import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function TimeField({ field }) {
    const { register } = useFormContext();

    return (
        <div className="space-y-2">
            <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
                id={field.id}
                type="time"
                placeholder={field.placeholder}
                {...register(field.id, {
                    required: field.required,
                    ...field.validation
                })}
            />
            {field.helperText && (
                <p className="text-sm text-gray-500">{field.helperText}</p>
            )}
        </div>
    );
}