import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function SummaryField({ field, checklistType }) {
    const { control } = useFormContext();

    // Watch all relevant fields for calculation
    const hourlyLogs = useWatch({ control, name: 'hourlyLogs' }) || [];
    const qualityLogs = useWatch({ control, name: 'qualityLogs' }) || [];

    // Hub Collection Specific Watches
    const bagsLoaded = useWatch({ control, name: 'bags-loaded' });
    const bagsOffloaded = useWatch({ control, name: 'bags-offloaded' });
    const weightLoaded = useWatch({ control, name: 'total-weight' });
    const weightOffloaded = useWatch({ control, name: 'weight-offloaded' });
    const handlingLosses = useWatch({ control, name: 'handling-losses' });
    const damagedBags = useWatch({ control, name: 'damaged-bags-count' });


    // Helper to safely parse numbers
    const safeParse = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    if (checklistType === 'hub-collection-offloading') {
        const bagsDiff = safeParse(bagsOffloaded) - safeParse(bagsLoaded);
        const weightDiff = safeParse(weightOffloaded) - safeParse(weightLoaded);
        const lossPercentage = weightLoaded > 0 ? (Math.abs(weightDiff) / weightLoaded) * 100 : 0;

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Trip Performance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Weight Variance</Label>
                            <p className={`text-2xl font-bold ${weightDiff < -50 ? 'text-red-600' : 'text-green-600'}`}>
                                {weightDiff.toFixed(2)} kg
                            </p>
                            <p className="text-xs text-slate-400">
                                Loaded: {weightLoaded || 0}kg vs Offloaded: {weightOffloaded || 0}kg
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Bags Variance</Label>
                            <p className={`text-2xl font-bold ${bagsDiff !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {bagsDiff} bags
                            </p>
                            <p className="text-xs text-slate-400">
                                Loaded: {bagsLoaded || 0} vs Offloaded: {bagsOffloaded || 0}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Handling Losses</Label>
                            <p className="text-2xl font-bold text-orange-600">{handlingLosses || 0} kg</p>
                            <p className="text-xs text-slate-400">
                                Recorded Spillage/loss
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Damaged Bags</Label>
                            <p className={`text-xl font-bold ${safeParse(damagedBags) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {damagedBags || 0}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // DEFAULT (Briquette Production)
    // Calculations for Briquette
    const totalOutput = hourlyLogs.reduce((sum, log) => sum + safeParse(log.actualOutput), 0);
    const totalHuskUsed = hourlyLogs.reduce((sum, log) => sum + safeParse(log.rawHuskUsed), 0);
    const totalFuel = hourlyLogs.reduce((sum, log) => sum + safeParse(log.fuelConsumption), 0);
    const totalDowntime = hourlyLogs.reduce((sum, log) => sum + safeParse(log.downtime), 0);

    const fuelEfficiency = totalFuel > 0 ? (totalOutput / totalFuel).toFixed(2) : '0.00';
    const huskEfficiency = totalHuskUsed > 0 ? (totalOutput / totalHuskUsed).toFixed(2) : '0.00';

    const avgAsh = qualityLogs.length > 0
        ? (qualityLogs.reduce((sum, log) => sum + safeParse(log.ashContent), 0) / qualityLogs.length).toFixed(2)
        : '0.00';

    const avgCalorific = qualityLogs.length > 0
        ? (qualityLogs.reduce((sum, log) => sum + safeParse(log.calorificValue), 0) / qualityLogs.length).toFixed(2)
        : '0.00';

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Real-time Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-50">
                    <CardContent className="p-4">
                        <Label className="text-xs text-slate-500 uppercase">Total Output</Label>
                        <p className="text-2xl font-bold text-primary">{totalOutput} kg</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50">
                    <CardContent className="p-4">
                        <Label className="text-xs text-slate-500 uppercase">Husk Efficiency</Label>
                        <p className="text-2xl font-bold text-green-600">{huskEfficiency}</p>
                        <p className="text-xs text-slate-400">Target: {'>'} 0.90</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50">
                    <CardContent className="p-4">
                        <Label className="text-xs text-slate-500 uppercase">Fuel Efficiency</Label>
                        <p className="text-2xl font-bold text-green-600">{fuelEfficiency} kg/L</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50">
                    <CardContent className="p-4">
                        <Label className="text-xs text-slate-500 uppercase">Total Downtime</Label>
                        <p className="text-2xl font-bold text-red-600">{totalDowntime} mins</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50">
                    <CardContent className="p-4">
                        <Label className="text-xs text-slate-500 uppercase">Avg Ash Content</Label>
                        <p className="text-xl font-bold">{avgAsh}%</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50">
                    <CardContent className="p-4">
                        <Label className="text-xs text-slate-500 uppercase">Avg Calorific Value</Label>
                        <p className="text-xl font-bold">{avgCalorific} MJ/kg</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
