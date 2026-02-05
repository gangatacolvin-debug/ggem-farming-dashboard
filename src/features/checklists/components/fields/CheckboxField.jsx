import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function CheckboxField({ field }) {
    const { control } = useFormContext();

    return (
        <div className="flex items-center space-x-2">
            <Controller
                name={field.id}
                control={control}
                defaultValue={false}
                render={({ field: { onChange, value } }) => (
                    <Checkbox
                        id={field.id}
                        checked={value}
                        onCheckedChange={onChange}
                    />
                )}
            />
            <Label htmlFor={field.id}>
                {field.label}
            </Label>
        </div>
    );
}
