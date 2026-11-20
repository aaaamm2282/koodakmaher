# المان‌های الهام‌گرفته از 21st.dev

چند جزئیات حرکتی سایت از المان‌های کاتالوگ [21st.dev](https://21st.dev) گرفته شده است. نسخه‌ی اصلی این المان‌ها با React و کتابخانه‌هایی مثل Framer Motion ساخته شده است. اینجا هیچ‌کدام از آن کتابخانه‌ها نصب نشده و از کد آن‌ها هم کپی نشده است. هر المان از روی رفتار و نمونه‌ی نمایشی‌اش، با Astro، CSS و چند خط TypeScript ساده دوباره ساخته شده است. دلیلش سه چیز است: سایت سریع می‌ماند، فارسی و راست‌به‌چپ از اول درست کار می‌کند، و قاعده‌های دسترس‌پذیری سایت برای همه‌ی المان‌ها یکی است.

در بازطراحی «کاغذ رنگی» بیشتر این حرکت‌ها برداشته شدند: سایت حالا یک لحظه‌ی حرکتی اصلی دارد (ورود تصویر کاغذی بالای صفحه‌ی اصلی) و بقیه‌ی صفحه ثابت است. تصویرهای کاغذی خود سایت از هیچ کاتالوگی گرفته نشده‌اند؛ با کد ساخته می‌شوند و در [paper-art.md](paper-art.md) آمده‌اند.

## آنچه هنوز در سایت هست

| المان در 21st.dev | سازنده | مجوز | کجای سایت | فایل‌ها |
|---|---|---|---|---|
| [Annotated Text](https://21st.dev/@iamtoribryan/components/annotated-text) | Tori Bryan | MIT | خط طلایی دست‌کش زیر «نه برای امتحان» و زیر تیتر صفحه‌های داخلی که یک بار هنگام باز شدن صفحه کشیده می‌شود؛ در پنل پایانی ثابت است | `src/components/Stroke.astro` |
| [Text Highlighter](https://21st.dev/@danielpetho/components/text-highlighter/text-highlighter-ref-demo) | Daniel Petho (Fancy Components) | MIT | ماژیک کم‌رنگ طلایی روی یک عبارت از تیتر بعضی بخش‌ها؛ حالا ثابت است و دیگر با اسکرول کشیده نمی‌شود | `src/components/Section.astro`، کلاس `.mark-sweep` |
| [Text Reveal](https://21st.dev/@dillionverma/components/text-reveal) | Dillion Verma (Magic UI) | MIT | بند «بسیاری از نوجوان‌ها…» در صفحه‌ی اصلی و نقل‌قول صفحه‌ی متد: واژه‌ها با اسکرول، کلمه‌به‌کلمه پررنگ می‌شوند | `src/components/InkText.astro`، `src/scripts/fx.ts` |
| [Scroll Progress Bar](https://21st.dev/community/components/bundui/scroll-progress-bar) | Bundui | MIT | نوار طلایی باریک زیر سربرگ که نشان می‌دهد چقدر از صفحه خوانده شده: در صفحه‌های بلند و در مقاله‌ها و خبرها روی خود متن | `src/components/Header.astro`، `progress` در `Base.astro`، `data-progress-target` |
| [Underline Link](https://21st.dev/@balick/components/underline-link) | Théo Balick | MIT | خط زیر پیوندها از راست کشیده می‌شود و به چپ بیرون می‌رود؛ پیوندهای پانویس با خط طلایی | `src/styles/global.css`، کلاس‌های `.link` و `.foot-link` |
| [Animated Tabs](https://21st.dev/@educalvolpz/components/animated-tabs) | Edu Calvo (SmoothUI) | MIT | خط زیر منوی اصلی که روی هر گزینه می‌لغزد و به صفحه‌ی فعلی برمی‌گردد | `src/components/Header.astro` |
| [Motion Footer](https://21st.dev/@jahed/components/motion-footer) | Hossain Jahed | در صفحه‌اش نیامده؛ فقط ایده‌ی «نام بزرگ در پانویس» گرفته شده است | نام «کودک ماهر» با خط طلایی در پایین پانویس؛ حالا ثابت است | `src/components/Footer.astro` |
| [Isometric Steps](https://21st.dev/@abhishek-mallick/components/steps) | abhishek-mallick (isometric) | MIT | پلکان سن در صفحه‌ی مسیر رشد: با اسکرول، مهره‌ی سرمه‌ای روی پله‌ی مرحله‌ای که خوانده می‌شود می‌پرد و پله‌هایی که خواننده به آن‌ها رسیده رنگ کاغذ همان دوره را می‌گیرند (زعفرانی، شنگرفی، فیروزه‌ای، طلایی)؛ پله‌ی متوسطه دوم خط‌چین است چون به‌زودی باز می‌شود | `src/pages/path/index.astro`، `src/scripts/path-story.ts` |
| [3D Folder](https://21st.dev/@jatin-yadav05/components/3d-folder) | Jatin Yadav | در صفحه‌اش «unknown» آمده؛ فقط ایده‌ی پوشه‌ای از پشت، زبانه و جلد جلو گرفته شده است | پوشه‌ی «پرونده رشد» در صفحه‌ی برای والدین، باز و ثابت؛ با بردن موس روی آن کمی بیشتر باز می‌شود | `src/components/GrowthFile.astro` |
| [3D Animated Pin](https://21st.dev/@manuarora700/components/3d-pin) | Manu Arora (Aceternity UI) | MIT | بالای کارت نشانی واحدها: نوار کاغذ شطرنجی نقشه، حالا صاف و بدون پرسپکتیو، و سنجاق سرمه‌ای که روی دکمه‌ی «مسیریابی در نشان» کمی بالا می‌رود. واحدی که هنوز نقشه ندارد سنجاق خط‌چین دارد | `src/components/PlacePin.astro` |

## آنچه در بازطراحی «کاغذ رنگی» برداشته شد

| المان | کجا بود | چرا برداشته شد |
|---|---|---|
| [Interactive Grid](https://21st.dev/@balick/components/interactive-grid) و [Grid Pattern](https://21st.dev/community/components/magicui/grid-pattern) | پس‌زمینه‌ی بالای صفحه‌ی اصلی | جای آن را تصویر کاغذی مسیر ۳ تا ۱۸ گرفت |
| [Magnetic Button](https://21st.dev/community/components/bundui/magnetic-button) | دکمه‌ی پیش‌ثبت‌نام | دکمه‌ها حالا فقط با بردن موس یک پیکسل بالا می‌روند و با کلیک کمی فشرده می‌شوند |
| [Sticky Services Stack](https://21st.dev/@abushaidislam7/components/sticky-services-stack) و [Stacking card](https://21st.dev/@ui-layouts/components/stacking-card) | «آنچه ما را متفاوت می‌کند» و «یک چرخه ساده» | فهرست ثابت و سه قدم مصور جای آن را گرفتند؛ در عرض ۳۲۰ پیکسل هم کارت‌ها روی هم می‌افتادند |
| [Tilt](https://21st.dev/@ibelick/components/tilt) و [3D Card Effect](https://21st.dev/@manuarora700/components/3d-card-effect) | پنل سرمه‌ای بالای صفحه‌ی اصلی | جای پنل را تصویر کاغذی گرفت؛ کج شدن با موس حواس را از متن می‌برد |
| [Depth Flip Text](https://21st.dev/@hyperiux/components/depth-flip-text) | واژه‌ی چرخه در همان پنل | متن خودبه‌خود عوض‌شونده دیگر نیست؛ جمله‌ی چرخه در بخش «سه قدم ساده» ثابت آمده است |
| [Container Scroll Animation](https://21st.dev/@manuarora700/components/container-scroll-animation) و [Tilt Scroll](https://21st.dev/@kevingirelli/components/tilt-scroll) | پنل پایانی هر صفحه | پنل پایانی حالا ثابت است و تپه‌های کاغذی در پایین آن نشسته‌اند |
| نمایان شدن بخش‌ها با اسکرول (بدون المان مشخص در 21st.dev) | بیشتر بخش‌های همه‌ی صفحه‌ها | محتوا از اول در جای خودش است؛ با «کاهش حرکت» هم دیگر چیزی کم‌رنگ نمی‌ماند |

## قاعده‌هایی که همه‌ی حرکت‌های سایت رعایت می‌کنند

- **یک لحظه‌ی اصلی در هر صفحه.** صفحه‌ی اصلی یک ورود دارد (تصویر کاغذی بالای صفحه) و یک بند که با اسکرول پررنگ می‌شود؛ بقیه ثابت است.
- **متن فارسی هیچ‌وقت حرف‌به‌حرف جدا نمی‌شود.** اتصال حروف فارسی می‌شکند، پس افکت‌ها یا روی کل عبارت کار می‌کنند یا کلمه‌به‌کلمه.
- **جهت حرکت راست‌به‌چپ است.** خط‌ها، ماژیک، نوار پیشرفت و مسیر کاغذی از سمت شروع خواندن، یعنی راست، شروع می‌شوند.
- **«کاهش حرکت» در سیستم‌عامل یعنی بدون حرکت.** همه‌چیز در حالت نهایی‌اش نشان داده می‌شود: تصویر کامل، خط‌ها کشیده، متن پررنگ.
- **لمس با موس فرق دارد.** حرکت‌های hover فقط با موس یا ترک‌پد فعال می‌شوند. روی گوشی ثابت می‌مانند.
- **کنتراست هیچ‌وقت پایین نمی‌آید.** متنی که با اسکرول پررنگ می‌شود از رنگ خاکستری سایت شروع می‌شود که خودش کنتراست کافی دارد.
- **بدون جاوااسکریپت هم چیزی گم نمی‌شود.** حالت بی‌اسکریپت همان حالت کامل و ثابت است.
- **صفحه‌خوان همان متن را می‌خواند.** تصویرها و المان‌های تزئینی `aria-hidden` هستند و متن واقعی دست نخورده است.
- **خط‌چین یعنی «هنوز نه».** پله و کاشی متوسطه دوم، تپه‌ی دور در تصویر بالای صفحه و سنجاق واحدی که نقشه‌اش هنوز نیامده خط‌چین‌اند، تا چیزی که آماده نیست آماده به نظر نرسد.
