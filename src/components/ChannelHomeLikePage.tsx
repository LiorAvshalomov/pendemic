'use server'

import HomePage from '@/app/page'
import type { HomePageProps } from '@/app/page'

type Props = {
  channelSlug: string
  channelName: string
  subtitle?: string
  subcategories: { name_he: string }[]
}

export default async function ChannelHomeLikePage({
  channelSlug,
  channelName,
  subtitle,
  subcategories,
}: Props) {
  const props: HomePageProps = {
    forcedChannelSlug: channelSlug,
    forcedChannelName: channelName,
    forcedSubtitle: subtitle,
    forcedSubcategories: subcategories,
  }

  return <HomePage {...props} />
}