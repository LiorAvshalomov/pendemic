'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent, JSONContent, useEditor, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import CharacterCount from '@tiptap/extension-character-count'

import { supabase } from '@/lib/supabaseClient'

type Props = {
  value: JSONContent
  onChange: (next: JSONContent) => void

  // חובה בשביל העלאת תמונות לטיוטה פרטית
  postId?: string | null

  // אופציונלי (אם יש לך userId בדף write, תעביר אותו כדי לחסוך getUser)
  userId?: string | null
}

const EMPTY_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] }

function Btn({
  label,
  onClick,
  active,
  disabled,
  subtle,
}: {
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  subtle?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '6px 10px',
        borderRadius: 10,
        border: '1px solid #ddd',
        background: active ? '#111' : subtle ? '#fafafa' : '#fff',
        color: active ? '#fff' : '#111',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {label}
    </button>
  )
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid #e5e5e5',
        background: '#fff',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {label}
    </button>
  )
}

const COLOR_SWATCHES = [
  { name: 'שחור', value: '#111111' },
  { name: 'אדום', value: '#D92D20' },
  { name: 'כתום', value: '#F97316' },
  { name: 'ירוק', value: '#16A34A' },
  { name: 'כחול', value: '#2563EB' },
  { name: 'סגול', value: '#7C3AED' },
]

const HIGHLIGHTS = [
  { name: 'צהוב', value: '#FDE68A' },
  { name: 'ורוד', value: '#FBCFE8' },
  { name: 'ירוק', value: '#BBF7D0' },
  { name: 'כחול', value: '#BFDBFE' },
]

function findImagePaths(json: JSONContent): string[] {
  const out: string[] = []

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }

    if (n.type === 'image' && n.attrs && typeof n.attrs.path === 'string') {
      out.push(n.attrs.path)
    }
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }

  walk(json)
  return out
}

function replaceImageSrcByPath(json: JSONContent, pathToSrc: Record<string, string>): JSONContent {
  // structuredClone נתמך בדפדפנים מודרניים; אם תרצה fallback בהמשך — נגשר.
  const clone = structuredClone(json) as unknown as {
    type?: string
    attrs?: Record<string, unknown>
    content?: unknown[]
  }

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }

    if (n.type === 'image' && n.attrs && typeof n.attrs.path === 'string') {
      const p = n.attrs.path
      const signed = pathToSrc[p]
      if (signed) n.attrs.src = signed
    }
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }

  walk(clone)
  return clone as unknown as JSONContent
}

function extractYoutubeId(inputUrl: string): string | null {
  const clean = inputUrl.replace(/[\u200E\u200F\u202A-\u202E]/g, '').trim()
  if (!clean) return null

  // Ensure URL() can parse even if scheme missing
  const withScheme = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`

  try {
    const u = new URL(withScheme)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname || ''

    // youtu.be/<id>
    if (host === 'youtu.be') {
      const id = path.split('/').filter(Boolean)[0]
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
    }

    // *.youtube.com, *.youtube-nocookie.com (including music.youtube.com, m.youtube.com)
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      // /watch?v=<id>
      const v = u.searchParams.get('v')
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v

      // /shorts/<id>, /embed/<id>, /v/<id>, /live/<id>
      const parts = path.split('/').filter(Boolean)
      const idx = parts.findIndex((p) => ['shorts', 'embed', 'v', 'live'].includes(p))
      const id = idx >= 0 ? parts[idx + 1] : parts[0]
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
    }
  } catch {
    // fall through to regex fallback
  }

  // Regex fallback for odd share formats / redirects
  const m =
    clean.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/))([a-zA-Z0-9_-]{11})/) ??
    null
  return m ? m[1] : null
}

function ImageNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const raw = node.attrs.widthPercent as number | null | undefined
  const wp = raw === 33 || raw === 66 ? raw : 100
  const nextWidth = () => {
    const cycle: Record<number, number> = { 100: 33, 33: 66, 66: 100 }
    updateAttributes({ widthPercent: cycle[wp] ?? 100 })
  }
  const label = wp === 33 ? 'S' : wp === 66 ? 'M' : 'L'

  return (
    <NodeViewWrapper className="relative block" style={{ width: `${wp}%` }}>
      <img
        src={(node.attrs.src as string) || ''}
        alt={(node.attrs.alt as string) ?? ''}
        style={{ width: '100%', borderRadius: 14, display: 'block' }}
        draggable={false}
      />
      <button
        type="button"
        onClick={deleteNode}
        style={{
          position: 'absolute', top: 6, left: 6,
          width: 24, height: 24, borderRadius: 12,
          background: 'rgba(0,0,0,0.6)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <button
        type="button"
        onClick={nextWidth}
        style={{
          position: 'absolute', bottom: 6, left: 6,
          padding: '2px 8px', borderRadius: 8,
          background: 'rgba(0,0,0,0.6)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 11,
          fontWeight: 700,
        }}
      >
        {label}
      </button>
    </NodeViewWrapper>
  )
}

function YoutubeNodeView({ node, deleteNode }: NodeViewProps) {
  const src = node.attrs.src as string
  return (
    <NodeViewWrapper className="relative" style={{ maxWidth: '100%', margin: '10px 0' }}>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 14 }}>
        <iframe
          src={src}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div style={{ marginTop: 6 }}>
        <a
          href={(() => {
            const id = extractYoutubeId(src) ?? ''
            return id ? `https://www.youtube.com/watch?v=${id}` : src
          })()}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13, textDecoration: 'underline', opacity: 0.85 }}
        >
          פתח ביוטיוב
        </a>
      </div>
      <button
        type="button"
        onClick={deleteNode}
        style={{
          position: 'absolute', top: 6, left: 6,
          width: 24, height: 24, borderRadius: 12,
          background: 'rgba(0,0,0,0.6)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1, zIndex: 1,
        }}
      >
        ×
      </button>
    </NodeViewWrapper>
  )
}

