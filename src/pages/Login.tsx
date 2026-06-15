import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Megaphone, Send, Eye, EyeOff, Zap, Coffee } from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/constants";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);

    localStorage.setItem("xeno_auth", "true");
    toast.success("Successfully logged in!");
    navigate({ to: ROUTES.DASHBOARD });
  };

  const handleContinueDemo = async () => {
    setDemoLoading(true);
    setEmail("demo@minicrm.in");
    setPassword("demo123");

    await new Promise((r) => setTimeout(r, 1000));
    setDemoLoading(false);

    localStorage.setItem("xeno_auth", "true");
    toast.success("Welcome! Signed in with demo account.");
    navigate({ to: ROUTES.DASHBOARD });
  };

  return (
    <div className="h-screen w-full flex flex-row font-sans bg-[#F5F3EF] overflow-hidden">
      {/* 1. NARROW SIDEBAR RAIL */}
      <div className="hidden lg:flex w-[72px] shrink-0 bg-[#141210] flex-col items-center py-6 border-r border-[#2A2822] z-20">
        {/* Logo Mark */}
        <div className="size-10 rounded-xl bg-[#1C1A18] border border-white/5 flex items-center justify-center text-[#E8870A] relative shadow-inner">
          <Coffee size={20} strokeWidth={2.5} />
        </div>

        {/* Vertical Circle Dots */}
        <div className="flex flex-col gap-4 mt-auto mb-auto">
          <div className="size-2 rounded-full bg-[#E8870A]" />
          <div className="size-2 rounded-full bg-white/10" />
          <div className="size-2 rounded-full bg-white/10" />
        </div>
      </div>

      {/* 2. LEFT CONTENT PANEL */}
      <div className="hidden lg:flex flex-1 bg-[#1C1A18] flex-col relative overflow-hidden border-r border-[#2A2822] z-10">
        {/* Top Bar */}
        <div className="h-[52px] shrink-0 border-b border-[#2A2822] flex items-center px-8 gap-3">
          <span className="font-['Space_Grotesk'] font-semibold text-white tracking-tight">Coffee CRM</span>
          <div className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-['Space_Grotesk'] font-bold bg-[#E8870A]/20 text-[#E8870A]">
            MINI CRM
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center px-12 xl:px-16 pb-20">
          <h1 className="font-['Space_Grotesk'] text-[38px] font-bold leading-[1.1] tracking-tight text-white max-w-lg">
            Reach your shoppers. <span className="text-[#E8870A]">Intelligently.</span>
          </h1>
          <p className="mt-4 text-[15px] text-white/50 leading-relaxed font-sans max-w-md">
            AI-native campaign management — cafe visit histories, morning brew drop offers, and store conversions.
          </p>
        </div>

        {/* Bottom Stat Cards */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-wrap gap-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1F1D1A] border border-[#2A2822] rounded-lg flex-1 min-w-[200px]">
            <div className="size-8 rounded bg-[#1C1A18] flex items-center justify-center shrink-0">
              <Users className="size-4 text-[#E8870A]" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-['Space_Grotesk'] font-bold text-lg leading-tight">300</span>
              <span className="text-white/50 text-[11px] uppercase tracking-wider font-semibold">Customers</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1F1D1A] border border-[#2A2822] rounded-lg flex-1 min-w-[200px]">
            <div className="size-8 rounded bg-[#1C1A18] flex items-center justify-center shrink-0">
              <Megaphone className="size-4 text-[#E8870A]" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-['Space_Grotesk'] font-bold text-lg leading-tight">7</span>
              <span className="text-white/50 text-[11px] uppercase tracking-wider font-semibold">Active campaigns</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1F1D1A] border border-[#2A2822] rounded-lg flex-1 min-w-[200px]">
            <div className="size-8 rounded bg-[#1C1A18] flex items-center justify-center shrink-0">
              <Send className="size-4 text-[#E8870A]" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-['Space_Grotesk'] font-bold text-lg leading-tight">90</span>
              <span className="text-white/50 text-[11px] uppercase tracking-wider font-semibold">Messages sent</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RIGHT FORM PANEL */}
      <div className="w-full lg:flex-1 flex flex-col px-8 py-4 sm:px-12 sm:py-6 lg:px-20 lg:py-10 bg-[#F5F3EF] h-full relative z-0 overflow-hidden">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex lg:hidden items-center gap-3 select-none mb-6">
          <div className="size-10 rounded-xl bg-[#141210] border border-white/5 flex items-center justify-center text-[#E8870A] font-['Space_Grotesk'] font-bold text-xl relative shadow-inner">
            X
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-['Space_Grotesk'] font-bold text-[#141210] text-lg tracking-tight">Coffee CRM</span>
            <span className="text-[10px] uppercase tracking-wider text-[#E8870A] font-semibold">
              Mini CRM
            </span>
          </div>
        </div>

        {/* Center Form Container */}
        <div className="max-w-sm w-full mx-auto my-auto py-0 flex flex-col justify-center">
          <span className="text-[11px] tracking-[0.2em] font-['Space_Grotesk'] font-bold text-[#E8870A] uppercase block mb-3">
            AI-Native Mini CRM
          </span>
          <h2 className="font-['Space_Grotesk'] text-3xl font-bold text-[#141210] mb-1 tracking-tight">Welcome back</h2>
          <p className="text-sm text-[#141210]/60 font-sans mb-6">Sign in to your dashboard</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[11px] font-['Space_Grotesk'] font-bold uppercase tracking-wider text-[#141210]/70"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-black/10 bg-[#EDEBE6] focus:bg-white text-sm rounded-md transition-all focus:border-[#E8870A] focus:ring-1 focus:ring-[#E8870A]"
                disabled={loading || demoLoading}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[11px] font-['Space_Grotesk'] font-bold uppercase tracking-wider text-[#141210]/70"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10 border-black/10 bg-[#EDEBE6] focus:bg-white text-sm rounded-md transition-all focus:border-[#E8870A] focus:ring-1 focus:ring-[#E8870A]"
                  disabled={loading || demoLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-[#141210]/40 hover:text-[#141210]/70 transition-colors"
                  disabled={loading || demoLoading}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-4 bg-[#E8870A] hover:bg-[#d17909] text-white font-['Space_Grotesk'] font-bold tracking-wide rounded-md text-sm transition-colors shadow-sm cursor-pointer"
              disabled={loading || demoLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5 flex items-center">
            <div className="flex-1 border-t border-black/10" />
            <span className="px-4 text-[10px] text-[#141210]/40 uppercase font-bold tracking-widest font-['Space_Grotesk']">
              or
            </span>
            <div className="flex-1 border-t border-black/10" />
          </div>

          {/* Demo Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border border-[#E8870A]/30 hover:bg-[#E8870A]/10 text-[#E8870A] font-['Space_Grotesk'] font-bold tracking-wide rounded-md text-sm transition-all flex items-center justify-center gap-2 bg-transparent cursor-pointer"
            onClick={handleContinueDemo}
            disabled={loading || demoLoading}
          >
            {demoLoading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" /> Loading Demo...
              </>
            ) : (
              <>
                <Zap className="size-3.5 fill-[#E8870A]/30" />
                Continue with Demo Account
              </>
            )}
          </Button>

          {/* Credentials Info Box */}
          <div className="mt-3 py-2 px-3 border border-black/5 bg-black/5 rounded text-center text-xs text-[#141210]/50 font-mono tracking-wide">
            demo@minicrm.in &nbsp;·&nbsp; demo123
          </div>
        </div>

        {/* Powered By Bottom Label (Mobile only, desktop has enough branding) */}
        <div className="lg:hidden mt-auto text-[9px] text-center text-[#141210]/40 font-bold uppercase tracking-[0.2em] pt-4 font-['Space_Grotesk']">
          Powered by Coffee CRM &nbsp;·&nbsp; AI-Native CRM
        </div>
      </div>
    </div>
  );
}
