// Site chrome + user-generated content: users, faq, slider, team, partners,
// settings, navigation, comments, reviews, contact messages.
import { pid } from './data-core.mjs';

// Never hardcode this — the seeded accounts include admin-role users on a live,
// internet-reachable instance. Supply it at run time via the environment.
export const SEED_PASSWORD = process.env.SEED_PASSWORD || '';

export const users = [
  ['zaid.alrubaie@irshad.gov.iq', 'Zaid Al-Rubaie', 'System Administrator', 'admin'],
  ['dilan.hussein@irshad.gov.iq', 'Dilan Hussein', 'Head of Digital Services', 'admin'],
  ['noor.alsaadi@irshad.gov.iq', 'Noor Al-Saadi', 'Content Editor', 'moderator'],
  ['rebin.ahmed@irshad.gov.iq', 'Rebin Ahmed', 'Kurdish Language Editor', 'moderator'],
  ['huda.jassim@irshad.gov.iq', 'Huda Jassim', 'Arabic Language Editor', 'moderator'],
  ['mustafa.kareem@example.iq', 'Mustafa Kareem', '', 'user'],
  ['sara.abdullah@example.iq', 'Sara Abdullah', '', 'user'],
  ['aram.sabir@example.iq', 'Aram Sabir', '', 'user'],
  ['layla.hashim@example.iq', 'Layla Hashim', '', 'user'],
].map(([email, name, job, role], i) => ({
  id: pid('usr', i + 1),
  email, full_name: name, job_title: job, role,
  password: SEED_PASSWORD, passwordConfirm: SEED_PASSWORD,
  verified: true, emailVisibility: false,
}));

