"use client"

import React, { useEffect, useRef, useState } from "react"
import axios, { AxiosError, CancelTokenSource } from "axios"
import { useSession } from "next-auth/react"
import { Menu, X, SquarePen, Loader2, Trash2, Search, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { translations } from "../translations"
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatSession {
  // Normalize to always have session_id in component state
  session_id: number
  title: string | null
  created_at?: string
}

interface SidebarProps {
  onSelectSession: (sessionId: number, messages: { role: string; text: string }[]) => void
  currentSessionId?: number | null
  language: "en" | "my"
  apiBaseUrl?: string
  /** 🔑 NEW: last user message (from Home.tsx) */
  lastUserMessage?: string | null
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export default function Sidebar({
  onSelectSession,
  currentSessionId = null,
  language,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000",
  lastUserMessage = null,
}: SidebarProps) {
  const { data: auth } = useSession()
  const userId = (auth as any)?.user?.id
  const t = translations[language]

  const [expand, setExpand] = useState(true)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<
    { session_id: number; title: string | null; content: string; created_at?: string }[]
  >([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const cancelRef = useRef<CancelTokenSource | null>(null)
  const searchCancelRef = useRef<CancelTokenSource | null>(null)
  // Add this function inside your Sidebar component in sidebar.tsx
const handleDownload = async (format: 'pdf' | 'docx' | 'csv') => {
  if (!currentSessionId) {
    alert("Please select a chat session to download.");
    return;
  }

  try {
    const response = await axios.get(`${apiBaseUrl}/chat/download/${currentSessionId}?format=${format}`, {
      responseType: 'blob', // Important: tells axios to expect binary data
    });

    // Create a URL for the blob data
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chat_session_${currentSessionId}.${format}`);
    
    // Append to the document, click, and then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error downloading file:", error);
    alert("Failed to download chat history.");
  }
};

  /** ---------- Fetch sessions ---------- */
  const fetchSessions = async () => {
    if (!userId) return
    cancelRef.current?.cancel("new-request")
    cancelRef.current = axios.CancelToken.source()
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(`${apiBaseUrl}/chat/sessions/${userId}`, {
        cancelToken: cancelRef.current.token,
      })
      // Accept both shapes: [{ id, title, created_at }] or [{ session_id, ... }]
      const rows = Array.isArray(res.data) ? res.data : []
      const normalized: ChatSession[] = rows
        .map((r: any) => ({
          session_id: Number(r.session_id ?? r.id),
          title: r.title ?? null,
          created_at: r.created_at,
        }))
        .filter((r: ChatSession) => Number.isFinite(r.session_id))
      setSessions(normalized)
    } catch (err) {
      if (axios.isCancel(err)) return
      const e = err as AxiosError
      console.error("Error fetching sessions:", e)
      setError("Could not load sessions")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [userId, apiBaseUrl])

  // If parent creates/sets a new currentSessionId that we don't yet have,
  // refetch to include it so the sidebar updates immediately.
  useEffect(() => {
    if (!currentSessionId || sessions.some((s) => s.session_id === currentSessionId)) return
    fetchSessions()
  }, [currentSessionId])

  /** ---------- Auto-update session title when first user message arrives ---------- */
  useEffect(() => {
    if (!lastUserMessage || !currentSessionId) return
    const session = sessions.find((s) => s.session_id === currentSessionId)
    const isDefaultTitle = (title: string | null | undefined) => {
      if (!title) return true
      const n = title.trim().toLowerCase()
      const tNew = (t.newChat || "").trim().toLowerCase()
      return n === "new chat" || n === "new chatt" || n === tNew || n.startsWith("new chat")
    }
    if (session && isDefaultTitle(session.title)) {
      const newTitle = lastUserMessage.slice(0, 40)
      // Update backend (FastAPI expects raw string body for `title: str = Body(...)`)
      axios
        .patch(`${apiBaseUrl}/chat/session/${currentSessionId}`, newTitle, {
          headers: { "Content-Type": "application/json" },
        })
        .catch((err) => console.error("Error updating title:", err))
      // update local immediately
      setSessions((prev) =>
        prev.map((s) => (s.session_id === currentSessionId ? { ...s, title: newTitle } : s))
      )
    }
  }, [lastUserMessage, currentSessionId, sessions, apiBaseUrl])

  // Focus search input when opening the search panel
  useEffect(() => {
    if (expand && searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [expand, searchOpen])

  /** ---------- Select session ---------- */
  const handleSelect = async (sessionId: number) => {
    try {
      const res = await axios.get(`${apiBaseUrl}/chat/messages/${sessionId}`)
      const messages = (res.data || []).map((m: any) => ({ role: m.role, text: m.content }))
      onSelectSession(sessionId, messages)
    } catch (err) {
      console.error("Error fetching messages:", err)
      onSelectSession(sessionId, [])
    }
  }

  /** ---------- Delete a session ---------- */
  const handleDelete = async (sessionId: number) => {
    if (!sessionId) return
    const ok = window.confirm("Delete this chat? This cannot be undone.")
    if (!ok) return
    try {
      setDeletingId(sessionId)
      // Try external API first, then fallback
      let ok = false
      try {
        await axios.delete(`${apiBaseUrl}/chat/session/${sessionId}`)
        ok = true
      } catch (e) {
        try {
          await axios.delete(`/api/chat/session/${sessionId}`)
          ok = true
        } catch (e2) {
          // ignore for now; we'll verify by refetching
          console.warn("Both delete endpoints failed, verifying with refetch", e2)
        }
      }

      // Optimistically remove from list
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId))
      // Verify with server
      await fetchSessions()
      // If still present after refetch, notify user
      setSessions((prev) => {
        const exists = prev.some((s) => s.session_id === sessionId)
        if (exists) {
          alert("Server did not delete this chat. Please try again later.")
        }
        return prev
      })
    } catch (err: any) {
      console.error("Error deleting session:", err)
      // Keep UI removed even if server failed
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId))
    } finally {
      setDeletingId(null)
    }
  }

  /** ---------- Create new session ---------- */
  const handleCreate = async () => {
    if (!userId) return
    try {
      setCreating(true)
      const formData = new FormData()
      formData.append("user_id", userId)
      formData.append("title", "New Chat")

      const res = await axios.post(`${apiBaseUrl}/chat/session`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const sid = res.data?.session_id ?? res.data?.id
      if (sid) {
        try {
          // Persist and hard-reload so the app boots into this fresh session
          localStorage.setItem("current_session_id", String(sid))
          localStorage.removeItem("chat_messages")
        } catch {}
        // Reload the page before showing the new chat
        window.location.reload()
        return
      }
    } catch (err: any) {
      console.error("Error creating new chat session:", err.response?.data || err.message)
    } finally {
      setCreating(false)
    }
  }

  /** ---------- Search user questions ---------- */
  const runSearch = async (q: string) => {
    if (!userId) {
      setSearchResults([])
      setSearchError("Sign in to search")
      return
    }
    if (!q.trim()) {
      setSearchResults([])
      setSearchError(null)
      return
    }
    try {
      setSearching(true)
      setSearchError(null)
      // cancel any in-flight search
      searchCancelRef.current?.cancel("new-search")
      searchCancelRef.current = axios.CancelToken.source()
      const res = await axios.get(`${apiBaseUrl}/chat/search`, {
        params: { user_id: userId, q: q.trim() },
        cancelToken: searchCancelRef.current.token,
      })
      const rows = Array.isArray(res.data) ? res.data : []
      const normalized = rows.map((r: any) => ({
        session_id: Number(r.session_id ?? r.id),
        title: r.title ?? null,
        content: String(r.content ?? ""),
        created_at: r.created_at,
      }))
      setSearchResults(normalized)
      if (normalized.length === 0) {
        setSearchError("No matches")
      }
    } catch (err) {
      if (axios.isCancel(err)) return
      console.error("Error searching:", err)
      setSearchResults([])
      setSearchError("Search failed. Try again.")
    } finally {
      setSearching(false)
    }
  }

  // Debounced live search as user types while open
  useEffect(() => {
    if (!expand || !searchOpen) return
    if (searchQuery.trim().length === 0) {
      setSearchError(null)
      setSearchResults([])
      return
    }
    const t = setTimeout(() => runSearch(searchQuery), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchOpen, expand])

  /** ---------- Desktop Sidebar ---------- */
function SidebarBody() {
  return (
    // The pb-4 adds some padding at the very bottom
    <div className="flex h-full w-full flex-col pb-4">
      {/* --- TOP SECTION --- */}
      {/* Search trigger (above New Chat) */}
      <ul className="mt-2 w-full space-y-1 px-2">
        <li>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm",
              "transition-colors hover:bg-accent focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            title="Search chats"
            aria-label="Search chats"
          >
            <Search className="h-5 w-5" />
            {expand && <span>Search chats</span>}
          </button>
        </li>
      </ul>

      {/* Inline search form when opened */}
      {expand && searchOpen && (
        <form
          className="px-2 pb-2 flex items-center gap-2 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          onSubmit={(e) => {
            e.preventDefault()
            runSearch(searchQuery)
          }}
        >
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your questions..."
            autoFocus
            type="search"
            className="h-8 w-full caret-foreground text-foreground"
          />
          <Button size="sm" type="submit" disabled={searching} className="shrink-0">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
          </Button>
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setSearchResults([])
              }}
            >
              Clear
            </Button>
          )}
        </form>
      )}

      

      {/* New chat button */}
      <ul className="mt-2 w-full space-y-1 px-2">
        <li>
          <button
            onClick={handleCreate}
            disabled={creating}
            className={cn(
              "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm",
              "transition-colors hover:bg-accent focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            title="New chat"
          >
            {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <SquarePen className="h-5 w-5" />}
            {expand && <span>{t.newChat}</span>}
          </button>
        </li>
      </ul>
      <Separator className="my-3" />
      <div className="px-4 pb-1 text-xs font-medium text-muted-foreground">{t.chats}</div>

      {/* --- MIDDLE SECTION (EXPANDS) --- */}
      {/* The flex-1 class makes this section grow and push the download button down */}
      <div className="flex-1 px-2 pb-2">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (expand && searchOpen) ? (
          <ScrollArea className="h-full pr-2">
            <div className="space-y-1">
              {searching && (
                <div className="text-sm text-muted-foreground px-2 py-1">Searching...</div>
              )}
              {searchError && (
                <div className="text-sm text-muted-foreground px-2 py-1">{searchError}</div>
              )}
              {!searchError && !searching && searchResults.length > 0 && (
                searchResults.map((r, i) => {
                  const label = r.title || `Chat ${r.session_id}`
                  const snippet = r.content
                  return (
                    <button
                      key={`${r.session_id}-${i}`}
                      onClick={() => {
                        handleSelect(r.session_id)
                        setSearchOpen(false)
                      }}
                      className={cn(
                        "w-full rounded px-3 py-2 text-left text-sm hover:bg-accent",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      )}
                      title={label}
                    >
                      <div className="min-w-0">
                        <div className="block overflow-hidden text-ellipsis whitespace-nowrap font-medium">{label}</div>
                        <div className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
                          {snippet}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        ) : sessions.length === 0 ? (
          <div className="text-sm text-muted-foreground"></div>
        ) : (
          <ScrollArea className="h-full pr-2">
            <div className="space-y-1">
              {sessions.map((s) => {
                const active = s.session_id === currentSessionId;
                const label = s.title || `Chat ${s.session_id}`;
                return (
                  <Tooltip key={s.session_id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          // two columns: title grows, icon stays visible
                          "group grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded px-2 py-2 text-sm",
                          "transition-colors hover:bg-accent focus-visible:outline-none",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          active && "bg-accent"
                        )}
                        aria-current={active ? "page" : undefined}
                        title={label}
                      >
                        <button
                          onClick={() => handleSelect(s.session_id)}
                          className="min-w-0 text-left outline-none"
                        >
                          {expand ? (
                            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </button>
                        {expand && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(s.session_id) }}
                            title="Delete chat"
                            aria-label="Delete chat"
                            className={cn(
                              "rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                              "opacity-70 group-hover:opacity-100"
                            )}
                            disabled={deletingId === s.session_id}
                          >
                            <Trash2 className={cn("h-4 w-4", deletingId === s.session_id && "animate-pulse")} />
                          </button>
                        )}
                      </div>
                    </TooltipTrigger>
                    {!expand && <TooltipContent side="right">{label}</TooltipContent>}
                  </Tooltip>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* --- BOTTOM SECTION (PINNED TO BOTTOM) --- */}
      {/* This section is now at the end, so it will appear at the bottom */}
      {currentSessionId && expand && (
        <>
          <Separator className="my-3" />
          <div className="px-2 py-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>{t.download}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => handleDownload("pdf")}>
                  PDF Document (.pdf)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDownload("docx")}>
                  Word Document (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDownload("csv")}>
                  CSV Spreadsheet (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
}

  /** ---------- Mobile Sidebar ---------- */
  function MobileSidebarBody() {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="flex items-center justify-between px-3 py-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{t.chats}</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search"
                onClick={() => setSearchOpen((v) => !v)}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button onClick={handleCreate} disabled={creating} size="sm" className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <SquarePen className="h-4 w-4" />}
                <span className="text-sm">{t.newChat}</span>
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close sidebar">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
          </div>
          {searchOpen && (
            <form
              className="px-3 pb-3 flex items-center gap-2"
              onSubmit={(e) => { e.preventDefault(); runSearch(searchQuery) }}
            >
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your questions..."
                className="h-9 flex-1"
              />
              <Button size="sm" type="submit" disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
              </Button>
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-600">{error}</div>
          ) : (searchOpen && searchQuery.trim()) ? (
            <div className="p-2">
              {searching ? (
                <div className="text-sm text-muted-foreground px-2 py-1">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-sm text-muted-foreground px-2 py-1">No matches</div>
              ) : (
                <ul className="space-y-1">
                  {searchResults.map((r, i) => {
                    const label = r.title || `Chat ${r.session_id}`
                    return (
                      <li key={`${r.session_id}-${i}`}>
                        <button
                          onClick={() => { handleSelect(r.session_id); setSearchOpen(false) }}
                          className={cn(
                            "w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          )}
                          title={label}
                        >
                          <div className="block overflow-hidden text-ellipsis whitespace-nowrap font-medium">{label}</div>
                          <div className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
                            {r.content}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No sessions yet. Start one with <span className="font-medium">New chat</span>.
            </div>
          ) : (
            <ul className="p-2">
              {sessions.map((s) => {
                const active = s.session_id === currentSessionId
                const label = s.title || `Chat ${s.session_id}`
                return (
                  <li key={s.session_id} className="py-1">
                    <div
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        // grid preserves space for delete icon; text truncates
                        "group grid w-full grid-cols-[1fr_auto] items-center rounded-xl px-3 py-3",
                        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        active ? "bg-accent" : "hover:bg-accent/60"
                      )}
                      title={label}
                    >
                      <button onClick={() => handleSelect(s.session_id)} className="min-w-0 text-left">
                        <div className="block overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">{label}</div>
                        {s.created_at && (
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {new Date(s.created_at).toLocaleString()}
                          </div>
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(s.session_id) }}
                        title="Delete chat"
                        aria-label="Delete chat"
                        className="ml-2 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        disabled={deletingId === s.session_id}
                      >
                        <Trash2 className={cn("h-4 w-4", deletingId === s.session_id && "animate-pulse")} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      {/* Desktop */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 min-h-screen border-r bg-background/95 backdrop-blur transition-[width] duration-300 ease-out",
          expand ? "w-64" : "w-14"
        )}
      >
        {/* toggle */}
        <div className="absolute left-2 top-3 hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpand((e) => !e)}
            aria-label={expand ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={expand}
          >
            {expand ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* content */}
        <div className="flex w-full pt-10">
          <SidebarBody />
        </div>
      </aside>

      {/* Mobile */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-2 top-3 z-50 md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="flex h-dvh w-[88vw] max-w-[22rem] flex-col p-0 md:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>{t.chats}</SheetTitle>
          </SheetHeader>
          <MobileSidebarBody />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}
