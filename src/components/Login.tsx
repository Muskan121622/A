import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles, ArrowLeft, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'farmer' | 'government' | 'buyer'>('farmer'); // Default role
  const [userInfoStep, setUserInfoStep] = useState(true); // Step to choose role

  const { login, setUser } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (role === 'government') {
        const allowedAdmins = ['admin@agrisphere.gov', 'admin123@gmail.com'];

        // MOCK LOGIN FOR SPECIFIC ADMIN
        if (email === 'admin123@gmail.com' && password === '1234567') {
          setUser({
            id: 'gov_admin_123',
            name: 'Government Official',
            email: email,
            role: 'government'
          });

          toast({
            title: "Welcome back!",
            description: "Logged in as Government Official",
          });

          navigate('/gov/dashboard');
          return;
        }

        if (!email.toLowerCase().includes('gov.in') && !allowedAdmins.includes(email)) {
          throw new Error("Access Denied: Please use a valid government email address (@gov.in).");
        }
      }

      await login(email, password, role);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${role === 'government' ? 'Government Official' : role === 'buyer' ? 'Buyer' : 'Farmer'}`,
      });

      if (role === 'government') {
        navigate('/gov/dashboard');
      } else if (role === 'buyer') {
        navigate('/buyer/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-secondary/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          <Card className="backdrop-blur-xl bg-card/80 border-2 border-primary/20 shadow-2xl shadow-primary/10">
            <div className="absolute top-4 left-4 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <CardHeader className="text-center pb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              <CardTitle className="text-3xl font-bold gradient-text mb-2">
                {userInfoStep ? "Welcome Back" : `Login as ${role === 'farmer' ? 'Farmer' : role === 'buyer' ? 'Buyer' : 'Official'}`}
              </CardTitle>
              <CardDescription className="text-lg">
                {userInfoStep ? "Choose your login portal" : "Enter your credentials to continue"}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {userInfoStep ? (
                <div className="space-y-4">
                  <div
                    onClick={() => { setRole('farmer'); setUserInfoStep(false); }}
                    className="p-6 border-2 border-slate-700 bg-slate-900/50 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-900/10 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-900/30 rounded-full text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Farmer Login</h3>
                        <p className="text-sm text-slate-400">Access Advisory, Market & Community</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => { setRole('government'); setUserInfoStep(false); }}
                    className="p-6 border-2 border-slate-700 bg-slate-900/50 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-900/10 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-900/30 rounded-full text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Government Official</h3>
                        <p className="text-sm text-slate-400">Access Monitoring Dashboard</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => { setRole('buyer'); setUserInfoStep(false); }}
                    className="p-6 border-2 border-slate-700 bg-slate-900/50 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-900/10 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-900/30 rounded-full text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Buyer / Trader</h3>
                        <p className="text-sm text-slate-400">Access Marketplace & Insights</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email Address
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder={role === 'government' ? "official@gov.in" : role === 'buyer' ? "trader@agrimarket.com" : "farmer@gmail.com"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 pl-4 pr-4 border-2 border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 pl-4 pr-4 border-2 border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </motion.div>

                  <div
                    className="text-sm text-primary hover:underline cursor-pointer flex items-center gap-1"
                    onClick={() => setUserInfoStep(true)}
                  >
                    <ArrowLeft className="w-3 h-3" /> Change Role (Currently: {role})
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 text-white font-medium text-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Signing you in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-3 w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              )}

              {(role === 'farmer' || role === 'buyer') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 text-center"
                >
                  <p className="text-muted-foreground text-sm">
                    Don't have an account?{' '}
                    <span
                      onClick={() => navigate('/signup')}
                      className="text-primary font-medium hover:underline cursor-pointer"
                    >
                      Create one here
                    </span>
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