export const faq = [
  ['Do I need to create an account to use Irshad?', 'هل أحتاج إلى حساب لاستخدام إرشاد؟', 'پێویستە هەژمارێکم هەبێت بۆ بەکارهێنانی ئیرشاد؟',
    'No. Browsing ministries, directorates and procedures is open to everyone. An account is only needed to leave a comment or rate a procedure.',
    'لا. تصفح الوزارات والدوائر والإجراءات متاح للجميع، ولا يلزم الحساب إلا لكتابة تعليق أو تقييم إجراء.',
    'نەخێر. گەڕان بەناو وەزارەت و بەڕێوەبەرایەتی و ڕێکارەکاندا بۆ هەمووان کراوەیە. هەژمار تەنها بۆ نووسینی لێدوان یان هەڵسەنگاندنی ڕێکارێک پێویستە.'],
  ['Is Irshad an official government service?', 'هل إرشاد خدمة حكومية رسمية؟', 'ئایا ئیرشاد خزمەتگوزارییەکی فەرمیی حکومییە؟',
    'Irshad is an informational guide. It explains what each procedure requires, but applications themselves are submitted to the responsible directorate.',
    'إرشاد دليل معلوماتي يوضح متطلبات كل إجراء، أما تقديم المعاملات فيتم لدى الدائرة المختصة.',
    'ئیرشاد ڕێبەرێکی زانیارییە. ڕوونی دەکاتەوە هەر ڕێکارێک چی دەوێت، بەڵام داواکارییەکان خۆیان بۆ بەڕێوەبەرایەتیی پەیوەندیدار پێشکەش دەکرێن.'],
  ['How current is the information on this site?', 'ما مدى حداثة المعلومات في الموقع؟', 'زانیاریی ماڵپەڕەکە چەند نوێیە؟',
    'Each procedure shows the date it was last published. Fees and processing times change, so confirm them with the directorate before you travel.',
    'يظهر لكل إجراء تاريخ آخر نشر. تتغير الرسوم ومدد الإنجاز، لذا تأكد منها لدى الدائرة قبل المراجعة.',
    'هەر ڕێکارێک ڕێکەوتی دوا بڵاوکردنەوەی نیشان دەدات. کرێ و ماوەی تەواوکردن دەگۆڕێن، بۆیە پێش ڕۆیشتن لە بەڕێوەبەرایەتییەکە دڵنیا ببەرەوە.'],
  ['Why is some content only available in one language?', 'لماذا يتوفر بعض المحتوى بلغة واحدة فقط؟', 'بۆچی هەندێک ناوەڕۆک تەنها بە یەک زمان بەردەستە؟',
    'Content is translated as it is reviewed. Where a translation is not yet ready the English text is shown so nothing is hidden from you.',
    'تترجم المحتويات تباعا بعد مراجعتها، وحين لا تكون الترجمة جاهزة يعرض النص الإنكليزي حتى لا يخفى عنك شيء.',
    'ناوەڕۆک بەپێی پێداچوونەوە وەردەگێڕدرێت. لەو کاتەی وەرگێڕان ئامادە نییە، دەقی ئینگلیزی نیشان دەدرێت تا هیچت لێ نەشاردرێتەوە.'],
  ['Can I download the official forms from here?', 'هل يمكنني تنزيل الاستمارات الرسمية من هنا؟', 'دەتوانم فۆرمە فەرمییەکان لێرەوە دابەزێنم؟',
    'Yes. Where a directorate publishes a form, it is attached to the procedure page and can be downloaded and printed.',
    'نعم. عندما تنشر الدائرة استمارة، ترفق بصفحة الإجراء ويمكن تنزيلها وطباعتها.',
    'بەڵێ. لەو کاتەی بەڕێوەبەرایەتییەک فۆرمێک بڵاو دەکاتەوە، بە پەڕەی ڕێکارەکەوە دەلکێندرێت و دەتوانرێت دابەزێندرێت و چاپ بکرێت.'],
  ['What should I do if a procedure page is wrong?', 'ماذا أفعل إذا كانت معلومات الإجراء خاطئة؟', 'ئەگەر زانیاریی ڕێکارێک هەڵە بوو چی بکەم؟',
    'Use the contact form and name the procedure. Corrections are checked against the directorate before the page is updated.',
    'استخدم استمارة الاتصال واذكر اسم الإجراء. تدقق التصحيحات مع الدائرة قبل تحديث الصفحة.',
    'فۆرمی پەیوەندی بەکاربهێنە و ناوی ڕێکارەکە بنووسە. ڕاستکردنەوەکان لەگەڵ بەڕێوەبەرایەتییەکە پشکنین دەکرێن پێش نوێکردنەوەی پەڕەکە.'],
  ['Do the fees shown include all charges?', 'هل تشمل الرسوم المعروضة كل الأجور؟', 'ئایا ئەو کرێیانەی نیشان دراون هەموو تێچووەکان دەگرنەوە؟',
    'The figure shown is the main government fee. Stamps, forms and courier delivery may add a small amount at the counter.',
    'المبلغ المعروض هو الرسم الحكومي الأساس، وقد تضاف الطوابع والاستمارات وأجور التوصيل مبلغا بسيطا في النافذة.',
    'ئەو بڕەی نیشان دراوە کرێی سەرەکیی حکومییە. پول و فۆرم و کرێی گەیاندن لەوانەیە بڕێکی کەم لە دەریچەکە زیاد بکەن.'],
  ['Are procedures the same in the Kurdistan Region?', 'هل الإجراءات نفسها في إقليم كردستان؟', 'ئایا ڕێکارەکان لە هەرێمی کوردستان هەمانن؟',
    'Many are, but some are handled by Kurdistan Regional Government bodies with their own offices and fees. Those entries are flagged as KRG.',
    'كثير منها كذلك، لكن بعضها تتولاه دوائر حكومة إقليم كردستان بمكاتب ورسوم خاصة، وتعلم تلك المدخلات بوسم الإقليم.',
    'زۆربەیان وان، بەڵام هەندێکیان لەلایەن دەزگاکانی حکومەتی هەرێمی کوردستانەوە بەڕێوە دەبرێن بە نووسینگە و کرێی تایبەت. ئەو تۆمارانە بە نیشانەی هەرێم دیاری کراون.'],
  ['Can someone else complete a procedure on my behalf?', 'هل يمكن لشخص آخر إنجاز المعاملة نيابة عني؟', 'دەکرێت کەسێکی تر لە جیاتی من ڕێکارەکە تەواو بکات؟',
    'Usually yes, with a notarised power of attorney. Biometric steps such as fingerprints and photographs always require the applicant in person.',
    'غالبا نعم بوكالة مصدقة، إلا أن الخطوات البايومترية كالبصمة والصورة تتطلب حضور صاحب الطلب شخصيا.',
    'بەزۆری بەڵێ، بە وەکالەتێکی مۆرکراو. بەڵام هەنگاوە بایۆمەترییەکان وەک پەنجەمۆر و وێنە هەمیشە ئامادەبوونی خودی داواکاریان دەوێت.'],
  ['How are comments and ratings moderated?', 'كيف تدار التعليقات والتقييمات؟', 'لێدوان و هەڵسەنگاندنەکان چۆن بەڕێوە دەبرێن؟',
    'Every comment and rating is reviewed by an editor before it appears publicly. Personal data and complaints about named officials are removed.',
    'يراجع محرر كل تعليق وتقييم قبل ظهوره للعامة، وتزال البيانات الشخصية والشكاوى ضد موظفين بأسمائهم.',
    'هەموو لێدوان و هەڵسەنگاندنێک لەلایەن دەستکارێکەوە پێداچوونەوەی بۆ دەکرێت پێش ئەوەی بە گشتی دەربکەوێت. زانیاریی کەسی و سکاڵا لە کارمەندانی ناودێر لادەبرێن.'],
].map(([qEn, qAr, qKu, aEn, aAr, aKu], i) => ({
  id: pid('faq', i + 1),
  question_en: qEn, question_ar: qAr, question_ku: qKu,
  answer_en: `<p>${aEn}</p>`, answer_ar: `<p>${aAr}</p>`, answer_ku: `<p>${aKu}</p>`,
  sort_order: i + 1, enabled: true,
}));

