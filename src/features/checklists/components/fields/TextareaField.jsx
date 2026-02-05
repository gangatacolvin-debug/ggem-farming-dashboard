import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const TextareaField = ({ field }) => {
    const { register } = useFormContext();

    return (
        <div className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium text-gray-900">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
                id={field.id}
                placeholder={field.placeholder}
                className="min-h-[100px]"
                {...register(field.id, { required: field.required })}
                readOnly={field.readOnly}
            />
        </div>
    );
};

export default TextareaField;
