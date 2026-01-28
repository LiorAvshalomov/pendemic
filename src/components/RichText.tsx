import React from 'react'

type Mark = {
  type: 'bold' | 'italic' | string
}

type Attrs = {
  level?: number
}

export type RichNode = {
  type?: string
  text?: string
  marks?: Mark[]
  attrs?: Attrs
  content?: RichNode[]
}

type Props = {
  content: RichNode
}

function renderText(node: RichNode, key: string) {
  const text = node.text ?? ''
  const marks = node.marks ?? []

  // TipTap may include "\n" inside text nodes (e.g. pasted content).
  // Convert them to <br/> so line breaks are preserved.
  const parts = text.split(/\n/)
  let out: React.ReactNode =
    parts.length <= 1
      ? text
      : parts.map((p, i) => (
          <React.Fragment key={`${key}-nl-${i}`}>
            {p}
            {i < parts.length - 1 ? <br /> : null}
          </React.Fragment>
        ))

  for (const mark of marks) {
    if (mark.type === 'bold') out = <strong key={`${key}-b`}>{out}</strong>
    if (mark.type === 'italic') out = <em key={`${key}-i`}>{out}</em>
  }

  return <React.Fragment key={key}>{out}</React.Fragment>
}

function renderNode(node: RichNode, key: string): React.ReactNode {
  if (!node || !node.type) return null

  if (node.type === 'text') return renderText(node, key)
  if (node.type === 'hardBreak') return <br key={key} />

  const children = (node.content ?? []).map((c, i) =>
    renderNode(c, `${key}-${i}`)
  )

  switch (node.type) {
    case 'doc':
      return <div key={key}>{children}</div>

    case 'paragraph': {
      const hasContent = Array.isArray(node.content) && node.content.length > 0
      return <p key={key}>{hasContent ? children : <br />}</p>
    }

    case 'heading': {
      const lvl = node.attrs?.level ?? 2
      if (lvl === 3) return <h3 key={key}>{children}</h3>
      if (lvl >= 4) return <h4 key={key}>{children}</h4>
      return <h2 key={key}>{children}</h2>
    }

    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>

    case 'bulletList':
      return <ul key={key}>{children}</ul>

    case 'orderedList':
      return <ol key={key}>{children}</ol>

    case 'listItem':
      return <li key={key}>{children}</li>

    case 'horizontalRule':
      return <hr key={key} />

    default:
      return <span key={key}>{children}</span>
  }
}

export default function RichText({ content }: Props) {
  const normalized: RichNode =
    content && content.type === 'doc'
      ? content
      : { type: 'doc', content: [{ type: 'paragraph', content: [] }] }

return (
  <div
    dir="rtl"
    className="w-full max-w-[72ch] ml-auto text-right break-words text-[16px] leading-8 text-neutral-900 [&_p]:my-2 [&_p]:leading-5 [&_h2]:text-3xl [&_h2]:font-black [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3 [&_h4]:text-xl [&_h4]:font-bold [&_h4]:mt-7 [&_h4]:mb-2 [&_ul]:my-4 [&_ul]:pr-6 [&_ul]:list-disc [&_ol]:my-4 [&_ol]:pr-6 [&_ol]:list-decimal [&_li]:my-1 [&_li]:leading-7 [&_a]:text-blue-700 [&_a]:underline-offset-4 hover:[&_a]:underline [&_blockquote]:my-6 [&_blockquote]:border-r-4 [&_blockquote]:border-neutral-300 [&_blockquote]:pr-4 [&_blockquote]:text-neutral-700 [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-2xl"
  >
    {renderNode(normalized, 'root')}
  </div>
  )
}