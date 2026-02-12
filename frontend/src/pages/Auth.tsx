import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GraduationCap, BookOpen, Shield, Loader2, Eye, EyeOff } from 'lucide-react';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits').regex(/^[0-9+\-\s]+$/, 'Invalid mobile number format'),
  role: z.enum(['student', 'teacher', 'admin']),
  regNo: z.string().optional(),
  degree: z.string().optional(),
  branch: z.string().optional(),
  year: z.string().optional(),
  section: z.string().optional(),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  const navigate = useNavigate();
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState(mode);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
const [showSignupPassword, setShowSignupPassword] = useState(false);


  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AppRole>('student');
  const [mobileNumber, setMobileNumber] = useState('');
  const [regNo, setRegNo] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
      
      const { error } = await signIn(loginEmail, loginPassword);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        email: signupEmail,
        password: signupPassword,
        fullName,
        mobileNumber,
        role,
        regNo: role === 'student' ? regNo : undefined,
        degree: role === 'student' ? degree : undefined,
        branch: role === 'student' ? branch : undefined,
        year: role === 'student' ? year : undefined,
        section: role === 'student' ? section : undefined,
      };

      signupSchema.parse(data);

      const { error } = await signUp(
        signupEmail,
        signupPassword,
        {
          full_name: fullName,
          mobile_number: mobileNumber,
          reg_no: role === 'student' ? regNo : null,
          degree: role === 'student' ? degree : null,
          branch: role === 'student' ? branch : null,
          year: role === 'student' ? year : null,
          section: role === 'student' ? section : null,
        },
        role
      );

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('An error occurred during signup');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleIcons = {
    student: GraduationCap,
    teacher: BookOpen,
    admin: Shield,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-muted-foreground mt-2">Educational Form Management</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
  <Label htmlFor="login-password">Password</Label>
  <div className="relative">
    <Input
      id="login-password"
      type={showLoginPassword ? "text" : "password"}
      placeholder="••••••••"
      value={loginPassword}
      onChange={(e) => setLoginPassword(e.target.value)}
      required
    />
    <button
      type="button"
      onClick={() => setShowLoginPassword(!showLoginPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
    >
   {showLoginPassword ? (
  <EyeOff className="w-4 h-4" />
) : (
  <Eye className="w-4 h-4" />
)}

    </button>
  </div>
</div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['student', 'teacher', 'admin'] as const).map((r) => {
                      const Icon = roleIcons[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            role === r
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium capitalize">{r}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
  <Label htmlFor="signup-password">Password</Label>
  <div className="relative">
    <Input
      id="signup-password"
      type={showSignupPassword ? "text" : "password"}
      placeholder="••••••••"
      value={signupPassword}
      onChange={(e) => setSignupPassword(e.target.value)}
      required
    />
    <button
      type="button"
      onClick={() => setShowSignupPassword(!showSignupPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
    >
    {showSignupPassword ? (
  <EyeOff className="w-4 h-4" />
) : (
  <Eye className="w-4 h-4" />
)}

    </button>
  </div>
</div>


                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="mobile-number">Mobile Number (for WhatsApp)</Label>
                    <Input
                      id="mobile-number"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {role === 'student' && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-sm text-muted-foreground mb-4">
                        Student Details (for auto-grouping)
                      </p>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reg-no">Registration Number</Label>
                          <Input
                            id="reg-no"
                            placeholder="2024CS001"
                            value={regNo}
                            onChange={(e) => setRegNo(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="degree">Degree</Label>
                            <Select value={degree} onValueChange={setDegree}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                              <SelectItem value="B.E">B.E</SelectItem>
                                <SelectItem value="B.Tech">B.Tech</SelectItem>
                                <SelectItem value="M.Tech">M.Tech</SelectItem>
                                <SelectItem value="MBA">MBA</SelectItem>
                                <SelectItem value="BBA">BBA</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="branch">Branch</Label>
                            <Select value={branch} onValueChange={setBranch}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CSE">CSE</SelectItem>
                                <SelectItem value="ECE">ECE</SelectItem>
                                <SelectItem value="EEE">EEE</SelectItem>
                                <SelectItem value="MECH">MECH</SelectItem>
                                <SelectItem value="CIVIL">CIVIL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="year">Year</Label>
                            <Select value={year} onValueChange={setYear}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1st Year</SelectItem>
                                <SelectItem value="2">2nd Year</SelectItem>
                                <SelectItem value="3">3rd Year</SelectItem>
                                <SelectItem value="4">4th Year</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="section">Section</Label>
                            <Select value={section} onValueChange={setSection}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Section A</SelectItem>
                                <SelectItem value="B">Section B</SelectItem>
                                <SelectItem value="C">Section C</SelectItem>
                                <SelectItem value="D">Section D</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
