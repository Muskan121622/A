import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Upload, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

const CropLossForm = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            farmerName: user?.name || '',
            mobile: user?.mobile || '', // Assuming these exist in user object
            state: '',
            district: '',
            village: '',
            farmArea: '',
            insuranceStatus: 'No',
            cropName: '',
            season: 'Kharif',
            sowingDate: '',
            harvestDate: '',
            affectedArea: '',
            causeOfLoss: '',
            damagePercentage: '',
            damageDate: '',
            advisoryCompliance: {
                fertilizer: false,
                irrigation: false,
                pestControl: false
            },
            declaration: false,
            evidence: null
        }
    });

    const onSubmit = async (data) => {
        if (!data.declaration) {
            toast.error("You must agree to the declaration.");
            return;
        }

        setSubmitting(true);
        try {
            // In a real app, upload files first and get URLs.
            // Here we mock the file upload or send metadata.

            const payload = {
                ...data,
                location: `${data.village}, ${data.district}, ${data.state}`,
                // Calculate estimated yield loss or let backend do it
                timestamp: new Date().toISOString(),
            };

            await axios.post('http://localhost:5000/gov/crop-loss', payload);

            toast.success("Claim submitted successfully!");
            // Redirect to a status page or home
            navigate('/');
        } catch (error) {
            console.error("Submission error", error);
            toast.error("Failed to submit claim. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-primary mb-2">Crop Loss Compensation Claim</h1>
                <p className="text-muted-foreground">Government of India - Ministry of Agriculture</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Section 1: Farmer Identity */}
                <Card>
                    <CardHeader className="bg-muted/50">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                            Farmer Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label>Farmer Name</Label>
                            <Input {...register('farmerName', { required: true })} placeholder="Full Name" />
                        </div>
                        <div className="space-y-2">
                            <Label>Mobile Number</Label>
                            <Input {...register('mobile', { required: true })} placeholder="+91..." />
                        </div>
                        <div className="space-y-2">
                            <Label>State</Label>
                            <Input {...register('state', { required: true })} placeholder="State" />
                        </div>
                        <div className="space-y-2">
                            <Label>District</Label>
                            <Input {...register('district', { required: true })} placeholder="District" />
                        </div>
                        <div className="space-y-2">
                            <Label>Village</Label>
                            <Input {...register('village', { required: true })} placeholder="Village Name" />
                        </div>
                        <div className="space-y-2">
                            <Label>Total Farm Area (Acres)</Label>
                            <Input type="number" step="0.1" {...register('farmArea', { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label>PMFBY Insurance Status</Label>
                            <Select onValueChange={(val) => setValue('insuranceStatus', val)} defaultValue="No">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Enrolled (Yes)</SelectItem>
                                    <SelectItem value="No">Not Enrolled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 2: Crop Details */}
                <Card>
                    <CardHeader className="bg-muted/50">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                            Crop Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label>Crop Name</Label>
                            <Select onValueChange={(val) => setValue('cropName', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Crop" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Wheat">Wheat</SelectItem>
                                    <SelectItem value="Rice">Rice (Paddy)</SelectItem>
                                    <SelectItem value="Cotton">Cotton</SelectItem>
                                    <SelectItem value="Maize">Maize</SelectItem>
                                    <SelectItem value="Potato">Potato</SelectItem>
                                    <SelectItem value="Tomato">Tomato</SelectItem>
                                    <SelectItem value="Sugarcane">Sugarcane</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Season</Label>
                            <Select onValueChange={(val) => setValue('season', val)} defaultValue="Kharif">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Kharif">Kharif</SelectItem>
                                    <SelectItem value="Rabi">Rabi</SelectItem>
                                    <SelectItem value="Zaid">Zaid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Sowing Date</Label>
                            <Input type="date" {...register('sowingDate')} />
                        </div>
                        <div className="space-y-2">
                            <Label>Expected Harvest Date</Label>
                            <Input type="date" {...register('harvestDate')} />
                        </div>
                        <div className="space-y-2">
                            <Label>Affected Area (Acres)</Label>
                            <Input type="number" step="0.1" {...register('affectedArea', { required: true })} />
                        </div>
                    </CardContent>
                </Card>

                {/* Section 3: Loss Details */}
                <Card>
                    <CardHeader className="bg-muted/50">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                            Loss Details
                        </CardTitle>
                        <CardDescription>Provide accurate details for AI verification.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 mt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cause of Loss</Label>
                                <Select onValueChange={(val) => setValue('causeOfLoss', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Cause" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Flood">Flood / Heavy Rain</SelectItem>
                                        <SelectItem value="Drought">Drought</SelectItem>
                                        <SelectItem value="Pest">Pest Attack</SelectItem>
                                        <SelectItem value="Disease">Crop Disease</SelectItem>
                                        <SelectItem value="Hailstorm">Hailstorm</SelectItem>
                                        <SelectItem value="Heatwave">Heatwave</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Date Damage Observed</Label>
                                <Input type="date" {...register('damageDate', { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Estimated Damage Percentage (%)</Label>
                                <div className="flex items-center gap-2">
                                    <Input type="number" min="0" max="100" {...register('damagePercentage', { required: true })} />
                                    <span className="text-sm text-muted-foreground">Minimum 33% required</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Tips */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                            <h4 className="font-semibold flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-300">
                                <span className="text-lg">💡</span> AI Assistant
                            </h4>
                            <div className="flex flex-col gap-2 text-sm text-blue-600 dark:text-blue-400">
                                {watch('causeOfLoss') === 'Disease' && (
                                    <div className="flex items-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        <span>Please upload photos of the affected leaves/stems for AI verification.</span>
                                    </div>
                                )}
                                {watch('causeOfLoss') === 'Pest' && (
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Mention specific pest name if known (e.g., Pink Bollworm).</span>
                                    </div>
                                )}
                                {(watch('causeOfLoss') === 'Flood' || watch('causeOfLoss') === 'Hailstorm') && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>Ensure GPS location is enabled while taking photos.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 4: Evidence */}
                <Card>
                    <CardHeader className="bg-muted/50">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                            Evidence Upload
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="mt-4">
                        <div
                            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('evidence-upload')?.click()}
                        >
                            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="font-medium">Click to upload photos/video</p>
                            <p className="text-sm text-muted-foreground mt-1">Upload at least 2 photos (Close-up & Wide angle). GPS metadata will be extracted.</p>
                            <Input
                                id="evidence-upload"
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*,video/*"
                                onChange={(e) => {
                                    if (e.target.files?.length) {
                                        toast.success(`${e.target.files.length} files selected`);
                                        setValue('evidence', e.target.files);
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Section 5: Advisory Compliance */}
                <Card>
                    <CardHeader className="bg-muted/50">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
                            Advisory Compliance
                        </CardTitle>
                        <CardDescription>Confirm your adherence to AgriSphere advisories. This impacts claim approval.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 mt-4">
                        <div className="flex items-start space-x-3 p-3 border rounded-md">
                            <Checkbox
                                id="compliance-fert"
                                checked={watch('advisoryCompliance.fertilizer')}
                                onCheckedChange={(val) => setValue('advisoryCompliance.fertilizer', val)}
                            />
                            <div>
                                <Label htmlFor="compliance-fert" className="font-medium">Applied fertilizers/nutrients as recommended</Label>
                                <p className="text-xs text-muted-foreground">Will be verified against AI usage logs.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border rounded-md">
                            <Checkbox
                                id="compliance-irri"
                                checked={watch('advisoryCompliance.irrigation')}
                                onCheckedChange={(val) => setValue('advisoryCompliance.irrigation', val)}
                            />
                            <div>
                                <Label htmlFor="compliance-irri" className="font-medium">Followed recommended irrigation schedule</Label>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border rounded-md">
                            <Checkbox
                                id="compliance-pest"
                                checked={watch('advisoryCompliance.pestControl')}
                                onCheckedChange={(val) => setValue('advisoryCompliance.pestControl', val)}
                            />
                            <div>
                                <Label htmlFor="compliance-pest" className="font-medium">Reported pests/diseases early via Disease Detection tool</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 6: Declaration */}
                <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="declaration"
                            checked={watch('declaration')}
                            onCheckedChange={(val) => setValue('declaration', val)}
                        />
                        <div className="space-y-1">
                            <Label htmlFor="declaration" className="font-bold">I hereby declare that the information provided above is true.</Label>
                            <p className="text-sm text-muted-foreground">
                                I understand that any false claim will lead to rejection and legal action. I give consent for digital and physical verification of my farm.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/')}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={submitting} className="bg-gradient-to-r from-green-600 to-emerald-600">
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Submit Claim
                    </Button>
                </div>

            </form>
        </div>
    );
};

export default CropLossForm;