export const slider = [
  ['Every government service, explained', 'كل خدمة حكومية، مشروحة', 'هەموو خزمەتگوزارییەکی حکومی، ڕوونکراوە',
    'Find what a procedure needs before you leave the house.', 'اعرف متطلبات المعاملة قبل أن تغادر بيتك.', 'پێش ئەوەی لە ماڵەوە دەربچیت بزانە ڕێکارەکە چی دەوێت.',
    '/en/procedures', '#1B5E4B'],
  ['Renew your passport in five steps', 'جدد جواز سفرك بخمس خطوات', 'پاسپۆرتەکەت بە پێنج هەنگاو نوێ بکەرەوە',
    'Appointment, documents, biometrics, payment, collection.', 'موعد، مستمسكات، بصمة، دفع، استلام.', 'کات، بەڵگەنامە، بایۆمەتری، پارەدان، وەرگرتن.',
    '/en/procedures/renew-iraqi-passport', '#123A63'],
  ['The Unified National ID Card', 'البطاقة الوطنية الموحدة', 'ناسنامەی نیشتمانی یەکگرتوو',
    'One card replacing three documents.', 'بطاقة واحدة تحل محل ثلاثة مستمسكات.', 'یەک کارت جێگای سێ بەڵگەنامە دەگرێتەوە.',
    '/en/procedures/issue-unified-national-id-card', '#6B2737'],
  ['Download the official forms', 'نزل الاستمارات الرسمية', 'فۆرمە فەرمییەکان دابەزێنە',
    'Print and fill them in before you go.', 'اطبعها واملأها قبل المراجعة.', 'پێش ڕۆیشتن چاپیان بکە و پڕیان بکەرەوە.',
    '/en/search?type=forms', '#4A3B76'],
  ['Available in English, Arabic and Kurdish', 'متاح بالإنكليزية والعربية والكردية', 'بە ئینگلیزی و عەرەبی و کوردی بەردەستە',
    'Switch language at any time from the header.', 'بدل اللغة في أي وقت من أعلى الصفحة.', 'لە هەر کاتێکدا زمان لە سەرەوەی پەڕەکە بگۆڕە.',
    '/en/faq', '#8A5A1E'],
].map(([tEn, tAr, tKu, sEn, sAr, sKu, link, colour], i) => ({
  id: pid('sld', i + 1),
  title_en: tEn, title_ar: tAr, title_ku: tKu,
  subtitle_en: sEn, subtitle_ar: sAr, subtitle_ku: sKu,
  link, sort_order: i + 1, enabled: true, _colour: colour,
}));

