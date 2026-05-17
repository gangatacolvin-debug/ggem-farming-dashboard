import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Activity, Beaker, Clock, Eye, Scale, Target, Layers, Download } from 'lucide-react';
import { SubmissionReadOnlyView } from '@/pages/supervisor/TaskDetail';
import * as XLSX from 'xlsx';

const KPICard = ({ title, value, subtext, icon: Icon, colorClass = 'text-blue-600', bgColorClass = 'bg-blue-100' }) => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold mt-1">{value}</h3>
                    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-full ${bgColorClass}`}>
                    <Icon className={`w-6 h-6 ${colorClass}`} />
                </div>
            </div>
        </CardContent>
    </Card>
);

const YieldBadge = ({ value, threshold = 65 }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${Number(value) >= threshold ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
        {value}%
    </span>
);

const StatusBadge = ({ status }) => {
    const s = String(status || 'pending').toLowerCase();
    const styles = {
        approved: 'bg-green-100 text-green-700',
        completed: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        pending: 'bg-orange-100 text-orange-700',
        flagged: 'bg-yellow-100 text-yellow-800',
        'in-progress': 'bg-blue-100 text-blue-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[s] || 'bg-gray-100 text-gray-600'}`}>
            {s.replace(/-/g, ' ')}
        </span>
    );
};

function normalizeChecklistTypeForView(checklistType) {
    if (checklistType === 'milling-process') return 'milling';
    return checklistType;
}

/**
 * Apply formatting to a worksheet
 */
function applyWorksheetFormatting(worksheet, headerRow, options = {}) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const { 
        statusCol = -1, 
        recoveryCol = -1, 
        breakageCol = -1, 
        downtimeCol = -1,
        isVarietySheet = false 
    } = options;
    
    for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!worksheet[cellRef]) continue;
            
            // Initialize cell style if not exists
            if (!worksheet[cellRef].s) worksheet[cellRef].s = {};

            // Title row (R=0)
            if (R === 0) {
                worksheet[cellRef].s = {
                    font: { bold: true, sz: 14, color: { rgb: '1F2937' } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                };
            }
            
            // Header row
            if (R === headerRow) {
                worksheet[cellRef].s = {
                    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: '374151' } },
                    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                    border: {
                        top: { style: 'thin', color: { rgb: 'D1D5DB' } },
                        bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
                        left: { style: 'thin', color: { rgb: 'D1D5DB' } },
                        right: { style: 'thin', color: { rgb: 'D1D5DB' } },
                    },
                };
            }

            // Data rows
            if (R > headerRow) {
                // Apply default border to all data cells
                const defaultStyle = {
                    border: {
                        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                        right: { style: 'thin', color: { rgb: 'E5E7EB' } },
                    },
                };

                // Recovery % column (green/red based on target)
                if (C === recoveryCol) {
                    const value = worksheet[cellRef].v;
                    const isAboveTarget = Number(value) >= 65;
                    worksheet[cellRef].s = {
                        ...defaultStyle,
                        font: {
                            color: { rgb: isAboveTarget ? '059669' : 'DC2626' },
                            bold: true,
                        },
                        alignment: { horizontal: 'center' },
                        fill: {
                            fgColor: { rgb: isAboveTarget ? 'ECFDF5' : 'FEF2F2' },
                        },
                    };
                }
                // Breakage column
                else if (C === breakageCol) {
                    worksheet[cellRef].s = {
                        ...defaultStyle,
                        alignment: { horizontal: 'center' },
                    };
                }
                // Downtime column (red if > 0, gray if 0)
                else if (C === downtimeCol && downtimeCol !== -1) {
                    const downtimeValue = worksheet[cellRef].v;
                    if (downtimeValue > 0) {
                        worksheet[cellRef].s = {
                            ...defaultStyle,
                            font: { color: { rgb: 'DC2626' }, bold: true },
                            alignment: { horizontal: 'center' },
                            fill: { fgColor: { rgb: 'FEF2F2' } },
                        };
                    } else {
                        worksheet[cellRef].s = {
                            ...defaultStyle,
                            font: { color: { rgb: '9CA3AF' } },
                            alignment: { horizontal: 'center' },
                        };
                    }
                }
                // Status column (color coded)
                else if (C === statusCol && statusCol !== -1) {
                    const statusValue = String(worksheet[cellRef].v || '').toLowerCase();
                    let statusColor = '6B7280'; // gray default
                    if (statusValue === 'approved' || statusValue === 'completed') statusColor = '059669';
                    else if (statusValue === 'rejected') statusColor = 'DC2626';
                    else if (statusValue === 'pending') statusColor = 'EA580C';
                    else if (statusValue === 'flagged') statusColor = 'CA8A04';
                    else if (statusValue === 'in progress') statusColor = '2563EB';
                    
                    worksheet[cellRef].s = {
                        ...defaultStyle,
                        font: { bold: true, color: { rgb: statusColor } },
                        alignment: { horizontal: 'center' },
                    };
                }
                // Default styling for other cells
                else {
                    worksheet[cellRef].s = {
                        ...defaultStyle,
                        alignment: { 
                            horizontal: (isVarietySheet && C > 0) || (!isVarietySheet && C > 3) ? 'center' : 'left' 
                        },
                    };
                }
            }
        }
    }
}

