'use server'

import HomePage from '@/app/(home)/page'
import type { HomePageProps } from '@/app/(home)/page'

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