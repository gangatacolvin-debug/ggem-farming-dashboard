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

    // Outreach & Engagement Specific Watches
    const sessionsHeld = useWatch({ control, name: 'sessions-held-count' });
    const participantsReached = useWatch({ control, name: 'participants-reached' });
    const newGroups = useWatch({ control, name: 'new-groups' });
    const womenParticipants = useWatch({ control, name: 'women-participants' });

    // Sales & Marketing Specific Watches
    const salesVolume = useWatch({ control, name: 'sales-volume-units' });
    const salesValue = useWatch({ control, name: 'sales-value-mwk' });
    const customerVisits = useWatch({ control, name: 'customer-visits-count' });
    const leadsConverted = useWatch({ control, name: 'leads-converted-count' });

    // Field Monitoring & QA Watches
    const sitesVisitedCount = useWatch({ control, name: 'sites-visited-count' });
    const spotChecksCount = useWatch({ control, name: 'spot-checks-count' });
    const dataAccuracyPct = useWatch({ control, name: 'data-accuracy-pct' });

    // Data & Call Centre Watches 
    const activeAgentsCount = useWatch({ control, name: 'active-agents-count' });
    const callsMadeCount = useWatch({ control, name: 'calls-made-count' });
    const farmersReachedCount = useWatch({ control, name: 'farmers-reached-count' });
    const verifiedEntriesPct = useWatch({ control, name: 'verified-entries-pct' });

    // Shared Watches across Field Monitoring & Call Centre
    const issuesFlaggedCount = useWatch({ control, name: 'issues-flagged-count' });
    const issuesResolvedCount = useWatch({ control, name: 'issues-resolved-count' });

    // Aggregation Specific Watches
    const aggExpectedFarmers = useWatch({ control, name: 'expected-farmers' });
    const aggTotalStaffCount = useWatch({ control, name: 'total-staff-count' });
    const aggMoistureLogs = useWatch({ control, name: 'moisture-grading-logs' }) || [];
    const aggBatchesRejected = useWatch({ control, name: 'batches-rejected-count' });
    const aggBatchesDowngraded = useWatch({ control, name: 'batches-downgraded-count' });
    const aggTotalFarmersWeighed = useWatch({ control, name: 'total-farmers-weighed' });
    const aggTotalWeightKg = useWatch({ control, name: 'total-weight-kg' });
    const aggTotalGrossAmount = useWatch({ control, name: 'total-gross-amount' });
    const aggReversalsDone = useWatch({ control, name: 'reversals-done' });
    const aggTotalBagsReceived = useWatch({ control, name: 'total-bags-received' });
    const aggTotalWeightReceivedKg = useWatch({ control, name: 'total-weight-received-kg' });
    const aggTotalBagsRejected = useWatch({ control, name: 'total-bags-rejected' });
    const aggDamagedBagsCount = useWatch({ control, name: 'damaged-bags-count' });
    const aggFarmersAttendedToday = useWatch({ control, name: 'farmers-attended-today' });
    const aggTotalBagsToday = useWatch({ control, name: 'total-bags-today' });
    const aggTotalWeightTodayKg = useWatch({ control, name: 'total-weight-today-kg' });
    const aggIsFinalDay = useWatch({ control, name: 'is-final-day' });

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

    if (checklistType === 'outreach-engagement') {
        const sessions = safeParse(sessionsHeld);
        const participants = safeParse(participantsReached);
        const groups = safeParse(newGroups);
        const women = safeParse(womenParticipants);

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                    Outreach & Engagement Real-time Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Sessions Held</Label>
                            <p className="text-2xl font-bold text-primary">{sessions}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Participants Reached</Label>
                            <p className="text-2xl font-bold text-green-600">{participants}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">New Groups Identified</Label>
                            <p className="text-2xl font-bold text-blue-600">{groups}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Women Participants</Label>
                            <p className="text-2xl font-bold text-primary">{women}%</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (checklistType === 'sales-marketing') {
        const parsedVolume = safeParse(salesVolume);
        const parsedValue = safeParse(salesValue);
        const parsedVisits = safeParse(customerVisits);
        const parsedLeads = safeParse(leadsConverted);

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Sales & Marketing Real-time Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Visits</Label>
                            <p className="text-2xl font-bold text-primary">{parsedVisits}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Sales Volume</Label>
                            <p className="text-2xl font-bold text-green-600">{parsedVolume}</p>
                            <p className="text-xs text-slate-400">units/kg</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Sales Value</Label>
                            <p className="text-2xl font-bold text-green-600">MWK {parsedValue.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Leads Converted</Label>
                            <p className="text-2xl font-bold text-blue-600">{parsedLeads}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (checklistType === 'field-monitoring-qa') {
        const sites = safeParse(sitesVisitedCount);
        const spots = safeParse(spotChecksCount);
        const flagged = safeParse(issuesFlaggedCount);
        const resolved = safeParse(issuesResolvedCount);

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Field Monitoring & QA Real-time Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Sites Visited</Label>
                            <p className="text-2xl font-bold text-primary">{sites}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Spot Checks</Label>
                            <p className="text-2xl font-bold text-blue-600">{spots}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Issues Flagged</Label>
                            <p className="text-2xl font-bold text-orange-600">{flagged}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Issues Resolved</Label>
                            <p className="text-2xl font-bold text-green-600">{resolved}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (checklistType === 'data-callcentre-oversight') {
        const activeAgents = safeParse(activeAgentsCount);
        const callsMade = safeParse(callsMadeCount);
        const farmersReached = safeParse(farmersReachedCount);
        const verifiedEntries = safeParse(verifiedEntriesPct);

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Data & Call Centre Real-time Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Active Agents</Label>
                            <p className="text-2xl font-bold text-primary">{activeAgents}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Calls Made</Label>
                            <p className="text-2xl font-bold text-blue-600">{callsMade}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Farmers Reached</Label>
                            <p className="text-2xl font-bold text-green-600">{farmersReached}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Data Accuracy</Label>
                            <p className="text-2xl font-bold text-primary">{verifiedEntries}%</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (checklistType === 'pre-aggregation-setup') {
        const expectedFarmers = safeParse(aggExpectedFarmers);
        const totalStaff = safeParse(aggTotalStaffCount);

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Pre-Aggregation Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Expected Farmers</Label>
                            <p className="text-2xl font-bold text-primary">{expectedFarmers}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Total Staff</Label>
                            <p className="text-2xl font-bold text-blue-600">{totalStaff}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (checklistType === 'aggregation-quality-control') {
        const totalTests = aggMoistureLogs.length;
        const rejected = safeParse(aggBatchesRejected);
        const downgraded = safeParse(aggBatchesDowngraded);

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Quality Control Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Total Tests</Label>
                            <p className="text-2xl font-bold text-primary">{totalTests}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Batches Rejected</Label>
                            <p className="text-2xl font-bold text-red-600">{rejected}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Batches Downgraded</Label>
                            <p className="text-2xl font-bold text-orange-600">{downgraded}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (checklistType === 'aggregation-weighing-recording') {
        const logs = useWatch({ control, name: 'farmer-weighing-logs' }) || [];
        
        const farmersWeighed = logs.length;
        const totalWeight = logs.reduce((sum, row) => sum + safeParse(row.weightKg), 0);
        const totalGross = logs.reduce((sum, row) => sum + safeParse(row.grossAmount), 0);

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Weighing & Recording Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Farmers Weighed</Label>
                            <p className="text-2xl font-bold text-primary">{farmersWeighed}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Total Weight</Label>
                            <p className="text-2xl font-bold text-green-600">{totalWeight} kg</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Gross Amount</Label>
                            <p className="text-2xl font-bold text-blue-600">MWK {totalGross.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Reversals Done</Label>
                            <p className={`text-xl font-bold ${aggReversalsDone ? 'text-red-600' : 'text-slate-600'}`}>
                                {aggReversalsDone ? 'Yes' : 'No'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (checklistType === 'aggregation-warehouse-receiving') {
        const bagsReceived = safeParse(aggTotalBagsReceived);
        const weightReceived = safeParse(aggTotalWeightReceivedKg);
        const bagsRejected = safeParse(aggTotalBagsRejected);
        const damagedBags = safeParse(aggDamagedBagsCount);

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Warehouse Receiving Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Bags Received</Label>
                            <p className="text-2xl font-bold text-primary">{bagsReceived}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Weight Received</Label>
                            <p className="text-2xl font-bold text-green-600">{weightReceived} kg</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Bags Rejected</Label>
                            <p className="text-2xl font-bold text-orange-600">{bagsRejected}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Damaged Bags</Label>
                            <p className={`text-xl font-bold ${damagedBags > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {damagedBags}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (checklistType === 'aggregation-end-of-day') {
        const farmersAttended = safeParse(aggFarmersAttendedToday);
        const totalBags = safeParse(aggTotalBagsToday);
        const totalWeight = safeParse(aggTotalWeightTodayKg);

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">End of Day Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Farmers Attended</Label>
                            <p className="text-2xl font-bold text-primary">{farmersAttended}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Bags Received</Label>
                            <p className="text-2xl font-bold text-primary">{totalBags}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Weight Received</Label>
                            <p className="text-2xl font-bold text-green-600">{totalWeight} kg</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50">
                        <CardContent className="p-4">
                            <Label className="text-xs text-slate-500 uppercase">Final Day Status</Label>
                            <p className="text-xl font-bold text-blue-600">
                                {aggIsFinalDay === 'yes' ? 'Yes - Close' : 'No - Continues'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
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
