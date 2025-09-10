"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { LogOut, LogIn, Bolt, Moon, SunDim, Star ,Languages, Settings as SettingsIcon, Bell, Palette, Shield, User as UserIcon, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {translations} from "../translations"

type Props = {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } | null;
  userScores: number | null; 
  isDark: boolean;
  signOut: () => void;
  language: "en" | "my";
  setLanguage: (lang: "en" | "my") => void;
  clearChat:()=>void
};

export default function ProfileMenu({
  session,
  userScores,
  signOut, language, setLanguage,clearChat
}: Props) {
  const { data: hookedSession, update: updateSession } = useSession();
  const effectiveSession = hookedSession ?? session;
  const name = effectiveSession?.user?.name || "Guest";
  const email = effectiveSession?.user?.email || "";
  const img = effectiveSession?.user?.image || "/assets/orb2.png";
  const initials =
    name?.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "U";

  const { theme, systemTheme, setTheme } = useTheme();
  const [translate, setTranslate] = useState("Myanamar");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = theme === "system" ? systemTheme : theme;
  const dark = current === "dark";
  const t=translations[language];
  const score = Math.max(0, Math.floor(userScores ?? 0));        
  const stars = Math.min(5, Math.floor(score / 25));            
  const percent = Math.min(100, Math.max(0, (score / 125) * 100)); 

  function rankForScore(s: number): { key: string; name: string; img: string } {
    if (s <= 0) return { key: "unranked", name: "Unranked", img: "/assets/orb2.png" };
    if (s >= 1 && s <= 20) return { key: "iron", name: "Iron", img: "/assets/rank/iron.png" };
    if (s >= 21 && s <= 40) return { key: "bronze", name: "Bronze", img: "/assets/rank/bronze.png" };
    if (s >= 41 && s <= 60) return { key: "silver", name: "Silver", img: "/assets/rank/silver.png" };
    if (s >= 61 && s <= 80) return { key: "gold", name: "Gold", img: "/assets/rank/gold.png" };
    if (s >= 81 && s <= 100) return { key: "platinum", name: "Platinum", img: "/assets/rank/platinum.png" };
    return { key: "immortal", name: "Immortal", img: "/assets/rank/immortal.png" };
  }
  const rank = rankForScore(score);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "my" : "en");
  };

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(name);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [fontColor, setFontColor] = useState<string>("#0f172a");
  const [savingProfile, setSavingProfile] = useState(false);
  const [autoFontColor, setAutoFontColor] = useState(true);
  const [activeTab, setActiveTab] = useState<'general'|'appearance'|'answers'|'account'|'security'>("general");
  const [answerStyle, setAnswerStyle] = useState<'summary'|'long'|'short'|'main'>('long');
  const userEmail = effectiveSession?.user?.email || "";

  useEffect(() => {
    // Load preferences
    try {
      const fs = localStorage.getItem("ui.fontSize") as any;
      const fc = localStorage.getItem("ui.fontColor");
      const auto = localStorage.getItem("ui.autoFontColor");
      const as = localStorage.getItem("chat.answerStyle") as any;
      if (fs === "small" || fs === "medium" || fs === "large") setFontSize(fs);
      if (fc && /^#([0-9a-f]{3}){1,2}$/i.test(fc)) setFontColor(fc);
      if (auto === "false") setAutoFontColor(false);
      if (as === 'summary' || as === 'long' || as === 'short' || as === 'main') setAnswerStyle(as);
    } catch {}
  }, []);

  useEffect(() => {
    applyPreferences(fontSize, fontColor);
  }, [fontSize, fontColor]);

  // Sync input when session name changes externally
  useEffect(() => {
    setDisplayName(name);
  }, [name]);

  // Auto-adjust font color when theme changes
  useEffect(() => {
    if (!autoFontColor) return;
    const next = dark ? "#e5e7eb" : "#0f172a";
    setFontColor(next);
    try { localStorage.setItem("ui.fontColor", next); } catch {}
  }, [dark, autoFontColor]);

  function applyPreferences(size: "small"|"medium"|"large", color: string) {
    try {
      const root = document.documentElement;
      const sz = size === "small" ? "14px" : size === "large" ? "18px" : "16px";
      root.style.fontSize = sz;
      // Best effort: set base text color for areas not explicitly styled by Tailwind utility classes
      document.body && (document.body.style.color = color);
      localStorage.setItem("ui.fontSize", size);
      localStorage.setItem("ui.fontColor", color);
    } catch {}
  }

  function updateAnswerStyle(style: 'summary'|'long'|'short'|'main'){
    setAnswerStyle(style);
    try { localStorage.setItem('chat.answerStyle', style); } catch {}
  }

  function toggleAutoColor() {
    const v = !autoFontColor;
    setAutoFontColor(v);
    try { localStorage.setItem("ui.autoFontColor", String(v)); } catch {}
  }

  async function saveProfile() {
    try {
      setSavingProfile(true);
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data?.error || "Failed to update profile");
      }
      try {
        // Update NextAuth session in the client so UI reflects new name immediately
        await updateSession?.({
          user: { name: displayName },
        } as any);
      } catch {}
      // optimistic update: no session refetch hook here, so just close
      setSettingsOpen(false);
    } catch (e) {
      console.error("Failed to save profile", e);
      alert((e as any)?.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  }
  
  return (
    <div className="absolute top-4 right-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="p-0 h-auto w-auto rounded-[20px]"
            aria-label="Open profile menu"
          >
            <Avatar className="h-10 w-10 rounded-[20px]">
              <AvatarImage src={img} alt="User Profile" />
              <AvatarFallback className="rounded-[20px]">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-60 p-0 rounded-2xl border border-border/60 bg-popover/95 text-popover-foreground shadow-xl backdrop-blur-md overflow-hidden"
        >
          
          <DropdownMenuLabel className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-xl">
                <AvatarImage src={img} alt="User Profile" />
                <AvatarFallback className="rounded-xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name}</p>
                {email ? (
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                ) : null}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-border/60" />

  
          <DropdownMenuItem className="gap-2 px-4 py-3" aria-label="Score summary">
            <Bolt className="h-4 w-4 opacity-80" />
            <span className="truncate">
              {userScores !== null ? `${score} ${t.marks}` : "No Scores"}
            </span>
          </DropdownMenuItem>

          
          <div className="px-4 py-3" role="group" aria-label="Quiz progress">
            {/* Stars */}
            <div className="flex items-center gap-1.5 mb-2" aria-label={`${stars} of 5 stars`}>
              {[0, 1, 2,3,4].map((i) => {
                const filled = i < stars;
                return (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${filled ? "text-yellow-400" : "text-muted-foreground/50"}`}
                    style={filled ? { fill: "currentColor" } : {}}
                    aria-hidden="true"
                  />
                );
              })}
              <span className="ml-2 text-xs text-muted-foreground">{stars}/5</span>
            </div>

            <div className="w-full">
              <div
                className="relative h-2.5 w-full rounded-full bg-muted/60 overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={75}
                aria-valuenow={score}
                aria-label="Marks progress"
                title={`${score} / 125`}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span>{score} / 125</span>
                <span>{Math.round(percent)}%</span>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="bg-border/60" />
          <DropdownMenuItem asChild className="px-4 py-2 gap-2">
            {mounted && (
              <button
                type="button"
                onClick={toggleLanguage}
                className="w-full inline-flex items-center gap-2 rounded-md text-sm hover:bg-accent transition-colors"
                aria-pressed={language === "my"}
              >
                <Languages className="h-4 w-4" />
                <span className="truncate">{language === "en" ? "မြန်မာ" :  "English"}</span>
              </button>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/60" />

          <DropdownMenuItem className="px-4 py-2">
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(dark ? "light" : "dark")}
                className="w-full inline-flex items-center gap-2 rounded-md text-sm hover:bg-accent transition-colors"
                aria-pressed={dark}
              >
                {dark ? <SunDim className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="truncate">{dark ? `Light` : `Dark`}</span>
              </button>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border/60" />

          {/* Settings entry above logout - dialog with sidebar navigation (ChatGPT-style) */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DropdownMenuItem asChild className="px-4 py-2 cursor-pointer" onSelect={(e) => e.preventDefault()}>
              <DialogTrigger asChild>
                <button type="button" className="w-full text-left inline-flex items-center gap-2 rounded-md bg-accent/20 hover:bg-accent/30 px-2 py-2">
                  <SettingsIcon className="h-4 w-4" />
                  <span>Settings</span>
                </button>
              </DialogTrigger>
            </DropdownMenuItem>
            <DialogContent className="sm:max-w-3xl md:max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 md:gap-6">
                {/* Left nav */}
                <nav className="rounded-lg border bg-background/80">
                  <ul className="p-2">
                    {([
                      { key: 'general', label: 'General', icon: SettingsIcon },
                      { key: 'appearance', label: 'Appearance', icon: Palette },
                      { key: 'answers', label: 'Answer Style', icon: Bolt },
                      { key: 'security', label: 'Security', icon: Shield, disabled: true },
                      { key: 'account', label: 'Account', icon: UserIcon },
                    ] as const).map((it) => (
                      <li key={it.key}>
                        <button
                          onClick={() => setActiveTab(it.key as any)}
                          disabled={Boolean((it as any).disabled)}
                          className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm ${activeTab === it.key ? 'bg-accent' : 'hover:bg-accent/60'} ${it.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <it.icon className="h-4 w-4" />
                          <span>{it.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Right content */}
                <section className="rounded-lg border bg-background/90 p-4">
                  {activeTab === 'general' && (
                    <div>
                      <h3 className="text-base font-semibold mb-2">General</h3>
                      <Card className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2">
                          <div className="text-sm text-muted-foreground">Theme</div>
                          <div className="inline-flex rounded-md border bg-background">
                            <Button variant={theme === 'system' ? 'default' : 'ghost'} size="sm" onClick={() => setTheme('system')}>System</Button>
                            <Button variant={theme === 'light' ? 'default' : 'ghost'} size="sm" onClick={() => setTheme('light')}>Light</Button>
                            <Button variant={theme === 'dark' ? 'default' : 'ghost'} size="sm" onClick={() => setTheme('dark')}>Dark</Button>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4 mt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2">
                          <div className="text-sm text-muted-foreground">Language</div>
                          <div className="inline-flex rounded-md border bg-background">
                            <Button variant={language === 'en' ? 'default' : 'ghost'} size="sm" onClick={() => setLanguage('en')}>English</Button>
                            <Button variant={language === 'my' ? 'default' : 'ghost'} size="sm" onClick={() => setLanguage('my')}>Myanmar</Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {activeTab === 'appearance' && (
                    <div>
                      <h3 className="text-base font-semibold mb-2">Appearance</h3>
                      <Card className="p-4">
                        <div className="mb-4">
                          <div className="text-xs text-muted-foreground mb-1">Font size</div>
                          <div className="inline-flex rounded-md border bg-background">
                            <Button variant={fontSize === 'small' ? 'default' : 'ghost'} size="sm" onClick={() => setFontSize('small')}>Small</Button>
                            <Button variant={fontSize === 'medium' ? 'default' : 'ghost'} size="sm" onClick={() => setFontSize('medium')}>Medium</Button>
                            <Button variant={fontSize === 'large' ? 'default' : 'ghost'} size="sm" onClick={() => setFontSize('large')}>Large</Button>
                          </div>
                        </div>
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">Auto-match font color to theme</div>
                            <p className="text-xs text-muted-foreground">Light theme uses dark text; dark theme uses light text.</p>
                          </div>
                          <label className="inline-flex items-center cursor-pointer select-none">
                            <input type="checkbox" className="peer sr-only" checked={autoFontColor} onChange={toggleAutoColor} />
                            <span className="w-10 h-5 rounded-full bg-muted peer-checked:bg-cyan-600 relative transition-colors">
                              <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                            </span>
                          </label>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Font color {autoFontColor && <span className="text-[10px] ml-1">(auto)</span>}</div>
                          <div className="flex items-center gap-3">
                            <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} aria-label="Pick font color" disabled={autoFontColor} />
                            <Input className="w-28" value={fontColor} onChange={(e) => setFontColor(e.target.value)} disabled={autoFontColor} />
                            {!autoFontColor && (
                              <div className="flex items-center gap-1">
                                {['#0f172a','#111827','#1f2937','#334155','#e5e7eb','#f8fafc','#22d3ee','#fb7185'].map(c => (
                                  <button key={c} onClick={() => setFontColor(c)} style={{ backgroundColor: c }} className="h-5 w-5 rounded-full border" title={c} />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="mt-4 rounded-md border p-3 text-sm" style={{ color: fontColor }}>
                            <div className="text-xs text-muted-foreground mb-1">Preview</div>
                            <p>
                              Securum — Your cybersecurity AI assistant. This is how your text will look with the selected size and color.
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {activeTab === 'answers' && (
                    <div>
                      <h3 className="text-base font-semibold mb-2">Answer Output Style</h3>
                      <Card className="p-4">
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <div className="text-sm text-muted-foreground mb-2">Style</div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Answer style">
                              <Button
                                type="button"
                                role="radio"
                                aria-checked={answerStyle === 'summary'}
                                variant={answerStyle === 'summary' ? 'default' : 'outline'}
                                className="w-full justify-center"
                                onClick={() => updateAnswerStyle('summary')}
                                title="Title + very short overview"
                              >
                                Summary
                              </Button>
                              <Button
                                type="button"
                                role="radio"
                                aria-checked={answerStyle === 'long'}
                                variant={answerStyle === 'long' ? 'default' : 'outline'}
                                className="w-full justify-center"
                                onClick={() => updateAnswerStyle('long')}
                                title="Full structure with steps and measures"
                              >
                                Long & Detail
                              </Button>
                              <Button
                                type="button"
                                role="radio"
                                aria-checked={answerStyle === 'short'}
                                variant={answerStyle === 'short' ? 'default' : 'outline'}
                                className="w-full justify-center"
                                onClick={() => updateAnswerStyle('short')}
                                title="One or two sentences"
                              >
                                Short Answer
                              </Button>
                              <Button
                                type="button"
                                role="radio"
                                aria-checked={answerStyle === 'main'}
                                variant={answerStyle === 'main' ? 'default' : 'outline'}
                                className="w-full justify-center"
                                onClick={() => updateAnswerStyle('main')}
                                title="Only the main bullet points"
                              >
                                Only Main Points
                              </Button>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">Your choice controls how the assistant formats and compresses answers.</div>

                          <div className="rounded-md border p-3 text-sm whitespace-pre-line bg-background/40">
                            {/* Live preview */}
                            {answerStyle === 'summary' && (
                              <>
                                Securing Your Wi‑Fi Network
                                {"\n"}
                                Protect your Wi‑Fi by changing defaults and using modern encryption.
                                {"\n"}
                                Keep firmware updated and limit access to trusted devices.
                              </>
                            )}
                            {answerStyle === 'short' && (
                              <>
                                Securing Your Wi‑Fi Network
                                {"\n"}
                                Change defaults and enable WPA2.
                                {"\n"}
                                Update firmware and use a guest network.
                              </>
                            )}
                            {answerStyle === 'main' && (
                              <>
                                Securing Your Wi‑Fi Network
                                {"\n- Change admin password\n- Enable WPA2\n- Update firmware\n- Limit guest access"}
                              </>
                            )}
                            {answerStyle === 'long' && (
                              <>
                                Securing Your Wi‑Fi Network
                                {"\n"}
                                Protect your network with strong authentication, modern encryption, and controlled access.
                                {"\n\n"}
                                Essential Steps
                                {"\n- Change admin password\n- Enable WPA2 and use a strong passphrase\n- Update router firmware"}
                                {"\n\n"}
                                Advanced Measures
                                {"\n1. Configure firewall rules\n\n2. Use a guest network\n\n3. Scan for vulnerabilities"}
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {activeTab === 'account' && (
                    <div>
                      <h3 className="text-base font-semibold mb-2">Account</h3>
                      <div className="grid gap-3">
                        <Card className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-3">
                            <div className="text-sm text-muted-foreground">Rank</div>
                            <div className="flex items-center gap-3">
                              <Image src={rank.img} alt={rank.name} width={40} height={40} className="rounded" />
                              <div>
                                <div className="text-sm font-medium">{rank.name}</div>
                                <div className="text-xs text-muted-foreground">Score: {score}</div>
                              </div>
                            </div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <label className="block text-xs text-muted-foreground mb-1">Name (registered)</label>
                          <div className="flex items-center gap-2">
                            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                            <Button onClick={saveProfile} disabled={savingProfile} className="shrink-0">{savingProfile ? 'Saving…' : 'Save'}</Button>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr_auto] items-center gap-2">
                            <div className="text-sm text-muted-foreground">Email</div>
                            <Input value={userEmail || 'Not set'} readOnly className="bg-muted/30" />
                            <Button type="button" variant="outline" className="shrink-0 inline-flex items-center gap-2" onClick={() => { if (userEmail) navigator.clipboard.writeText(userEmail); }} disabled={!userEmail}>
                              <Copy className="h-4 w-4" /> Copy
                            </Button>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}
                </section>
              </div>
              <div className="flex justify-end pt-2">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenuSeparator className="bg-border/60" />

          {/* Auth action */}
          {session ? (
            <DropdownMenuItem
              onClick={signOut}
              className="px-4 py-2 gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>LogOut</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild className="px-4 py-2 gap-2" onClick={clearChat}>
              <Link href="/login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-destructive" />
                <span className="hover:text-destructive">Log In</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