/**
 * Generate Excel workbook with proper formatting
 */
function generateExcelReport(data) {
    const {
        totalPaddy = 0,
        totalMilled = 0,
        totalBroken = 0,
        totalHuskBran = 0,
        totalDowntime = 0,
        overallYield = 0,
        overallBreakage = 0,
        shiftRows = [],
        varietySummary = [],
    } = data;

    const wb = XLSX.utils.book_new();

    // ===== Sheet 1: Summary KPI =====
    const summaryData = [
        ['MILLING PERFORMANCE REPORT'],
        [''],
        ['KEY PERFORMANCE INDICATORS'],
        ['Metric', 'Value', 'Unit', 'Notes'],
        ['Total Paddy Fed', (totalPaddy / 1000).toFixed(2), 'kg (thousands)', 'Total paddy processed'],
        ['Total Milled Rice', (totalMilled / 1000).toFixed(2), 'kg (thousands)', 'Total milled rice output'],
        ['Overall Recovery', `${overallYield}%`, '%', `Target: 65% - ${overallYield >= 65 ? 'ABOVE TARGET' : 'BELOW TARGET'}`],
        ['Breakage Rate', `${overallBreakage}%`, '%', 'Percentage of paddy fed'],
        ['Husk & Bran', (totalHuskBran / 1000).toFixed(2), 'kg (thousands)', 'Residual output'],
        ['Total Downtime', (totalDowntime / 60).toFixed(1), 'hours', 'Across all shifts'],
        ['Total Records', shiftRows.length, 'records', 'Number of milling submissions'],
        [''],
        ['Generated on', new Date().toLocaleString(), '', ''],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Set column widths
    wsSummary['!cols'] = [
        { wch: 25 }, // Metric
        { wch: 15 }, // Value
        { wch: 18 }, // Unit
        { wch: 30 }, // Notes
    ];

    // Merge title cells
    wsSummary['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Title
    ];

    // Apply formatting to summary sheet
    applyWorksheetFormatting(wsSummary, 3);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'KPI Summary');

    // ===== Sheet 2: Variety Performance =====
    if (varietySummary.length > 0) {
        const varietyData = [
            ['PERFORMANCE BY VARIETY'],
            [''],
            ['Variety', 'Paddy Fed (kg)', 'Milled (kg)', 'Broken (kg)', 'Recovery %', 'Breakage %', 'Status'],
        ];

        varietySummary.forEach((v) => {
            varietyData.push([
                v.label,
                v.paddy,
                v.milled,
                v.broken,
                v.yield,
                v.breakage,
                Number(v.yield) >= 65 ? 'Above Target (≥65%)' : 'Below Target (<65%)',
            ]);
        });

        // Add totals row
        varietyData.push([
            'TOTAL',
            varietySummary.reduce((sum, v) => sum + v.paddy, 0),
            varietySummary.reduce((sum, v) => sum + v.milled, 0),
            varietySummary.reduce((sum, v) => sum + v.broken, 0),
            overallYield,
            overallBreakage,
            '',
        ]);

        const wsVariety = XLSX.utils.aoa_to_sheet(varietyData);
        wsVariety['!cols'] = [
            { wch: 20 }, // Variety
            { wch: 16 }, // Paddy Fed
            { wch: 14 }, // Milled
            { wch: 14 }, // Broken
            { wch: 14 }, // Recovery %
            { wch: 14 }, // Breakage %
            { wch: 25 }, // Status
        ];
        wsVariety['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        ];

        // Apply formatting to variety sheet
        applyWorksheetFormatting(wsVariety, 2, {
            recoveryCol: 4,
            breakageCol: 5,
            isVarietySheet: true,
        });

        XLSX.utils.book_append_sheet(wb, wsVariety, 'Variety Performance');
    }

    // ===== Sheet 3: Shift Records =====
    const shiftHeaders = [
        'Status',
        'Date',
        'Shift',
        'Variety',
        'Supervisor',
        'Paddy (kg)',
        'Milled (kg)',
        'Broken (kg)',
        'Recovery %',
        'Breakage %',
        'Downtime (min)',
        'Submission ID',
    ];

    const shiftData = [['MILLING SHIFT RECORDS'], [''], shiftHeaders];

    shiftRows.forEach((row) => {
        const status = String(row.status || 'pending').toLowerCase().replace(/-/g, ' ');
        const statusCapitalized = status.charAt(0).toUpperCase() + status.slice(1);
        
        shiftData.push([
            statusCapitalized,
            row.date,
            row.shift.charAt(0).toUpperCase() + row.shift.slice(1),
            row.variety.charAt(0).toUpperCase() + row.variety.slice(1),
            row.supervisorName,
            row.paddy,
            row.milled,
            row.broken,
            row.yield,
            row.breakage,
            row.downtime > 0 ? row.downtime : 0,
            row.submissionId || 'N/A',
        ]);
    });

    const wsShifts = XLSX.utils.aoa_to_sheet(shiftData);
    wsShifts['!cols'] = [
        { wch: 14 }, // Status
        { wch: 12 }, // Date
        { wch: 10 }, // Shift
        { wch: 18 }, // Variety
        { wch: 18 }, // Supervisor
        { wch: 14 }, // Paddy
        { wch: 14 }, // Milled
        { wch: 14 }, // Broken
        { wch: 14 }, // Recovery
        { wch: 14 }, // Breakage
        { wch: 16 }, // Downtime
        { wch: 25 }, // Submission ID
    ];
    wsShifts['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
    ];

    // Apply formatting to shifts sheet
    applyWorksheetFormatting(wsShifts, 2, {
        statusCol: 0,
        recoveryCol: 8,
        breakageCol: 9,
        downtimeCol: 10,
    });

    XLSX.utils.book_append_sheet(wb, wsShifts, 'Shift Records');

    return wb;
}

/**
 * @param {{ data?: object, submissions?: object[] }} props
 */
export default function MillingTab({ data = {}, submissions = [] }) {
    const {
        totalPaddy = 0,
        totalMilled = 0,
        totalBroken = 0,
        totalHuskBran = 0,
        totalDowntime = 0,
        overallYield = 0,
        overallBreakage = 0,
        shiftRows = [],
        varietySummary = [],
    } = data;

    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    const submissionById = useMemo(() => {
        const map = new Map();
        submissions.forEach((s) => {
            if (s?.id) map.set(s.id, s);
        });
        return map;
    }, [submissions]);

    const downtimeHrs = (totalDowntime / 60).toFixed(1);
    const recordCount = shiftRows.length;

    const openDetail = (row) => {
        const doc = submissionById.get(row.submissionId);
        if (!doc) return;
        setSelectedSubmission(doc);
        setDetailOpen(true);
    };

    const handleDownloadExcel = () => {
        const wb = generateExcelReport(data);
        const fileName = `Milling_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const taskMeta = selectedSubmission
        ? {
            checklistType: normalizeChecklistTypeForView(selectedSubmission.checklistType),
            checklistName: 'Milling Checklist',
        }
        : null;

    return (
        <div className="space-y-6">
            {/* Download Button */}
            <div className="flex justify-end">
                <Button 
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                    <Download className="w-4 h-4" />
                    Download Excel Report
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard title="Total Paddy Fed" value={`${(totalPaddy / 1000).toFixed(2)}k`} subtext="kg processed" icon={Scale} />
                <KPICard title="Total Milled Rice" value={`${(totalMilled / 1000).toFixed(2)}k`} subtext="kg output" icon={Activity} colorClass="text-green-600" bgColorClass="bg-green-100" />
                <KPICard title="Overall Recovery" value={`${overallYield}%`} subtext="Target: 65%" icon={Target} colorClass={overallYield >= 65 ? 'text-green-600' : 'text-red-600'} bgColorClass={overallYield >= 65 ? 'bg-green-100' : 'bg-red-100'} />
                <KPICard title="Breakage Rate" value={`${overallBreakage}%`} subtext="of paddy fed" icon={Beaker} colorClass="text-orange-600" bgColorClass="bg-orange-100" />
                <KPICard title="Husk & Bran" value={`${(totalHuskBran / 1000).toFixed(2)}k`} subtext="kg residual output" icon={Layers} colorClass="text-gray-600" bgColorClass="bg-gray-100" />
                <KPICard title="Total Downtime" value={`${downtimeHrs} hrs`} subtext="Across all shifts" icon={Clock} colorClass="text-red-600" bgColorClass="bg-red-100" />
            </div>

            {varietySummary.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Performance by Variety</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Variety</th>
                                        <th className="px-4 py-3 font-medium text-right">Paddy Fed (kg)</th>
                                        <th className="px-4 py-3 font-medium text-right">Milled (kg)</th>
                                        <th className="px-4 py-3 font-medium text-right">Broken (kg)</th>
                                        <th className="px-4 py-3 font-medium text-right">Recovery %</th>
                                        <th className="px-4 py-3 font-medium text-right">Breakage %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {varietySummary.map((v) => (
                                        <tr key={v.variety} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{v.label}</td>
                                            <td className="px-4 py-3 text-right">{v.paddy.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">{v.milled.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">{v.broken.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right"><YieldBadge value={v.yield} /></td>
                                            <td className="px-4 py-3 text-right">{v.breakage}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle>Milling submissions</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            {recordCount} record{recordCount !== 1 ? 's' : ''} — click a row to view the full checklist
                        </p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium w-10"></th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Shift</th>
                                    <th className="px-4 py-3 font-medium">Variety</th>
                                    <th className="px-4 py-3 font-medium">Supervisor</th>
                                    <th className="px-4 py-3 font-medium text-right">Paddy (kg)</th>
                                    <th className="px-4 py-3 font-medium text-right">Milled (kg)</th>
                                    <th className="px-4 py-3 font-medium text-right">Broken (kg)</th>
                                    <th className="px-4 py-3 font-medium text-right">Recovery %</th>
                                    <th className="px-4 py-3 font-medium text-right">Breakage %</th>
                                    <th className="px-4 py-3 font-medium text-right">Downtime (min)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shiftRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="px-4 py-6 text-center text-sm text-gray-400">
                                            No milling submissions yet.
                                        </td>
                                    </tr>
                                ) : (
                                    shiftRows.map((row) => {
                                        const canView = submissionById.has(row.submissionId);
                                        return (
                                            <tr
                                                key={row.submissionId || `${row.date}-${row.shift}-${row.paddy}`}
                                                className={`border-b ${canView ? 'hover:bg-blue-50/60 cursor-pointer' : 'hover:bg-gray-50'}`}
                                                onClick={() => canView && openDetail(row)}
                                            >
                                                <td className="px-4 py-3">
                                                    {canView && (
                                                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); openDetail(row); }}>
                                                            <Eye className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                                                <td className="px-4 py-3 text-gray-500">{row.date}</td>
                                                <td className="px-4 py-3 font-medium capitalize">{row.shift}</td>
                                                <td className="px-4 py-3 capitalize">{row.variety}</td>
                                                <td className="px-4 py-3 text-gray-500">{row.supervisorName}</td>
                                                <td className="px-4 py-3 text-right">{row.paddy.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right">{row.milled.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right">{row.broken.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right"><YieldBadge value={row.yield} /></td>
                                                <td className="px-4 py-3 text-right">{row.breakage}%</td>
                                                <td className={`px-4 py-3 text-right ${row.downtime > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                                                    {row.downtime > 0 ? row.downtime : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Milling checklist — full submission</DialogTitle>
                    </DialogHeader>
                    {selectedSubmission && taskMeta && (
                        <SubmissionReadOnlyView task={taskMeta} submission={selectedSubmission} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}