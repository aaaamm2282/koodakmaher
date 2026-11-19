# المان‌های الهام‌گرفته از 21st.dev

این سایت حرکت‌ها و جزئیات پویای خود را از چند المان کاتالوگ [21st.dev](https://21st.dev) گرفته است. نسخه‌ی اصلی این المان‌ها با React و کتابخانه‌هایی مثل Framer Motion ساخته شده است. اینجا هیچ‌کدام از آن کتابخانه‌ها نصب نشده و از کد آن‌ها هم کپی نشده است. هر المان از روی رفتار و نمونه‌ی نمایشی‌اش، با Astro، CSS و چند خط TypeScript ساده دوباره ساخته شده است. دلیلش سه چیز است: سایت سریع می‌ماند، فارسی و راست‌به‌چپ از اول درست کار می‌کند، و قاعده‌های دسترس‌پذیری سایت برای همه‌ی المان‌ها یکی است.

| المان در 21st.dev | سازنده | مجوز | کجای سایت | فایل‌ها |
|---|---|---|---|---|
| [Interactive Grid](https://21st.dev/@balick/components/interactive-grid) و [Grid Pattern](https://21st.dev/community/components/magicui/grid-pattern) | Théo Balick؛ Dillion Verma (Magic UI) | MIT | پس‌زمینه‌ی بالای صفحه‌ی اصلی: کاغذ شطرنجی دفتر مدرسه که خانه‌هایش زیر نشانگر موس کم‌رنگ طلایی می‌شوند و آرام محو می‌شوند | `src/components/Hero.astro`، `src/scripts/grid-paper.ts` |
| [Annotated Text](https://21st.dev/@iamtoribryan/components/annotated-text) | Tori Bryan | MIT | خط طلایی دست‌کش زیر «نه برای امتحان»، زیر تیتر صفحه‌های داخلی و در پنل پایانی | `src/components/Stroke.astro` |
| [Text Highlighter](https://21st.dev/@danielpetho/components/text-highlighter/text-highlighter-ref-demo) | Daniel Petho (Fancy Components) | MIT | ماژیک کم‌رنگ روی یک عبارت از تیتر هر بخش، از راست به چپ و وقتی بخش دیده می‌شود | `src/components/Section.astro`، کلاس `.mark-sweep` |
| [Magnetic Button](https://21st.dev/community/components/bundui/magnetic-button) | Bundui | MIT | دکمه‌ی «پیش‌ثبت‌نام و مشاوره» بالای صفحه‌ی اصلی و در پنل پایانی، کمی به سمت موس کشیده می‌شود | `src/scripts/fx.ts`، `data-magnetic` |
| [Text Reveal](https://21st.dev/@dillionverma/components/text-reveal) | Dillion Verma (Magic UI) | MIT | بند «بسیاری از نوجوان‌ها…» در صفحه‌ی اصلی و نقل‌قول صفحه‌ی متد: واژه‌ها با اسکرول، کلمه‌به‌کلمه پررنگ می‌شوند | `src/components/InkText.astro`، `src/scripts/fx.ts` |
| [Sticky Services Stack](https://21st.dev/@abushaidislam7/components/sticky-services-stack) و [Stacking card](https://21st.dev/@ui-layouts/components/stacking-card) | Syed؛ UI Layouts | MIT؛ مجوز Stacking card در صفحه‌اش نیامده و از آن فقط ایده گرفته شده است | «آنچه ما را متفاوت می‌کند» در صفحه‌ی اصلی و «یک چرخه ساده» در صفحه‌ی متد: کارت‌هایی که با اسکرول روی هم می‌نشینند | `src/components/StackCards.astro` |
| [Scroll Progress Bar](https://21st.dev/community/components/bundui/scroll-progress-bar) | Bundui | MIT | نوار طلایی باریک زیر سربرگ که نشان می‌دهد چقدر از صفحه خوانده شده: در صفحه‌های بلند (متد، درباره ما، برای والدین، صفحه‌ی هر واحد) و در مقاله‌ها و خبرها روی خود متن | `src/components/Header.astro`، `progress` در `Base.astro`، `data-progress-target` |
| [Underline Link](https://21st.dev/@balick/components/underline-link) | Théo Balick | MIT | خط زیر پیوندها از راست کشیده می‌شود و به چپ بیرون می‌رود؛ پیوندهای پانویس با خط طلایی | `src/styles/global.css`، کلاس‌های `.link` و `.foot-link` |
| [Animated Tabs](https://21st.dev/@educalvolpz/components/animated-tabs) | Edu Calvo (SmoothUI) | MIT | خط زیر منوی اصلی که روی هر گزینه می‌لغزد و به صفحه‌ی فعلی برمی‌گردد | `src/components/Header.astro` |
| [Motion Footer](https://21st.dev/@jahed/components/motion-footer) | Hossain Jahed | در صفحه‌اش نیامده؛ فقط ایده‌ی «نام بزرگ در پانویس» گرفته شده است | نام «کودک ماهر» با خط طلایی دست‌کش در پایین پانویس، وقتی پانویس دیده می‌شود | `src/components/Footer.astro` |

## قاعده‌هایی که همه‌ی این المان‌ها رعایت می‌کنند

- **متن فارسی هیچ‌وقت حرف‌به‌حرف جدا نمی‌شود.** اتصال حروف فارسی می‌شکند، پس افکت‌ها یا روی کل عبارت کار می‌کنند یا کلمه‌به‌کلمه.
- **جهت حرکت راست‌به‌چپ است.** خط‌ها، ماژیک و نوار پیشرفت از سمت شروع خواندن، یعنی راست، شروع می‌شوند.
- **«کاهش حرکت» در سیستم‌عامل یعنی بدون حرکت.** همه‌چیز در حالت نهایی‌اش نشان داده می‌شود: خط‌ها کشیده، ماژیک زده، متن پررنگ، کارت‌ها یک فهرست ساده.
- **لمس با موس فرق دارد.** کاغذ شطرنجی و دکمه‌ی مغناطیسی فقط با موس یا ترک‌پد فعال می‌شوند. روی گوشی ثابت می‌مانند.
- **کنتراست هیچ‌وقت پایین نمی‌آید.** متنی که با اسکرول پررنگ می‌شود از رنگ خاکستری سایت شروع می‌شود که خودش کنتراست کافی دارد.
- **بدون جاوااسکریپت هم چیزی گم نمی‌شود.** حالت بی‌اسکریپت همان حالت کامل و ثابت است.
- **صفحه‌خوان همان متن را می‌خواند.** المان‌های تزئینی `aria-hidden` هستند و متن واقعی دست نخورده است.