export default function Editor({ value, onChange, postId, userId }: Props) {
  const [showMedia, setShowMedia] = useState(false)
  const [showStyle, setShowStyle] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ytError, setYtError] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            path: { default: null },
            widthPercent: { default: 100 },
          }
        },
        addNodeView() {
          return ReactNodeViewRenderer(ImageNodeView)
        },
      }).configure({
        inline: false,
        allowBase64: false,
      }),
      Youtube.extend({
        addNodeView() {
          return ReactNodeViewRenderer(YoutubeNodeView)
        },
      }).configure({
        width: 640,
        height: 360,
        nocookie: true,
        modestBranding: true,
      }),
      CharacterCount,
    ],
    content: EMPTY_DOC,
    editorProps: {
      attributes: {
        dir: 'rtl',
        style:
          'min-height: 320px; padding: 16px; border: 1px solid #ddd; border-radius: 16px; outline: none; line-height: 1.8; background: #fff; font-size: 16px; font-family: var(--font-editor-hebrew), sans-serif;',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON())
    },
  })

  // נטען כל פעם שמגיע value חדש (טעינת טיוטה)
  useEffect(() => {
    if (!editor) return
    const next = value ?? EMPTY_DOC

    // רק אם באמת שונה (כדי לא לשרוף undo)
    try {
      const current = editor.getJSON()
      if (JSON.stringify(current) === JSON.stringify(next)) return
    } catch {
      // ignore
    }

    editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, value])

  // רענון Signed URLs לתמונות פרטיות כשפותחים/טוענים טיוטה
  useEffect(() => {
    if (!editor) return

    const refresh = async () => {
      const json = editor.getJSON()
      const paths = Array.from(new Set(findImagePaths(json)))
      if (paths.length === 0) return

      const map: Record<string, string> = {}

      for (const p of paths) {
        const { data, error } = await supabase.storage.from('post-assets').createSignedUrl(p, 60 * 60)
        if (!error && data?.signedUrl) map[p] = data.signedUrl
      }

      if (Object.keys(map).length === 0) return

      const next = replaceImageSrcByPath(json, map)
      editor.commands.setContent(next, { emitUpdate: false })
    }

    void refresh()
  }, [editor, postId])

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('הדבק קישור:', prev ?? '')
    if (url === null) return

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    const { from, to } = editor.state.selection
    if (from === to) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: url.trim(),
          marks: [{ type: 'link', attrs: { href: url.trim() } }],
        })
        .run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    }
  }, [editor])

  const addYoutube = useCallback(() => {
    if (!editor) return
    const url = window.prompt('הדבק לינק YouTube:')
    if (!url) return
    const cleanUrl = url.replace(/[\u200E\u200F\u202A-\u202E]/g, '').trim()
    const videoId = extractYoutubeId(cleanUrl)
    if (!videoId) {
      setYtError('לא הצלחתי לזהות סרטון YouTube מהקישור')
      return
    }
    setYtError('')
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`
    editor.chain().focus().setYoutubeVideo({ src: embedUrl }).run()
  }, [editor])

  const triggerImagePick = useCallback(() => {
    if (!postId) {
      alert('עוד רגע 🙂 קודם תן לטיוטה להיווצר (לחכות לשמירה הראשונה)')
      return
    }
    fileInputRef.current?.click()
  }, [postId])

  const onPickImage = useCallback(
    async (file: File | null) => {
      if (!editor) return
      if (!file) return
      if (!postId) return

      setUploading(true)

      let uid = userId ?? null
      if (!uid) {
        const { data } = await supabase.auth.getUser()
        uid = data.user?.id ?? null
      }

      if (!uid) {
        setUploading(false)
        alert('צריך להתחבר כדי להעלות תמונה')
        return
      }

      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'jpg'

      // ⚠️ כאן חשוב: ב-bucket name הוא post-assets, ו-name הוא הנתיב בתוך הבקט
      const uuid =
        typeof globalThis !== 'undefined' &&
        'crypto' in globalThis &&
        (globalThis.crypto as Crypto | undefined)?.randomUUID
          ? (globalThis.crypto as Crypto).randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const path = `${uid}/${postId}/${uuid}.${safeExt}`

      const { error } = await supabase.storage.from('post-assets').upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      })

      if (error) {
        console.error(error)
        setUploading(false)
        alert(error.message)
        return
      }

      const { data: signed, error: signErr } = await supabase.storage
        .from('post-assets')
        .createSignedUrl(path, 60 * 60)

      if (signErr || !signed?.signedUrl) {
        console.error(signErr)
        setUploading(false)
        alert('התמונה עלתה, אבל לא הצלחתי להציג אותה כרגע. נסה רענון.')
        return
      }

      // כדי להימנע מ-any: נכניס Node JSON ישירות
      const imageNode: JSONContent = {
        type: 'image',
        attrs: {
          src: signed.signedUrl,
          alt: file.name,
          path, // נשמר כדי שנוכל לרענן signedUrl
        },
      }

      editor.chain().focus().insertContent(imageNode).run()

      setUploading(false)
    },
    [editor, postId, userId]
  )

  if (!editor) return null

  const words = editor.storage.characterCount.words()
  const chars = editor.storage.characterCount.characters()

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: 10,
          border: '1px solid #eee',
          borderRadius: 16,
          background: '#fafafa',
          direction: 'rtl',
          alignItems: 'center',
        }}
      >
        <Btn
          label="H2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <Btn
          label="H3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />

        <Btn
          label="מודגש"
          active={editor.isActive('bold')}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <Btn
          label="נטוי"
          active={editor.isActive('italic')}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <Btn
          label="קו תחתון"
          active={editor.isActive('underline')}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />

        <Btn
          label="ציטוט"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />

        <Btn
          label="• רשימה"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <Btn
          label="1. רשימה"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />

        <Btn label="קו" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        <Btn label="קישור" active={editor.isActive('link')} onClick={setLink} />

        <Btn
          label={showMedia ? '× מדיה' : '+ מדיה'}
          subtle
          onClick={() => {
            setShowMedia(v => !v)
            setShowStyle(false)
          }}
        />
        <Btn
          label={showStyle ? '× עיצוב' : 'עיצוב'}
          subtle
          onClick={() => {
            setShowStyle(v => !v)
            setShowMedia(false)
          }}
        />

        <span style={{ flex: 1 }} />

        <Btn
          label="בטל"
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <Btn
          label="החזר"
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
        />

        <div style={{ fontSize: 12, opacity: 0.8, marginInlineStart: 10, fontWeight: 800 }}>
          {words} מילים · {chars} תווים
        </div>
      </div>

      {showMedia && (
        <div
          style={{
            border: '1px solid #eee',
            borderRadius: 16,
            padding: 10,
            background: '#fff',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <Chip
            label={uploading ? 'מעלה תמונה…' : 'העלה תמונה'}
            onClick={() => {
              if (uploading) return
              triggerImagePick()
            }}
          />
          <Chip label="YouTube" onClick={addYoutube} />
          <Chip label="מפריד" onClick={() => editor.chain().focus().setHorizontalRule().run()} />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0] ?? null
              void onPickImage(f)
              e.currentTarget.value = ''
            }}
          />

          <div style={{ fontSize: 12, opacity: 0.8, marginInlineStart: 8 }}>
            תמונות בטיוטות נשמרות כפרטיות.
          </div>
          {ytError && (
            <div style={{ fontSize: 12, color: '#D92D20', fontWeight: 700, width: '100%' }}>
              {ytError}
            </div>
          )}
        </div>
      )}

      {showStyle && (
        <div
          style={{
            border: '1px solid #eee',
            borderRadius: 16,
            padding: 10,
            background: '#fff',
            display: 'grid',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75, marginInlineEnd: 6 }}>
              צבע טקסט:
            </div>

            {COLOR_SWATCHES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => editor.chain().focus().setColor(c.value).run()}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid #e5e5e5',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 900,
                  color: c.value,
                }}
              >
                {c.name}
              </button>
            ))}

            <Btn label="אפס צבע" subtle onClick={() => editor.chain().focus().unsetColor().run()} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75, marginInlineEnd: 6 }}>
              הדגשה:
            </div>

            {HIGHLIGHTS.map(h => (
              <button
                key={h.value}
                type="button"
                onClick={() => editor.chain().focus().toggleHighlight({ color: h.value }).run()}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid #e5e5e5',
                  background: h.value,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {h.name}
              </button>
            ))}

            <Btn
              label="הסר הדגשה"
              subtle
              onClick={() => editor.chain().focus().unsetHighlight().run()}
            />
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}
