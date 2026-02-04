import HomePage from '@/app/page'

export default async function StoriesPage() {
  return (
    <HomePage
      forcedChannelSlug="stories"
      forcedChannelName="סיפורים"
      forcedSubtitle="הכי חם החודש בקטגוריה"
      forcedSubcategories={[
        { name_he: 'סיפורים אמיתיים' },
        { name_he: 'סיפורים קצרים' },
        { name_he: 'סיפור בהמשכים' },
      ]}
    />
  )
}
