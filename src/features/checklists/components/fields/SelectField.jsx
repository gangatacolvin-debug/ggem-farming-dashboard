import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SelectField({ field }) {
    const { setValue, watch } = useFormContext();
    const value = watch(field.id);

    return (
        <div className="space-y-2">
            <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
                value={value || ''}
                onValueChange={(val) => setValue(field.id, val)}
            >
                <SelectTrigger id={field.id}>
                    <SelectValue placeholder={field.placeholder || 'Select option'} />
                </SelectTrigger>
                <SelectContent>
                    {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {field.helperText && (
                <p className="text-sm text-gray-500">{field.helperText}</p>
            )}
        </div>
    );
}
