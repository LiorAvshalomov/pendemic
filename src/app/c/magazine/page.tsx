import HomePage from '@/app/page'

export default async function MagazinePage() {
  return (
    <HomePage
      forcedChannelSlug="magazine"
      forcedChannelName="כתבות"
      forcedSubtitle="הכי חם החודש בקטגוריה"
      forcedSubcategories={[
        { name_he: 'חדשות' },
        { name_he: 'ספורט' },
        { name_he: 'תרבות ובידור' },
        { name_he: 'דעות' },
        { name_he: 'טכנולוגיה' },
      ]}
    />
  )
}