export const team = [
  ['Dr. Salma Al-Obaidi', 'د. سلمى العبيدي', 'د. سەلما عوبەیدی', 'Programme Director', 'مديرة البرنامج', 'بەڕێوەبەری پرۆگرام',
    'Leads the Irshad programme and its coordination with federal and regional ministries.',
    'تقود برنامج إرشاد وتنسيقه مع الوزارات الاتحادية والإقليمية.',
    'سەرپەرشتی پرۆگرامی ئیرشاد و هەماهەنگی لەگەڵ وەزارەتە فیدراڵی و هەرێمییەکان دەکات.', 'leadership'],
  ['Hemin Barzani', 'همن بارزاني', 'هەمن بارزانی', 'Deputy Director', 'نائب المدير', 'جێگری بەڕێوەبەر',
    'Oversees the Kurdistan Region service catalogue and its Kurdish-language content.',
    'يشرف على دليل خدمات إقليم كردستان ومحتواه باللغة الكردية.',
    'چاودێری کاتالۆگی خزمەتگوزاری هەرێمی کوردستان و ناوەڕۆکی کوردی دەکات.', 'leadership'],
  ['Ahmed Al-Janabi', 'أحمد الجنابي', 'ئەحمەد جەنابی', 'Head of Content', 'رئيس قسم المحتوى', 'سەرۆکی بەشی ناوەڕۆک',
    'Responsible for verifying every procedure with the issuing directorate before publication.',
    'مسؤول عن التحقق من كل إجراء لدى الدائرة المصدرة قبل النشر.',
    'بەرپرسیارە لە پشتڕاستکردنەوەی هەر ڕێکارێک لەگەڵ بەڕێوەبەرایەتی دەرکەر پێش بڵاوکردنەوە.', 'staff'],
  ['Ruqaya Al-Musawi', 'رقية الموسوي', 'ڕوقەیە مووسەوی', 'Translation Lead', 'مسؤولة الترجمة', 'بەرپرسی وەرگێڕان',
    'Coordinates the English, Arabic and Kurdish versions and reviews terminology.',
    'تنسق النسخ الإنكليزية والعربية والكردية وتراجع المصطلحات.',
    'هەماهەنگی وەشانە ئینگلیزی و عەرەبی و کوردییەکان دەکات و زاراوەکان پێداچوونەوەیان بۆ دەکات.', 'staff'],
  ['Karwan Othman', 'كاروان عثمان', 'کاروان عوسمان', 'Product Engineer', 'مهندس المنتج', 'ئەندازیاری بەرهەم',
    'Builds and maintains the public site and the editorial back office.',
    'يبني ويصون الموقع العام ونظام التحرير الخلفي.',
    'ماڵپەڕی گشتی و سیستەمی دەستکاری پشتەوە دروست دەکات و چاودێری دەکات.', 'staff'],
  ['Judge Firas Al-Hasani', 'القاضي فراس الحسني', 'دادوەر فیراس حەسەنی', 'Legal Adviser', 'المستشار القانوني', 'ڕاوێژکاری یاسایی',
    'Advises on the legal accuracy of published requirements and citizen rights.',
    'يقدم المشورة بشأن الدقة القانونية للمتطلبات المنشورة وحقوق المواطنين.',
    'ڕاوێژ دەدات سەبارەت بە وردیی یاساییی پێداویستییە بڵاوکراوەکان و مافەکانی هاوواڵاتیان.', 'advisory'],
].map(([nEn, nAr, nKu, jEn, jAr, jKu, bEn, bAr, bKu, loc], i) => ({
  id: pid('tem', i + 1),
  name_en: nEn, name_ar: nAr, name_ku: nKu,
  job_title_en: jEn, job_title_ar: jAr, job_title_ku: jKu,
  bio_en: bEn, bio_ar: bAr, bio_ku: bKu,
  location: loc, sort_order: i + 1, enabled: true,
}));

