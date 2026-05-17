import React, { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const fmt2 = (val) =>
    isFinite(val) && val !== '' ? Math.round(val * 100) / 100 : 0;

const VARIETY_LABELS = {
    kayanjamalo: 'Kayanjamalo',
    kilombero: 'Kilombero',
};

/**
 * Evaluate a simple KPI formula string like "milledRice / paddyFed * 100"
 * against a totals object. Returns a formatted number or '—'.
 */
const evalKpi = (formula, totals) => {
    try {
        // Replace key names with their numeric values
        const expr = formula.replace(/[a-zA-Z_]+/g, (key) =>
            totals[key] !== undefined ? totals[key] : 0
        );
        // eslint-disable-next-line no-eval
        const result = eval(expr);
        return isFinite(result) && result > 0 ? fmt2(result) : '—';
    } catch {
        return '—';
    }
};

// ─────────────────────────────────────────────
// Override Dialog
// ─────────────────────────────────────────────

function OverrideDialog({ open, onClose, fieldLabel, currentValue, onConfirm }) {
    const [value, setValue] = useState(currentValue ?? '');
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(value, reason);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Override: {fieldLabel}</DialogTitle>
                    <DialogDescription>
                        This value is calculated from hourly logs. Only override if there was a data entry error.
                        Your reason will be saved to the audit trail.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <Label>Corrected Value (kg)</Label>
                        <Input
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="mt-1"
                            min={0}
                            step="any"
                        />
                    </div>
                    <div>
                        <Label>
                            Reason for override <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            placeholder="e.g., Scale error on hour 3 — corrected after recount..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!reason.trim()}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        Confirm Override
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────
// MillingSummaryField
// ─────────────────────────────────────────────

/**
 * field.sourceField       – id of the hourlyLogs form field
 * field.totals            – array of { key, label, required }
 * field.kpis              – array of { key, label, formula }
 * field.varietyBreakdown  – boolean
 */
export default function MillingSummaryField({ field }) {
    const { watch, setValue } = useFormContext();

    const rows = watch(field.sourceField) || [];
    const overrides = watch(`${field.id}__overrides`) || {};

    // ── Compute totals from hourly log rows ────────────────────────────────
    const computedTotals = useMemo(() => {
        const totals = {};
        field.totals.forEach(({ key }) => {
            totals[key] = fmt2(
                rows.reduce((sum, row) => sum + (parseFloat(row[key]) || 0), 0)
            );
        });
        return totals;
    }, [rows, field.totals]);

    // ── Merge computed totals with any overrides ───────────────────────────
    const effectiveTotals = useMemo(() => {
        const merged = { ...computedTotals };
        Object.keys(overrides).forEach((key) => {
            if (overrides[key]?.value !== undefined) {
                merged[key] = parseFloat(overrides[key].value) || 0;
            }
        });
        return merged;
    }, [computedTotals, overrides]);

    // ── Variety breakdown ──────────────────────────────────────────────────
    const varietyTotals = useMemo(() => {
        if (!field.varietyBreakdown) return {};
        const breakdown = {};
        rows.forEach((row) => {
            const v = row.variety || 'unknown';
            if (!breakdown[v]) {
                breakdown[v] = { paddyFed: 0, milledRice: 0, brokenRice: 0 };
            }
            breakdown[v].paddyFed += parseFloat(row.paddyFed) || 0;
            breakdown[v].milledRice += parseFloat(row.milledRice) || 0;
            breakdown[v].brokenRice += parseFloat(row.brokenRice) || 0;
        });
        // Compute recovery/breakage per variety
        Object.keys(breakdown).forEach((v) => {
            const b = breakdown[v];
            b.recovery = b.paddyFed > 0 ? fmt2((b.milledRice / b.paddyFed) * 100) : '—';
            b.breakage = b.paddyFed > 0 ? fmt2((b.brokenRice / b.paddyFed) * 100) : '—';
            b.paddyFed = fmt2(b.paddyFed);
            b.milledRice = fmt2(b.milledRice);
            b.brokenRice = fmt2(b.brokenRice);
        });
        return breakdown;
    }, [rows, field.varietyBreakdown]);

    // ── Override dialog state ──────────────────────────────────────────────
    const [overrideTarget, setOverrideTarget] = useState(null); // { key, label }

    const handleOverrideConfirm = (value, reason) => {
        const updated = {
            ...overrides,
            [overrideTarget.key]: { value, reason, overriddenAt: new Date().toISOString() },
        };
        setValue(`${field.id}__overrides`, updated, { shouldDirty: true });
    };

    const clearOverride = (key) => {
        const updated = { ...overrides };
        delete updated[key];
        setValue(`${field.id}__overrides`, updated, { shouldDirty: true });
    };

    if (rows.length === 0) {
        return (
            <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                    No hourly log entries found. Complete Step 4 first — totals will appear here automatically.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">

            {/* ── Totals Table ───────────────────────────────────────────────── */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    Shift Totals
                    <Badge variant="outline" className="text-xs font-normal">
                        From {rows.length} hourly log{rows.length !== 1 ? 's' : ''}
                    </Badge>
                </h3>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-2 text-left text-gray-600 font-medium">Metric</th>
                                <th className="px-4 py-2 text-right text-gray-600 font-medium">Value</th>
                                <th className="px-4 py-2 text-center text-gray-600 font-medium w-28">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {field.totals.map(({ key, label }) => {
                                const computed = computedTotals[key];
                                const isOverridden = !!overrides[key];
                                const displayed = effectiveTotals[key];

                                return (
                                    <tr key={key} className="border-b border-gray-100 last:border-0">
                                        <td className="px-4 py-2.5 text-gray-700">{label}</td>
                                        <td className="px-4 py-2.5 text-right">
                                            <span className={`font-semibold ${isOverridden ? 'text-amber-700' : 'text-gray-900'}`}>
                                                {displayed}
                                            </span>
                                            {isOverridden && (
                                                <span className="ml-2 text-xs text-gray-400 line-through">{computed}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            {isOverridden ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                                                        Overridden
                                                    </Badge>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs text-gray-400 hover:text-red-500 h-6 px-1"
                                                        onClick={() => clearOverride(key)}
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs text-gray-400 hover:text-amber-600 h-7 px-2"
                                                    onClick={() => setOverrideTarget({ key, label })}
                                                >
                                                    <Pencil className="w-3 h-3 mr-1" />
                                                    Override
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Override reasons log */}
                {Object.keys(overrides).length > 0 && (
                    <div className="mt-2 space-y-1">
                        {Object.entries(overrides).map(([key, data]) => {
                            const totalDef = field.totals.find((t) => t.key === key);
                            return (
                                <p key={key} className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-1.5">
                                    <strong>{totalDef?.label || key}:</strong> "{data.reason}"
                                </p>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── KPIs ───────────────────────────────────────────────────────── */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Key Performance Indicators
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {field.kpis.map((kpi) => {
                        const value = evalKpi(kpi.formula, effectiveTotals);
                        const isGood =
                            kpi.key === 'yieldPct'
                                ? parseFloat(value) >= 60
                                : parseFloat(value) <= 10;

                        return (
                            <div
                                key={kpi.key}
                                className={`rounded-lg border p-4 text-center ${value === '—'
                                        ? 'border-gray-200 bg-gray-50'
                                        : isGood
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-red-200 bg-red-50'
                                    }`}
                            >
                                <div
                                    className={`text-2xl font-bold ${value === '—'
                                            ? 'text-gray-400'
                                            : isGood
                                                ? 'text-green-700'
                                                : 'text-red-700'
                                        }`}
                                >
                                    {value}{value !== '—' ? '%' : ''}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Variety Breakdown ──────────────────────────────────────────── */}
            {field.varietyBreakdown && Object.keys(varietyTotals).length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Breakdown by Variety</h3>
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Variety</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">Paddy (kg)</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">Milled (kg)</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">Broken (kg)</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">Recovery %</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">Breakage %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(varietyTotals).map(([variety, data], i) => (
                                    <tr key={variety} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <td className="px-4 py-2.5 font-medium text-gray-800">
                                            {VARIETY_LABELS[variety] || variety}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-gray-700">{data.paddyFed}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-700">{data.milledRice}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-700">{data.brokenRice}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-green-700">{data.recovery}{data.recovery !== '—' ? '%' : ''}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-gray-700">{data.breakage}{data.breakage !== '—' ? '%' : ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Override Dialog ────────────────────────────────────────────── */}
            {overrideTarget && (
                <OverrideDialog
                    open={!!overrideTarget}
                    onClose={() => setOverrideTarget(null)}
                    fieldLabel={overrideTarget.label}
                    currentValue={effectiveTotals[overrideTarget.key]}
                    onConfirm={handleOverrideConfirm}
                />
            )}
        </div>
    );
}