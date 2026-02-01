"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Bell } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

type ProfileLite = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type NotifRowDb = {
  id: string
  user_id: string
  actor_id: string | null
  type: string
  entity_type: string | null
  entity_id: string | null
  payload: Record<string, unknown> | null
  created_at: string

  // join (may be null if actor_id null / no relation)
  actor?: ProfileLite | null
}

type NotifNormalized = {
  id: string
  created_at: string
  type: string
  payload: Record<string, unknown>
  actor_display_name: string | null
  actor_username: string | null
  actor_avatar_url: string | null
}

type NotifGroup = {
  key: string
  type: string
  created_at: string
  rows: NotifNormalized[]
  actor_display_names: string[]
  actor_avatars: (string | null)[]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v)
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null
}

function titleFromPayload(payload: Record<string, unknown>): string | null {
  return (
    str(payload.post_title) ||
    str(payload.title) ||
    str((payload.post as any)?.title) || // safe-ish fallback (not any in types, only runtime)
    null
  )
}

function messageFromPayload(payload: Record<string, unknown>): string | null {
  return str(payload.message) || null
}

function reasonFromPayload(payload: Record<string, unknown>): string | null {
  return str(payload.reason) || null
}

function postSlugFromPayload(payload: Record<string, unknown>): string | null {
  return str(payload.post_slug) || null
}

function actorFromPayload(payload: Record<string, unknown>): string | null {
  return (
    str(payload.actor_display_name) ||
    str(payload.actor_username) ||
    str(payload.from_user_name) ||
    str(payload.from_user_display_name) ||
    null
  )
}

function normalizeRow(r: NotifRowDb): NotifNormalized {
  const payload = isRecord(r.payload) ? r.payload : {}
  const action = isRecord(payload) ? str(payload.action) : null
  const type = action ?? r.type

  const actor = r.actor ?? null
  const actor_display_name = actor?.display_name || actor?.username || actorFromPayload(payload)
  const actor_username = actor?.username || null
  const actor_avatar_url = actor?.avatar_url || null

  return {
    id: r.id,
    created_at: r.created_at,
    type,
    payload,
    actor_display_name,
    actor_username,
    actor_avatar_url,
  }
}

function groupKey(n: NotifNormalized): string {
  // group by (type + entity(post) id if exists + title + slug) to prevent weird mixing
  const p = n.payload
  const postId = str(p.post_id) || str(p.entity_id) || ""
  const slug = postSlugFromPayload(p) || ""
  const title = titleFromPayload(p) || ""
  return [n.type, postId, slug, title].join("|")
}

function formatActorName(n: NotifNormalized, fallback = "מישהו"): string {
  return n.actor_display_name || actorFromPayload(n.payload) || fallback
}

function formatActors(names: string[]): string {
  const uniq = Array.from(new Set(names.filter(Boolean)))
  if (uniq.length === 0) return "מישהו"
  if (uniq.length === 1) return uniq[0]!
  if (uniq.length === 2) return `${uniq[0]} ו-${uniq[1]}`
  return `${uniq[0]} ועוד ${uniq.length - 1}`
}

