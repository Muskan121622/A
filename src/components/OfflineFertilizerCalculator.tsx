import { useState } from 'react';
import { Calculator, Sprout, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const OfflineFertilizerCalculator = () => {
    const [crop, setCrop] = useState('');
    const [acres, setAcres] = useState('');
    const [result, setResult] = useState<{ urea: number; dap: number; mop: number } | null>(null);

    const calculateFertilizer = () => {
        if (!crop || !acres) return;

        const area = parseFloat(acres);
        let urea = 0, dap = 0, mop = 0;

        // Standard NPK recommendations (Approximate rule-based logic)
        // Urea (46% N), DAP (18% N, 46% P), MOP (60% K)

        switch (crop) {
            case 'wheat':
                // Wheat: 120-60-40 kg/ha NPK -> Approx per acre adjustments
                urea = 2.5 * area; // Bags per acre
                dap = 1.0 * area;
                mop = 0.5 * area;
                break;
            case 'rice':
                // Rice: 100-60-40 kg/ha
                urea = 3.0 * area;
                dap = 1.5 * area;
                mop = 0.5 * area;
                break;
            case 'corn':
                // Corn: High nitrogen feeder
                urea = 3.5 * area;
                dap = 2.0 * area;
                mop = 1.0 * area;
                break;
            case 'sugarcane':
                // Sugarcane needs heavy feeding
                urea = 5.0 * area;
                dap = 2.5 * area;
                mop = 2.0 * area;
                break;
            default:
                urea = 0; dap = 0; mop = 0;
        }

        setResult({
            urea: parseFloat(urea.toFixed(1)),
            dap: parseFloat(dap.toFixed(1)),
            mop: parseFloat(mop.toFixed(1))
        });
    };

    return (
        <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Calculator className="text-green-500" />
                    Offline Fertilizer Calculator
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Select Crop</Label>
                    <Select onValueChange={setCrop}>
                        <SelectTrigger className="bg-slate-950 border-slate-700">
                            <SelectValue placeholder="Choose crop..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="wheat">Wheat (Gehu)</SelectItem>
                            <SelectItem value="rice">Rice (Dhaan)</SelectItem>
                            <SelectItem value="corn">Corn (Makka)</SelectItem>
                            <SelectItem value="sugarcane">Sugarcane (Ganna)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Farm Size (Acres)</Label>
                    <Input
                        type="number"
                        placeholder="e.g. 2.5"
                        value={acres}
                        onChange={(e) => setAcres(e.target.value)}
                        className="bg-slate-950 border-slate-700"
                    />
                </div>

                <Button
                    onClick={calculateFertilizer}
                    className="w-full bg-green-600 hover:bg-green-700"
                >
                    Calculate Dosage
                </Button>

                {result && (
                    <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-700 space-y-2 animate-in fade-in slide-in-from-bottom-4">
                        <h4 className="font-semibold text-green-400 flex items-center gap-2">
                            <Sprout size={16} /> Recommended Dosage
                        </h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-slate-900 rounded border border-slate-800">
                                <div className="text-2xl font-bold text-white">{result.urea}</div>
                                <div className="text-xs text-slate-400">Bags Urea</div>
                            </div>
                            <div className="p-2 bg-slate-900 rounded border border-slate-800">
                                <div className="text-2xl font-bold text-white">{result.dap}</div>
                                <div className="text-xs text-slate-400">Bags DAP</div>
                            </div>
                            <div className="p-2 bg-slate-900 rounded border border-slate-800">
                                <div className="text-2xl font-bold text-white">{result.mop}</div>
                                <div className="text-xs text-slate-400">Bags MOP</div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            *Calculated using standard NPK values. No internet needed.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default OfflineFertilizerCalculator;