export const partners = [
  ['Ministry of Planning', 'وزارة التخطيط', 'وەزارەتی پلاندانان', 'https://mop.gov.iq', 'home', '#1B5E4B'],
  ['Kurdistan Regional Government', 'حكومة إقليم كردستان', 'حکومەتی هەرێمی کوردستان', 'https://gov.krd', 'home', '#C8102E'],
  ['United Nations Development Programme', 'برنامج الأمم المتحدة الإنمائي', 'بەرنامەی گەشەپێدانی نەتەوە یەکگرتووەکان', 'https://undp.org', 'home', '#0468B1'],
  ['Iraqi Bar Association', 'نقابة المحامين العراقيين', 'سەندیکای پارێزەرانی عێراق', 'https://iraqibar.org', 'partners_page', '#4A3B76'],
  ['Iraqi Federation of Chambers of Commerce', 'اتحاد الغرف التجارية العراقية', 'یەکێتی ژووری بازرگانیی عێراق', 'https://iraqichambers.org', 'partners_page', '#8A5A1E'],
  ['National Centre for Digital Governance', 'المركز الوطني للحوكمة الرقمية', 'ناوەندی نیشتمانی ڕابەرایەتی دیجیتاڵ', 'https://digital.gov.iq', 'footer', '#123A63'],
].map(([nEn, nAr, nKu, link, loc, colour], i) => ({
  id: pid('ptr', i + 1),
  name_en: nEn, name_ar: nAr, name_ku: nKu,
  link, location: loc, sort_order: i + 1, enabled: true, _colour: colour,
}));

export const settings = [
  ['site_name', 'Site name', 'general', false, 'Irshad — Guide to Government Services', 'إرشاد — دليل الخدمات الحكومية', 'ئیرشاد — ڕێبەری خزمەتگوزارییە حکومییەکان'],
  ['site_tagline', 'Tagline', 'general', false, 'Know what you need before you go.', 'اعرف ما تحتاجه قبل أن تذهب.', 'پێش ڕۆیشتن بزانە پێویستت بە چییە.'],
  ['site_description', 'Meta description', 'seo', false,
    'Irshad explains Iraqi government procedures step by step: what documents you need, what it costs and how long it takes.',
    'يشرح إرشاد الإجراءات الحكومية العراقية خطوة بخطوة: ما المستمسكات المطلوبة وكم التكلفة وكم يستغرق الإنجاز.',
    'ئیرشاد ڕێکارە حکومییەکانی عێراق هەنگاو بە هەنگاو ڕوون دەکاتەوە: چ بەڵگەنامەیەکت دەوێت، چەندە تێدەچێت و چەند دەخایەنێت.'],
  ['contact_email', 'Contact email', 'contact', true, 'info@irshad.gov.iq', 'info@irshad.gov.iq', 'info@irshad.gov.iq'],
  ['contact_phone', 'Contact phone', 'contact', true, '+964 780 000 0000', '+964 780 000 0000', '+964 780 000 0000'],
  ['support_hours', 'Support hours', 'contact', false, 'Sunday – Thursday, 09:00 – 15:00', 'الأحد – الخميس، ٩:٠٠ – ١٥:٠٠', 'یەکشەممە – پێنجشەممە، ٩:٠٠ – ١٥:٠٠'],
  ['office_address', 'Office address', 'contact', false, 'Al-Karrada, Baghdad, Iraq', 'الكرادة، بغداد، العراق', 'کەڕادە، بەغدا، عێراق'],
  ['facebook_url', 'Facebook', 'social', true, 'https://facebook.com/irshad.iq', 'https://facebook.com/irshad.iq', 'https://facebook.com/irshad.iq'],
  // Empty, not invented. Both of these shipped pointing at accounts nobody had
  // created and both returned 404 from the footer of every page for months. The
  // footer drops a social entry with no value, so an empty setting simply does
  // not render, and staff can fill it in from the admin once the account exists.
  ['x_url', 'X (Twitter)', 'social', true, '', '', ''],
  ['youtube_url', 'YouTube', 'social', true, '', '', ''],
  ['footer_note', 'Footer note', 'general', false,
    'Irshad is an informational guide. Always confirm fees and requirements with the responsible directorate.',
    'إرشاد دليل معلوماتي. تأكد دائما من الرسوم والمتطلبات لدى الدائرة المختصة.',
    'ئیرشاد ڕێبەرێکی زانیارییە. هەمیشە کرێ و پێداویستییەکان لە بەڕێوەبەرایەتی پەیوەندیدار دڵنیا بکەرەوە.'],
  ['default_locale', 'Default locale', 'general', true, 'en', 'en', 'en'],
].map(([key, title, group, noTrans, en, ar, ku], i) => ({
  id: pid('set', i + 1),
  key, title, group, no_trans: noTrans,
  value_en: en, value_ar: ar, value_ku: ku,
}));