function formatDateTime(iso: string): string {
  // dd.mm.yyyy · hh:mm
  const d = new Date(iso)
  const pad = (x: number) => String(x).padStart(2, "0")
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [groups, setGroups] = useState<NotifGroup[]>([])
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) {
        setGroups([])
        setUnread(0)
        return
      }

      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          id, user_id, actor_id, type, entity_type, entity_id, payload, created_at,
          actor:profiles!notifications_actor_id_fkey (id, username, display_name, avatar_url)
        `
        )
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(200)

      if (error) throw error

      const rows = (data ?? []) as NotifRowDb[]
      const norm = rows.map(normalizeRow)

      // unread: simplest = count of unseen in payload? if you have a column, change here.
      // fallback: show 0 (no badge spam) unless you have real unread logic.
      // If you DO have "read_at" column in notifications, we can use it.
      // For now: badge = total (you can replace later).
      setUnread(norm.length)

      const map = new Map<string, NotifGroup>()
      for (const n of norm) {
        const key = groupKey(n)
        const g = map.get(key)
        const actorName = formatActorName(n, "")
        if (!g) {
          map.set(key, {
            key,
            type: n.type,
            created_at: n.created_at,
            rows: [n],
            actor_display_names: actorName ? [actorName] : [],
            actor_avatars: [n.actor_avatar_url ?? null],
          })
        } else {
          g.rows.push(n)
          g.created_at = g.created_at > n.created_at ? g.created_at : n.created_at
          if (actorName) g.actor_display_names.push(actorName)
          g.actor_avatars.push(n.actor_avatar_url ?? null)
        }
      }

      const arr = Array.from(map.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      setGroups(arr)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearAll = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser()
    const uid = u.user?.id
    if (!uid) return

    const { error } = await supabase.from("notifications").delete().eq("user_id", uid)
    if (!error) {
      setGroups([])
      setUnread(0)
    } else {
      // אם תרצה: טוסט יפה
      alert(error.message)
    }
  }, [])

  // close on click outside
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const el = wrapRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  // load once + realtime refresh
  useEffect(() => {
    void load()

    const ch = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => void load()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(ch)
    }
  }, [load])

  const renderText = useCallback((g: NotifGroup) => {
    const first = g.rows[0]
    const payload = first?.payload ?? {}
    const title = titleFromPayload(payload)
    const slug = postSlugFromPayload(payload)
    const reason = reasonFromPayload(payload)

    const actor = g.type === "system_message" || g.type === "post_deleted"
      ? "מערכת האתר"
      : formatActors(g.actor_display_names)

    // SYSTEM MESSAGE: 2 lines (title then message). If no message => only title line.
    if (g.type === "system_message") {
      const t = title ?? "הודעה ממערכת האתר"
      const m = messageFromPayload(payload)
      return (
        <div className="text-right leading-snug">
          <div className="font-semibold">הודעה ממערכת האתר: "{t}"</div>
          {m ? <div className="text-neutral-600 mt-0.5">{m}</div> : null}
        </div>
      )
    }

    // POST DELETED: 2 lines, show reason if exists
    if (g.type === "post_deleted") {
      const t = title ?? "פוסט"
      return (
        <div className="text-right leading-snug">
          <div className="font-semibold">הפוסט "{t}" נמחק ע"י מערכת האתר</div>
          {reason ? <div className="text-neutral-600 mt-0.5">סיבה: {reason}</div> : null}
        </div>
      )
    }

    const verbMap: Record<string, { phrase: string; href?: string | null }> = {
      new_post: { phrase: 'העלה/תה פוסט חדש', href: slug ? `/post/${slug}` : null },
      reaction: { phrase: 'דירג/ה לפוסט שלך', href: slug ? `/post/${slug}` : null },
      comment: { phrase: 'הגיב/ה לפוסט שלך', href: slug ? `/post/${slug}` : null },
      comment_like: { phrase: 'עשה/ה לייק לתגובה שלך', href: slug ? `/post/${slug}` : null },
    }

    const info = verbMap[g.type] ?? { phrase: "שלח/ה עדכון", href: null }

    const line = (
      <span>
        <span className="font-semibold">{actor}</span> {info.phrase}
        {title ? `: "${title}"` : ""}
      </span>
    )

    if (info.href) {
      return (
        <Link href={info.href} className="hover:underline">
          {line}
        </Link>
      )
    }

    return line
  }, [])

  const emptyState = (
    <div className="py-10 text-center text-sm text-neutral-600">
      אין התראות
    </div>
  )

  return (
    <div className="relative" ref={wrapRef} dir="rtl">
      <button
        type="button"
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) void load()
        }}
        className="relative p-2 rounded-lg hover:bg-neutral-300 transition-all duration-200"
        title="התראות"
        aria-label="התראות"
      >
        <Bell size={20} strokeWidth={2.5} className="text-neutral-700" />
        {unread > 0 ? (
          <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="hidden lg:block absolute top-full left-0 mt-2 w-96 max-h-[500px] rounded-xl bg-white shadow-xl border border-neutral-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="sticky top-0 z-10 bg-gradient-to-b from-neutral-100 to-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">התראות</h3>
            <button
              onClick={() => void clearAll()}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 px-2 py-1 rounded-lg transition-colors"
            >
              נקה הכל
            </button>
          </div>

          <div className="max-h-[440px] overflow-auto">
            {loading ? (
              <div className="py-10 text-center text-sm text-neutral-600">טוען...</div>
            ) : groups.length === 0 ? (
              emptyState
            ) : (
              <div className="p-2 space-y-2">
                {groups.map((g) => (
                  <div
                    key={g.key}
                    className="group cursor-pointer rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition px-3 py-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                        {/* avatar if exists */}
                        {g.actor_avatars.find(Boolean) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={g.actor_avatars.find(Boolean) as string}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-neutral-700">
                            {(g.type === "system_message" || g.type === "post_deleted") ? "מ" : "מ"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="text-sm text-neutral-900 text-right">
                          {renderText(g)}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500 text-right">
                          {formatDateTime(g.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
