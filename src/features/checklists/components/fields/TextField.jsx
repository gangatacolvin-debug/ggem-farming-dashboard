import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TextField({ field }) {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="space-y-2">
            <Label htmlFor={field.id}>
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
                id={field.id}
                placeholder={field.placeholder}
                {...register(field.id, { required: field.required })}
                className={errors[field.id] ? "border-red-500" : ""}
            />
            {errors[field.id] && (
                <p className="text-sm text-red-500">{field.label} is required</p>
            )}
        </div>
    );
}