// [titleEn, titleAr, titleKu, endpoint, placement, parentIndex|null, icon]
export const navigation = [
  ['Home', 'الرئيسية', 'سەرەکی', '/', 'menu', null, 'home'],
  ['Ministries', 'الوزارات', 'وەزارەتەکان', '/ministries', 'menu', null, 'landmark'],
  ['Procedures', 'الإجراءات', 'ڕێکارەکان', '/procedures', 'menu', null, 'list-checks'],
  ['Search', 'البحث', 'گەڕان', '/search', 'menu', null, 'search'],
  ['About', 'من نحن', 'دەربارە', '/team', 'menu', null, 'info'],
  ['Contact', 'اتصل بنا', 'پەیوەندی', '/contact', 'menu', null, 'mail'],
  ['Federal Ministries', 'الوزارات الاتحادية', 'وەزارەتە فیدراڵییەکان', '/ministries?krg=false', 'menu', 2, null],
  ['Kurdistan Region Ministries', 'وزارات إقليم كردستان', 'وەزارەتەکانی هەرێمی کوردستان', '/ministries?krg=true', 'menu', 2, null],
  ['Featured Procedures', 'الإجراءات المميزة', 'ڕێکارە دیارەکان', '/procedures?featured=true', 'menu', 3, null],
  ['Browse by Tag', 'التصفح حسب الوسم', 'گەڕان بەپێی تاگ', '/procedures/tags', 'menu', 3, null],
  ['Home', 'الرئيسية', 'سەرەکی', '/', 'drawer', null, 'home'],
  ['Ministries', 'الوزارات', 'وەزارەتەکان', '/ministries', 'drawer', null, 'landmark'],
  ['Procedures', 'الإجراءات', 'ڕێکارەکان', '/procedures', 'drawer', null, 'list-checks'],
  ['FAQ', 'الأسئلة الشائعة', 'پرسیارە باوەکان', '/faq', 'drawer', null, 'help-circle'],
  ['Our Team', 'فريقنا', 'تیمەکەمان', '/team', 'drawer', null, 'users'],
  ['Partners', 'الشركاء', 'هاوبەشەکان', '/partners', 'drawer', null, 'handshake'],
  ['Contact Us', 'اتصل بنا', 'پەیوەندیمان پێوە بکە', '/contact', 'drawer', null, 'mail'],
].map(([tEn, tAr, tKu, endpoint, placement, parentIdx, icon], i) => ({
  id: pid('nav', i + 1),
  title_en: tEn, title_ar: tAr, title_ku: tKu,
  endpoint, placement,
  parent: parentIdx ? pid('nav', parentIdx) : '',
  icon: icon || '',
  sort_order: i + 1, enabled: true,
}));

