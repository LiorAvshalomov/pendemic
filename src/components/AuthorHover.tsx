'use client'

/**
 * AuthorHover — wraps any author display element and shows a hover profile card.
 * Desktop (hover-capable devices): debounced mouseEnter (150 ms) opens card.
 * Mobile / touch-only devices: no card — tap navigates normally via the child Link.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const HoverProfileCard = dynamic(() => import('./HoverProfileCard'), { ssr: false })

export default function AuthorHover({
  username,
  children,
}: {
  username: string
  children: React.ReactNode
}) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Set once on mount — avoids calling matchMedia on every mouseenter
  const canHoverRef = useRef(false)

  useEffect(() => {
    canHoverRef.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const scheduleOpen = useCallback(() => {
    if (!canHoverRef.current) return // touch device — do nothing
    clearTimer()
    timerRef.current = setTimeout(() => setOpen(true), 150)
  }, [clearTimer])

  const scheduleClose = useCallback(() => {
    if (!canHoverRef.current) return
    clearTimer()
    timerRef.current = setTimeout(() => setOpen(false), 220)
  }, [clearTimer])

  const keepOpen = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  const close = useCallback(() => {
    clearTimer()
    setOpen(false)
  }, [clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  return (
    <span
      ref={anchorRef}
      className="inline-flex relative pointer-events-auto"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      {children}
      {open ? (
        <HoverProfileCard
          username={username}
          anchorEl={anchorRef.current}
          onClose={close}
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleClose}
        />
      ) : null}
    </span>
  )
}
