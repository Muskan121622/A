
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Users, AlertTriangle, Sprout, Building2, FileText, CheckCircle, XCircle, Search, Activity, Tractor } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';

interface GovStats {
    overview: {
        totalFarmers: number;
        activeFarmers: number;
        diseaseDetections: number;
        pestAlerts: number;
        fieldsMapped: number;
    };
    market: {
        totalListings: number;
        totalVolume: number;
        listings: any[];
    };
    community: {
        totalIssues: number;
        resolvedIssues: number;
        recenttopics: {
            id: string;
            title: string;
            content: string;
            author: string;
            timestamp: string;
            likes: number;
            replies: number;
        }[];
    };
    cropLoss: {
        pendingCases: number;
        totalDisbursed: number;
    };
}

interface CropLossCase {
    id: string;
    farmerName: string;
    crop: string;
    damagePercentage: number;
    cause: string;
    status: string;
    timestamp: string;
    location: string;
    estimatedLoss: number;
    suggestedCompensation: number;
    isEligible?: boolean;
    suggestedScheme?: string;
}

const GovDashboard = () => {
    const { toast } = useToast();
    const [stats, setStats] = useState<GovStats | null>(null);
    const [cases, setCases] = useState<CropLossCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    const API_URL = 'http://localhost:5000';

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, casesRes] = await Promise.all([
                axios.get(`${API_URL}/gov/stats`),
                axios.get(`${API_URL}/gov/crop-loss`)
            ]);
            setStats(statsRes.data);
            setCases(casesRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching gov data:", error);
            // toast({ title: "Connection Error", description: "Failed to fetch government data", variant: "destructive" });
        }
    };

    const handleCaseAction = async (id: string, action: 'approve' | 'reject' | 'verify') => {
        try {
            await axios.post(`${API_URL}/gov/crop-loss/${id}/action`, { action });
            toast({
                title: action === 'approve' ? "Case Approved" : action === 'reject' ? "Case Rejected" : "Verification Requested",
                description: `Case ${id} has been updated.`
            });
            fetchData(); // Refresh data
        } catch (error) {
            toast({ title: "Error", description: "Failed to update case status", variant: "destructive" });
        }
    };

    // Mock Data for Charts (since we don't have historical time-series in simple JSON)
    const diseaseTrendData = [
        { name: 'Mon', detections: 12 },
        { name: 'Tue', detections: 19 },
        { name: 'Wed', detections: 15 },
        { name: 'Thu', detections: 25 },
        { name: 'Fri', detections: 32 },
        { name: 'Sat', detections: 28 },
        { name: 'Sun', detections: 20 },
    ];

    const marketPriceData = [
        { name: 'Wheat', price: 2200 },
        { name: 'Rice', price: 1950 },
        { name: 'Maize', price: 1800 },
        { name: 'Potato', price: 1200 },
        { name: 'Onion', price: 2500 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const handleGenerateReport = () => {
        if (!stats) return;

        const reportContent = `
AGRISPHERE GOVERNMENT AUTHORITY REPORT
Generated on: ${new Date().toLocaleString()}
----------------------------------------

1. PLATFORM OVERVIEW
- Total Registered Farmers: ${stats.overview.totalFarmers}
- Active Farmers (This Week): ${stats.overview.activeFarmers}
- Fields Mapped: ${stats.overview.fieldsMapped}

2. ALERT STATUS
- Pest Alerts Active: ${stats.overview.pestAlerts}
- Disease Detections: ${stats.overview.diseaseDetections}

3. CROP LOSS COMPENSATION
- Pending Cases: ${stats.cropLoss.pendingCases}
- Total Funds Allocated: ₹${stats.cropLoss.totalDisbursed.toLocaleString()}

4. MARKET INTELLIGENCE
- Total Listings: ${stats.market.totalListings}
- Total Volume Traded: ${stats.market.totalVolume} Q

----------------------------------------
CONFIDENTIAL - MINISTRY OF AGRICULTURE
        `.trim();

        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Agrisphere_Report_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
            title: "Report Generated",
            description: "Detailed status report has been downloaded.",
        });
    };

    if (loading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Government Authority Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />

            <main className="container mx-auto px-4 py-8 pt-24">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600 flex items-center gap-3">
                            <Building2 className="text-blue-500" /> Ministry of Agriculture Dashboard
                        </h1>
                        <p className="text-slate-400 mt-2">National Command & Control Center</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-sm text-green-400">System Operational</span>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleGenerateReport}>Generate Report</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={<Users className="text-blue-400" />} title="Registered Farmers" value={stats?.overview.totalFarmers} subtext={`+${stats?.overview.activeFarmers} active this week`} />
                    <StatCard icon={<AlertTriangle className="text-red-400" />} title="Active Alerts" value={stats?.overview.pestAlerts} subtext="High priority pest zones" />
                    <StatCard icon={<Sprout className="text-green-400" />} title="Crop Loss Cases" value={stats?.cropLoss.pendingCases} subtext="Pending approval" />
                    <StatCard icon={<Activity className="text-purple-400" />} title="Est. Disbursement" value={`₹${(stats?.cropLoss.totalDisbursed || 0) / 100000}L`} subtext="Funds allocated" />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-slate-900 border border-slate-800 p-1">
                        <TabsTrigger value="overview">Overview & Analytics</TabsTrigger>
                        <TabsTrigger value="croploss" className="data-[state=active]:bg-red-600">Crop Loss Compensation <Badge className="ml-2 bg-white text-red-600">{stats?.cropLoss.pendingCases}</Badge></TabsTrigger>
                        <TabsTrigger value="market">Market Intelligence</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white">Disease Detection Trend</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={diseaseTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="name" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                            <Line type="monotone" dataKey="detections" stroke="#f87171" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white">Community Issues</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[300px] pr-4">
                                        {stats?.community.recenttopics.map((post, i) => (
                                            <div key={i} className="mb-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-200 text-sm">{post.title}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-blue-400 bg-blue-950/30 px-1.5 py-0.5 rounded">{post.author}</span>
                                                            <span className="text-xs text-slate-500">{new Date(post.timestamp).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    {post.replies > 0 && (
                                                        <Badge variant="secondary" className="bg-slate-800 text-slate-400 text-[10px]">{post.replies} Replies</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{post.content}</p>
                                                <div className="flex gap-3 text-xs text-slate-500 border-t border-slate-800 pt-2">
                                                    <span className="flex items-center gap-1">❤️ {post.likes}</span>
                                                    <span className="flex items-center gap-1">💬 {post.replies}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="croploss" className="space-y-6">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-white">Compensation Cases Management</CardTitle>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input placeholder="Search Case ID..." className="pl-9 bg-slate-950 border-slate-800 w-64" />
                                        </div>
                                        <Button variant="outline" className="border-slate-800">Filter</Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {cases.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">No active cases found.</div>
                                    ) : (
                                        cases.map((c) => (
                                            <div key={c.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:border-slate-700 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    <div className="bg-slate-900 p-3 rounded-lg">
                                                        <FileText className="text-blue-500 h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-mono text-xs text-slate-500">{c.id}</span>
                                                            <Badge className={
                                                                c.status === 'Approved' ? "bg-green-900/50 text-green-400" :
                                                                    c.status === 'Rejected' ? "bg-red-900/50 text-red-400" :
                                                                        c.status === 'Under Verification' ? "bg-blue-900/50 text-blue-400" :
                                                                            "bg-yellow-900/50 text-yellow-400"
                                                            }>{c.status}</Badge>
                                                            {c.isEligible ? (
                                                                <Badge variant="outline" className="border-green-800 text-green-400 bg-green-950/30">Eligible</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="border-red-800 text-red-400 bg-red-950/30">Review Required</Badge>
                                                            )}
                                                        </div>
                                                        <h3 className="font-semibold text-lg text-slate-200 mt-1">{c.farmerName} • {c.crop} Loss</h3>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
                                                            <span>Cause: {c.cause}</span>
                                                            <span className="text-red-400 font-medium">Damage: {c.damagePercentage}%</span>
                                                            <span>Est. Loss: ₹{c.estimatedLoss}</span>
                                                            {c.suggestedScheme && c.suggestedScheme !== 'None' && (
                                                                <span className="text-blue-400">Scheme: {c.suggestedScheme}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {!['Approved', 'Rejected'].includes(c.status) && (
                                                    <div className="flex gap-2 w-full md:w-auto">
                                                        {c.status !== 'Under Verification' && (
                                                            <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 flex-1" onClick={() => handleCaseAction(c.id, 'verify')}>
                                                                Verify
                                                            </Button>
                                                        )}
                                                        <Button size="sm" className="bg-red-900/50 text-red-300 hover:bg-red-900/80 border border-red-900 flex-1" onClick={() => handleCaseAction(c.id, 'reject')}>
                                                            Reject
                                                        </Button>
                                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => handleCaseAction(c.id, 'approve')}>
                                                            Approve (₹{c.suggestedCompensation})
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="market" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white">State-wise Average Prices</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={marketPriceData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                            <XAxis type="number" stroke="#94a3b8" />
                                            <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                            <Bar dataKey="price" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white">Live Listings Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {stats?.market.listings.map((l, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 border-b border-slate-800 last:border-0">
                                                <div>
                                                    <p className="font-medium text-slate-200">{l.cropName}</p>
                                                    <p className="text-xs text-slate-500">{l.location}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-400">₹{l.price}/Q</p>
                                                    <p className="text-xs text-slate-400">{l.quantity} Q</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

const StatCard = ({ icon, title, value, subtext }: { icon: any, title: string, value: any, subtext: string }) => (
    <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-lg">
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-slate-400">{title}</p>
                    <h3 className="text-2xl font-bold text-white">{value || '-'}</h3>
                    <p className="text-xs text-slate-500 mt-1">{subtext}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);

export default GovDashboard;
