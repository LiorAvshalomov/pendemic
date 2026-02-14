import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "אודות",
  description:
    "Tyuta הוא מקום לכתוב בו באמת. בלי אלגוריתם, בלי מרדף, בלי רעש. מקום לכל הגרסאות שלך.",
  alternates: {
    canonical: "https://tyuta.co.il/about",
  },
  openGraph: {
    title: "אודות Tyuta",
    description:
      "Tyuta נולד כדי לאפשר כתיבה אמיתית. מקום בטוח לשתף, לפרוק, ולהיות.",
    url: "https://tyuta.co.il/about",
    siteName: "Tyuta",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "אודות Tyuta",
    description:
      "המקום לכל הגרסאות שלך. פלטפורמת כתיבה ישראלית, רגישה ובטוחה.",
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="space-y-8 leading-relaxed text-right">
        <h1 className="text-3xl font-semibold">המקום לכל הגרסאות שלך</h1>

        <p>
          Tyuta נולד מתוך צורך פשוט — מקום לכתוב בו בלי להרגיש שאתה על במה.
          בלי מרדף אחרי לייקים. בלי אלגוריתם שמחליט מי ראוי להישמע.
        </p>

        <p>
          יש רגעים שלא מתאימים לאינסטגרם. יש מחשבות שלא שייכות לפיד.
          ויש רגשות שצריכים מרחב שקט, לא קהל.
        </p>

        <p>
          Tyuta הוא לא רשת חברתית.
          הוא לא בלוג שיווקי.
          והוא לא תחרות פופולריות.
        </p>

        <p>
          זה מרחב כתיבה. מקום שבו מותר להיות באמצע.
          לא גמור. לא מלוטש. לא מושלם.
        </p>

        <h2 className="text-xl font-medium pt-6">למה הוא קיים?</h2>

        <p>
          כי לפעמים הדבר הכי חשוב הוא לא להגיע לחשיפה —
          אלא להגיע להבנה.
        </p>

        <p>
          כי יש כוח במילים גם כשהן שקטות.
          כי יש ערך לגרסאות שאנחנו עוד לא בטוחים בהן.
        </p>

        <h2 className="text-xl font-medium pt-6">מה הוא לא?</h2>

        <p>
          Tyuta לא מבטיח ויראליות.
          לא מבטיח קהל.
          לא מבטיח הצלחה.
        </p>

        <p>
          הוא כן מבטיח מרחב מכבד.
          גבולות ברורים.
          ואחריות קהילתית.
        </p>

        <h2 className="text-xl font-medium pt-6">בטיחות וגבולות</h2>

        <p>
          אנחנו מאמינים בחופש ביטוי —
          אבל לא בפגיעה.
        </p>

        <p>
          תוכן פוגעני, מסית, מאיים או כזה שמפר גבולות אנושיים בסיסיים —
          יוסר.
          לפעמים גם בלי אזהרה.
        </p>

        <p>
          Tyuta הוא מקום רגיש.
          והוא צריך להישאר כזה.
        </p>

        <p className="pt-8 text-lg">
          תודה שאתה כאן.
        </p>
      </article>
    </main>
  );
}
