import { Languages } from 'lucide-react'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type Lang = 'en' | 'my'

const STORAGE_KEY = 'lang'

const DICT = {
  en: {
    'brand.tagline': 'Add Text On Photo',

    'home.badge.fonts': 'Fonts',
    'home.badge.colors': 'Colors',
    'home.badge.effects': 'Effects',
    'home.title.pre': 'Add ',
    'home.title.text': 'Text',
    'home.title.post': ' to Your Photos',
    'home.subtitle': 'Start from a photo, a color, or open a saved project.',
    'home.tab.create': 'Background',
    'home.tab.templates': 'Templates',
    'home.tab.gallery': 'Gallery',
    'home.tab.colors': 'Colors',
    'home.tab.projects': 'Projects',
    'home.chooseLibrary': 'Choose from Library',
    'home.takePhoto': 'Take a photo',
    'home.privacy': 'Your photo stays on this device.',
    'home.solidColors': 'Solid colors',
    'home.gradients': 'Gradients',
    'home.noProjects': 'No saved projects yet',
    'home.noProjectsHint':
      'Your saved projects will appear here so you can pick up where you left off.',
    'home.or': 'or',
    'home.templates': 'Start With Templates',
    'home.deleteProject': 'Delete project',

    'settings.title': 'Settings',
    'settings.back': 'Back',
    'settings.language': 'Language',
    'settings.about': 'About us',
    'settings.getPremium': 'Get premium',
    'settings.getPremiumDesc': 'Unlock all pro features, fonts and effects',
    'settings.feedback': 'Feedback',
    'settings.feedbackDesc': 'Tell us what you think',
    'settings.request': 'Request new features',
    'settings.requestDesc': 'Share your ideas with us',
    'settings.aboutDesc': 'Learn more about Myan',
    'settings.rate': 'Rate us on Play Store',
    'settings.rateDesc': 'Support us with a 5 star rating',
    'settings.support': 'Customer support',
    'settings.supportDesc': 'Chat with us directly',
    'settings.logout': 'Log out',
    'settings.login': 'Login to restore',

    'lang.english': 'English',
    'lang.myanmar': 'မြန်မာ',
    'lang.choose': 'Choose language',

    'discard.title': 'Discard your edits?',
    'discard.desc':
      'Your current edits are not saved. Leaving now will clear everything on the canvas.',
    'discard.cancel': 'Keep editing',
    'discard.confirm': 'Discard & exit',

    'template.apply.title': 'Apply template',
    'template.apply.desc': 'Do you want to replace the background with this template, or keep the current background and apply only the text styles?',
    'template.apply.replace': 'Replace background',
    'template.apply.styles': 'Styles only',
    'template.apply.cancel': 'Cancel',
  },
  my: {
    'brand.tagline': 'ဓာတ်ပုံပေါ် စာရေးရန်',

    'home.badge.fonts': 'ဖောင့်များ',
    'home.badge.colors': 'အရောင်များ',
    'home.badge.effects': 'အထူးပြုပြင်မှု',
    'home.title.pre': 'ဓာတ်ပုံပေါ်တွင် ',
    'home.title.text': 'စာသား',
    'home.title.post': ' ထည့်ပါ',
    'home.subtitle': 'ဓာတ်ပုံ၊ အရောင် သို့မဟုတ် သိမ်းထားသော ပရောဂျက်မှ စတင်ပါ။',
    'home.tab.create': 'နောက်ခံ',
    'home.tab.templates': 'တမ်းပလိတ်',
    'home.tab.gallery': 'ပုံများ',
    'home.tab.colors': 'အရောင်',
    'home.tab.projects': 'ပရောဂျက်',
    'home.chooseLibrary': 'ဓာတ်ပုံ ရွေးရန်',
    'home.takePhoto': 'ဓာတ်ပုံ ရိုက်ရန်',
    'home.privacy': 'သင့်ဓာတ်ပုံသည် ဤဖုန်းထဲမှာသာ ရှိပါသည်။',
    'home.solidColors': 'တစ်ရောင်တည်း',
    'home.gradients': 'ရောင်စုံ (Gradient)',
    'home.noProjects': 'သိမ်းထားသော ပရောဂျက် မရှိသေးပါ',
    'home.noProjectsHint': 'သိမ်းထားသော ပရောဂျက်များကို ဤနေရာတွင် ပြန်ဖွင့်နိုင်ပါမည်။',
    'home.or': 'သို့မဟုတ်',
    'home.templates': 'တမ်းပလိတ်ဖြင့် စတင်ပါ',
    'home.deleteProject': 'ပရောဂျက် ဖျက်ရန်',

    'settings.title': 'ဆက်တင်',
    'settings.back': 'နောက်သို့',
    'settings.language': 'ဘာသာစကား',
    'settings.about': 'ကျွန်ုပ်တို့အကြောင်း',
    'settings.getPremium': 'Premium ဝယ်ယူရန်',
    'settings.getPremiumDesc': 'Pro လုပ်ဆောင်ချက်၊ ဖောင့်နှင့် အထူးအင်္ဂါရပ်များ အားလုံး',
    'settings.feedback': 'အကြံပြုချက်',
    'settings.feedbackDesc': 'သင့်အမြင်ကို ပြောပြပါ',
    'settings.request': 'လုပ်ဆောင်ချက်အသစ် တောင်းဆိုရန်',
    'settings.requestDesc': 'သင့်အကြံဉာဏ်များ မျှဝေပါ',
    'settings.aboutDesc': 'Myan အကြောင်း ပိုမိုသိရှိရန်',
    'settings.rate': 'Play Store တွင် အဆင့်သတ်မှတ်ပါ',
    'settings.rateDesc': 'ကြယ် ၅ ပွင့်ဖြင့် အားပေးပါ',
    'settings.support': 'ဖောက်သည် ဝန်ဆောင်မှု',
    'settings.supportDesc': 'ကျွန်ုပ်တို့ထံ တိုက်ရိုက် ဆက်သွယ်ပါ',
    'settings.logout': 'ထွက်ရန်',
    'settings.login': 'ဝင်ရောက်၍ ပြန်လည်ရယူပါ',

    'lang.english': 'English',
    'lang.myanmar': 'မြန်မာ',
    'lang.choose': 'ဘာသာစကား ရွေးပါ',

    'discard.title': 'တည်းဖြတ်မှုကို ဖျက်မလား။',
    'discard.desc':
      'သင်ပြုလုပ်ထားသည်များ သိမ်းထားခြင်း မရှိပါ။ ထွက်လိုက်ပါက အားလုံး ပျောက်ဆုံးသွားပါမည်။',
    'discard.cancel': 'ဆက်တည်းဖြတ်မည်',
    'discard.confirm': 'ဖျက်ပြီး ထွက်မည်',

    'template.apply.title': 'တမ်းပလိတ် ထည့်သွင်းမည်',
    'template.apply.desc': 'ဒီတမ်းပလိတ်၏ နောက်ခံအရောင်ကို အစားထိုးလိုပါသလား၊ သို့မဟုတ် လက်ရှိနောက်ခံကို ထားပြီး စာသားစတိုင်သာ အသုံးပြုလိုပါသလား?',
    'template.apply.replace': 'နောက်ခံ အစားထိုး',
    'template.apply.styles': 'စတိုင်သာ',
    'template.apply.cancel': 'ပယ်မည်',
  },
} as const

export type TranslationKey = keyof (typeof DICT)['en']

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => DICT.en[key] ?? (key as string),
})

export function useI18n() {
  return useContext(I18nContext)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
      if (saved === 'en' || saved === 'my') {
        setLangState(saved)
        document.documentElement.lang = saved === 'my' ? 'my' : 'en'
      }
    } catch {
      // ignore
    }
  }, [])

  const setLang = (next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next === 'my' ? 'my' : 'en'
    }
  }

  const t = (key: TranslationKey) => DICT[lang][key] ?? DICT.en[key] ?? (key as string)

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)

  const options: { id: Lang; label: string }[] = [
    { id: 'en', label: t('lang.english') },
    { id: 'my', label: t('lang.myanmar') },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('lang.choose')} className={className}>
          <Languages className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="glass-panel w-44 border-0 bg-transparent p-1.5 shadow-none"
      >
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              setLang(o.id)
              setOpen(false)
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition active:scale-[0.98] ${
              lang === o.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            {o.label}
            {lang === o.id && <span className="text-xs">✓</span>}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
