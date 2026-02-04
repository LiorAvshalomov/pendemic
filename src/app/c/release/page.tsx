import HomePage from '@/app/page'

export default async function ReleasePage() {
  return (
    <HomePage
      forcedChannelSlug="release"
      forcedChannelName="פריקה"
      forcedSubtitle="הכי חם החודש בקטגוריה"
      forcedSubcategories={[
        { name_he: 'וידויים' },
        { name_he: 'מחשבות' },
        { name_he: 'שירים' }
      ]}
    />
  )
}
