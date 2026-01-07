import { useTradeStore } from '@/store/tradeStore';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from './ui/common';
import { Plus, Trash2, TrendingUp, AlertCircle, DollarSign, Percent, Save } from 'lucide-react';
import { ASSET_CONFIGS, PIP_MULTIPLIERS } from '@/utils/calculations';
import { cn } from '@/lib/utils';

interface TradeCalculatorProps {
    onClose?: () => void;
}

export default function TradeCalculator({ onClose }: TradeCalculatorProps) {
    const { input, exits, results, setInput, addExit, removeExit, updateExit, logTrade } = useTradeStore();

    const handleLogTrade = () => {
        logTrade();
        if (onClose) {
            onClose();
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            <div className="space-y-6">
                {/* Account & Trade Settings */}
                <Card className="border-0 shadow-none ring-1 ring-slate-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Trade Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Account Balance ($)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        type="number"
                                        value={input.accountBalance}
                                        onChange={(e) => setInput('accountBalance', parseFloat(e.target.value) || 0)}
                                        className="pl-9"
                                <Label htmlFor="balance">Account Balance ($)</Label>
                                    <div className="relative">
                                        <Input
                                            id="balance"
                                            type="number"
                                            value={input.accountBalance || ''}
                                            onChange={(e) => setInput('accountBalance', e.target.valueAsNumber || 0)}
                                            className="pl-8"
                                            placeholder="0.00"
                                        />
                                        <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="risk">Risk Percent (%)</Label>
                                    <div className="relative">
                                        <Input
                                            id="risk"
                                            type="number"
                                            value={input.initialRiskPercent || ''}
                                            onChange={(e) => setInput('initialRiskPercent', e.target.valueAsNumber || 0)}
                                            className="pl-8"
                                            placeholder="1.0"
                                        />
                                        <Percent className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Asset Sector */}
                                <div className="space-y-2">
                                    <Label>Asset</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                        value={input.asset}
                                        onChange={(e) => setInput('asset', e.target.value as any)}
                                    >
                                        {Object.keys(ASSET_CONFIGS).map((asset) => (
                                            <option key={asset} value={asset}>
                                                {asset}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <Label htmlFor="entry">Entry Price</Label>
                                    <Input
                                        id="entry"
                                        type="number"
                                        step="0.0001"
                                        value={input.entryPrice || ''}
                                        onChange={(e) => setInput('entryPrice', e.target.valueAsNumber || 0)}
                                        placeholder="0.00000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sl">Stop Loss</Label>
                                    <Input
                                        id="sl"
                                        type="number"
                                        step="0.0001"
                                        value={input.stopLossPrice || ''}
                                        onChange={(e) => setInput('stopLossPrice', e.target.valueAsNumber || 0)}
                                        placeholder="0.00000"
                                    />
                                </div>
                            </div>

                            {/* Immediate Calc Preview */}
                            {results && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-md text-sm grid grid-cols-2 gap-2 text-slate-600">
                                    <div>SL Pips: <span className="font-medium text-slate-900">{results.slPips}</span></div>
                                    <div>Init Risk: <span className="font-medium text-red-600">${results.initialRiskAmount}</span></div>
                                    <div>Init Lots: <span className="font-medium text-blue-600 text-lg">{results.initialLots}</span></div>
                                </div>
                            )}
                    </CardContent>
                </Card>

                {/* Partial Exits */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-medium">Partial Exits</CardTitle>
                        <Button onClick={addExit} className="h-8 border border-dashed border-slate-300 bg-transparent text-slate-900 hover:bg-slate-50">
                            <Plus className="w-4 h-4 mr-1" /> Add Exit
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {exits.length === 0 && (
                            <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed rounded-lg">
                                No partial exits defined. Trade will run to full close (or manual).
                            </div>
                        )}
                        {exits.map((exit, index) => {
                            const isLong = input.entryPrice > input.stopLossPrice;
                            let calculatedPips = 0;
                            if (exit.price) {
                                const diff = isLong ? exit.price - input.entryPrice : input.entryPrice - exit.price;
                                calculatedPips = diff * PIP_MULTIPLIERS[input.asset];
                            }
                            // Fallback if we have old pips data but no price (though we defaulting price now)

                            return (
                                <div key={exit.id} className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex justify-between">
                                            <Label className="text-xs text-slate-500">Exit Price</Label>
                                            <span className={cn("text-xs font-mono", calculatedPips >= 0 ? "text-green-600" : "text-red-500")}>
                                                {calculatedPips.toFixed(1)} pips
                                            </span>
                                        </div>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={exit.price || ''}
                                            onChange={(e) => updateExit(exit.id, 'price', e.target.valueAsNumber)}
                                            className="h-8"
                                            placeholder="Price"
                                        />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <Label className="text-xs text-slate-500">% to Close (Remaining)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={exit.percentToClose}
                                                onChange={(e) => updateExit(exit.id, 'percentToClose', e.target.valueAsNumber)}
                                                className="pr-8 h-8"
                                                placeholder="50"
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => removeExit(exit.id)}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* Results Summary */}
            <div className="space-y-6">
                <Card className="border-blue-100 shadow-md bg-white h-auto lg:sticky lg:top-6">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle>Trade Analysis</CardTitle>
                        {results && (
                            <Button
                                onClick={handleLogTrade}
                                className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs"
                            >
                                <Save className="w-3.5 h-3.5" />
                                Log Trade
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {!results ? (
                            <div className="text-center text-slate-400">Enter trade parameters to see results</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                        <div className="text-sm text-blue-600 font-medium mb-1">Total Net Profit</div>
                                        <div className={cn("text-3xl font-bold", results.totalNetProfit >= 0 ? "text-green-600" : "text-red-600")}>
                                            ${results.totalNetProfit}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="text-sm text-slate-500 font-medium mb-1">Final Balance</div>
                                        <div className="text-2xl font-bold text-slate-800">
                                            ${results.finalAccountBalance}
                                        </div>
                                    </div>
                                </div>

                                {/* Breakdown Table */}
                                <div className="rounded-md border border-slate-200 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Exit Step</th>
                                                <th className="px-4 py-3 font-medium">Vol Closed</th>
                                                <th className="px-4 py-3 font-medium">P/L</th>
                                                <th className="px-4 py-3 font-medium text-right">Net</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {results.exits.map((res, i) => (
                                                <tr key={res.exitId} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-900">Exit {i + 1}</div>
                                                        <div className="text-xs text-slate-500">{res.pipsCaptured} pips</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {res.lotsClosed} lots
                                                        <div className="text-xs text-slate-400">{res.percentClosedOfRemaining}% of rem.</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className={res.grossProfit >= 0 ? "text-green-600" : "text-red-500"}>
                                                            ${res.grossProfit.toFixed(2)}
                                                        </div>
                                                        <div className="text-xs text-slate-400">Comm: -${res.commission.toFixed(2)}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        <span className={res.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                                                            ${res.netProfit.toFixed(2)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 font-medium text-slate-700">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3">Remaining Open Volume</td>
                                                <td className="px-4 py-3 text-right">{results.remainingLots} lots</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
