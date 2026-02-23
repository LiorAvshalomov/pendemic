/**
 * Shared typography class string applied to BOTH the RichText viewer wrapper
 * and the TipTap EditorContent wrapper, so editor and post page are pixel-identical.
 *
 * Viewer adds:  richtext-viewer w-full max-w-[72ch] ml-auto
 * Editor adds:  whitespace-pre-wrap
 */
export const RICHTEXT_TYPOGRAPHY = [
  'text-right break-words text-[16px] leading-[1.6] text-neutral-900 dark:text-foreground',
  '[&_p]:my-2',
  '[&_h2]:text-3xl [&_h2]:font-black [&_h2]:mt-10 [&_h2]:mb-4',
  '[&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3',
  '[&_h4]:text-xl [&_h4]:font-bold [&_h4]:mt-7 [&_h4]:mb-2',
  '[&_ul]:my-4 [&_ul]:pr-6 [&_ul]:list-disc',
  '[&_ol]:my-4 [&_ol]:pr-6 [&_ol]:list-decimal',
  '[&_li]:my-1 [&_li]:leading-7',
  '[&_a]:text-blue-700 dark:[&_a]:text-blue-400 [&_a]:underline-offset-4 hover:[&_a]:underline',
  '[&_blockquote]:my-6 [&_blockquote]:border-r-4 [&_blockquote]:border-neutral-300',
  'dark:[&_blockquote]:border-neutral-600/50 [&_blockquote]:pr-4 [&_blockquote]:text-neutral-700',
  'dark:[&_blockquote]:text-muted-foreground',
  '[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-2xl',
  '[&_mark]:text-neutral-900',
].join(' ')