// [userIndex, procedureIndex, body, approved]
export const comments = [
  [6, 1, 'The Karkh office now opens a second counter at 07:30 for booked appointments. Worth arriving early.', true],
  [7, 1, 'Do children under twelve still need to attend in person, or can a parent bring the documents alone?', true],
  [8, 2, 'Enrolment at my district office took forty minutes end to end. The iris scan is quick.', true],
  [9, 4, 'A reminder that the thirty-day window starts from the date on the hospital notification, not the birth date.', true],
  [6, 5, 'The theory test is now available in Kurdish at the Erbil directorate.', true],
  [7, 9, 'Is the one million dinar minimum capital still current for 2026?', false],
  [8, 11, 'My agent asked for the residence card as well, which is not listed here.', false],
  [9, 15, 'The priority specialisation list for this year was published late — check the portal weekly.', true],
].map(([u, p, body, approved], i) => ({
  id: pid('cmt', i + 1),
  body, author: pid('usr', u), procedure: pid('prc', p), approved,
}));

// [userIndex, procedureIndex, rating, body, approved]
export const reviews = [
  [6, 1, 5, 'Clear and accurate. The five steps matched exactly what happened at the counter.', true],
  [7, 1, 4, 'Good guide, though the fee at my office was slightly higher because of the stamp.', true],
  [8, 2, 5, 'Saved me a wasted trip — I would not have brought the family record book otherwise.', true],
  [9, 2, 4, 'Accurate, but the office hours differ in Erbil.', true],
  [6, 4, 5, 'Exactly right, including the point about the court order after one year.', true],
  [7, 5, 3, 'The medical step took much longer than suggested here.', true],
  [8, 8, 5, 'The note about needing the university letter first saved me a whole day.', true],
  [9, 9, 4, 'Thorough. Would be useful to add the social security registration deadline.', true],
  [6, 11, 4, 'Helpful, though agents vary in what they ask for.', false],
  [7, 12, 5, 'The explanation of the field visit was reassuring and turned out to be accurate.', true],
].map(([u, p, rating, body, approved], i) => ({
  id: pid('rvw', i + 1),
  rating, body, author: pid('usr', u), procedure: pid('prc', p), approved,
}));

export const contact = [
  ['Yusuf', 'Al-Amiri', 'yusuf.alamiri@example.iq', '+964 770 111 2233',
    'The passport renewal page lists a 7–10 day wait, but the Basra office told me 15 days. Could you check with them?', 'new'],
  ['Shilan', 'Kamal', 'shilan.kamal@example.iq', '+964 750 222 3344',
    'Could you add the Kurdish translation for the vehicle transfer procedure? Only English and Arabic are showing.', 'in_progress'],
  ['Omar', 'Al-Dulaimi', 'omar.d@example.iq', '+964 780 333 4455',
    'The link to the LLC articles template returns an error on mobile. Works fine on desktop.', 'resolved'],
  ['Nadia', 'Hassan', 'nadia.hassan@example.iq', '+964 771 444 5566',
    'Is there a procedure page planned for renewing a residency card, or only for first issuance?', 'new'],
  ['Bakhtiar', 'Salih', 'bakhtiar.salih@example.iq', '+964 750 555 6677',
    'Suggestion: show the nearest branch on the procedure page based on the governorate I select.', 'new'],
  ['Rana', 'Al-Khafaji', 'rana.k@example.iq', '+964 782 666 7788',
    'The tax clearance validity is 90 days here but the certificate I received says 60. Worth verifying.', 'in_progress'],
].map(([first, last, email, phone, message, status], i) => ({
  id: pid('cnt', i + 1),
  first_name: first, last_name: last, email, phone, message, status,
  ip_address: `10.20.${30 + i}.${100 + i}`,
  user_agent: 'Mozilla/5.0 (seed data — not a real request)',
  handled_by: status === 'new' ? '' : pid('usr', 3),
}));
