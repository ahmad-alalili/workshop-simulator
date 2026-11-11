/* =============================================
IC Circuit Simulator — Main Application
============================================= */

// ============================================================
// APP VERSION + CACHE BUSTING — لإجبار المتصفح على تحديث الموقع
// ============================================================
// هذا الرقم يُحدّث يدوياً مع كل تحديث على GitHub. عند التحميل،
// نقارنه بالقيمة المحفوظة في localStorage. إذا اختلف، نمسح الـ
// caches ونعيد التحميل بالكامل.
//
// ⚠️ مهم: غيّر الرقم في 3 أماكن مع كل deploy:
//   1. APP_VERSION هنا (في app.js)
//   2. ?v=... في <link rel="stylesheet"> داخل index.html
//   3. ?v=... في <script src="app.js"> داخل index.html
const APP_VERSION = '20261111-48';

// — تحقّق إذا كانت النسخة الحالية مختلفة عن المحفوظة، أعد التحميل —
(function checkVersionAndReloadIfStale() {
    try {
        const stored = localStorage.getItem('icsim-app-version');
        if (stored && stored !== APP_VERSION) {
            console.log(`[icsim] Version changed: ${stored} → ${APP_VERSION}. Clearing caches…`);
            // امسح أي Service Worker caches موجودة
            if ('caches' in window) {
                caches.keys().then(keys =>
                    Promise.all(keys.map(k => caches.delete(k)))
                ).catch(() => {});
            }
            // امسح Service Workers مسجَّلة
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations()
                    .then(regs => regs.forEach(r => r.unregister()))
                    .catch(() => {});
            }
        }
        localStorage.setItem('icsim-app-version', APP_VERSION);
    } catch (e) { /* localStorage معطّل */ }
})();

// — إجبار تحديث كامل (يستدعيه زر 🔄 في الـ header) —
function hardRefreshApp() {
    try {
        // امسح version flag ليعتبر التحميل التالي "أول مرة"
        localStorage.removeItem('icsim-app-version');
    } catch (e) {}
    // امسح caches
    const clearAll = [];
    if ('caches' in window) {
        clearAll.push(caches.keys().then(keys =>
            Promise.all(keys.map(k => caches.delete(k)))
        ).catch(() => {}));
    }
    if ('serviceWorker' in navigator) {
        clearAll.push(navigator.serviceWorker.getRegistrations()
            .then(regs => regs.forEach(r => r.unregister()))
            .catch(() => {}));
    }
    Promise.allSettled(clearAll).then(() => {
        // أضف timestamp إلى الـ URL لتجاوز كاش المتصفح
        const url = new URL(window.location.href);
        url.searchParams.set('_t', Date.now().toString());
        window.location.replace(url.toString());
    });
}

// ==========================================
// I18N — INTERNATIONALIZATION SYSTEM
// ==========================================
// نظام ثنائي اللغة: العربية والإنجليزية، يحفظ التفضيل في localStorage
// عند التحميل. الزر في الـ header يبدّل بين اللغتَين.

let currentLang = 'en';   // الافتراضي عند أول تحميل
try {
    const saved = localStorage.getItem('icsim-lang');
    if (saved === 'ar' || saved === 'en') currentLang = saved;
} catch (e) { /* localStorage معطّل في بعض المتصفحات أو الـ private mode */ }

const TRANSLATIONS = {
    en: {
        // === App ===
        'app.title':            'IC Simulator',
        'app.subtitle':         'IC Circuit Simulator',

        // === Tools ===
        'tool.select':          'Select',
        'tool.wire':            'Wire',
        'tool.cut':             'Cut',
        'tool.delete':          'Delete',
        'tool.undo':            'Undo',
        'tool.redo':            'Redo',
        'tool.undo.tooltip':    'Undo (Ctrl+Z)',
        'tool.redo.tooltip':    'Redo (Ctrl+Y)',

        // === Header ===
        'header.help':          'Help',
        'header.save':          'Save',
        'header.load':          'Load',
        'header.example1':      'AND Gate',
        'header.example2':      'Comparator',
        'header.example3':      '7447 Display',
        'header.example4':      '555 Timer',
        'header.example5':      'Pull-down + AND',
        'header.example6':      '74193 Counter + LEDs',
        'header.example7':      '74193 + 7447 + 7-Seg',
        'header.example8':      'Auto Counter (555+74193+7447+7Seg)',
        'header.examples':      'Examples',
        'header.examples.tooltip': 'Load an example circuit',
        'header.clearAll':      'Clear All',
        'header.save.tooltip':  'Save circuit as JSON',
        'header.load.tooltip':  'Load circuit from JSON',
        'header.langToggle.tooltip': 'Switch language',
        'header.langToggle.label': 'العربية',     // النص داخل الزر يعرض اللغة المقابلة
        'header.refresh.tooltip': 'Force refresh from server (bypass cache)',
        'header.exam':          'Exam Mode',
        'header.examExit':      'Exit Exam',
        'header.exam.tooltip':  'Exam mode: hides the examples and pin names',
        'exam.badge':           '📝 Exam mode — pin names and examples are hidden',
        'exam.confirmExit':     'Exit exam mode? Pin names and examples will be shown again after a 2-minute wait.',
        'header.examExiting':   'Cancel exit ({time})',
        'exam.badgeExiting':    '⏳ Exam mode ends in {time}',
        'toast.examExitStarted':   '⏳ Exam mode will end in 2 minutes',
        'toast.examExitCancelled': '📝 Exit cancelled — exam mode stays ON',
        'toast.examOn':         '📝 Exam mode ON',
        'toast.examOff':        'Exam mode OFF',
        'refresh.refreshing':   'Refreshing from server…',

        // === Sidebar ===
        'sidebar.searchPlaceholder': '🔍 Search components...',
        'sidebar.cat.ic':       'Integrated Circuits',
        'sidebar.cat.io':       'Inputs / Outputs',
        'sidebar.cat.power':    'Power Sources',
        'sidebar.cat.passive':  'Electronic Components',
        'sidebar.footer':       'Click to add component',

        // === Components ===
        'comp.7408.desc':       'Quad AND Gate',
        'comp.7485.desc':       '4-Bit Comparator',
        'comp.7447.desc':       'BCD → 7-Segment',
        'comp.74193.desc':      '4-Bit Counter ↑↓',
        'comp.555.desc':        'Timer / Oscillator',
        'comp.switch.name':     'Logic Toggle',
        'comp.switch.desc':     'HIGH / LOW Source',
        'comp.switchPhys.name': 'Physical Toggle',
        'comp.switchPhys.desc': 'SPST — needs Pull',
        'comp.dip.name':        'DIP Switch',
        'comp.dip.desc':        '4-Bit DIP Switch',
        'comp.push.name':       'Logic Push',
        'comp.push.desc':       'Momentary Source',
        'comp.pushPhys.name':   'Physical Push',
        'comp.pushPhys.desc':   'Momentary — needs Pull',
        'comp.led.desc':        'Light Indicator',
        'comp.7segCC.name':     '7-Seg CC',
        'comp.7segCC.desc':     'Common Cathode',
        'comp.7segCA.name':     '7-Seg CA',
        'comp.7segCA.desc':     'Common Anode',
        'comp.vcc.desc':        'Positive Supply',
        'comp.gnd.desc':        'Ground',
        'comp.resistor.name':   'Resistor',
        'comp.resistor.desc':   'Right-click to edit',
        'comp.capacitor.name':  'Capacitor',
        'comp.capacitor.desc':  'Right-click to edit',

        // === IC descriptions (used in info panel) ===
        'ic.7408.desc':         'Quad 2-input AND gates (four gates)',
        'ic.7485.desc':         '4-bit magnitude comparator',
        'ic.7447.desc':         'BCD-to-7-segment decoder (Active-LOW outputs — drives Common-Anode display)',
        'ic.74193.desc':        '4-bit synchronous up/down binary counter',
        'ic.555.desc':          'Precision timer / oscillator',

        // === 7-Segment ===
        'sevenSeg.cc.connect':  'Connect COM to GND. Each segment lights when its pin is HIGH. Works with the 74LS48.',
        'sevenSeg.ca.connect':  'Connect COM to VCC. Each segment lights when its pin is LOW. Works with the 7447.',

        // === Workspace ===
        'workspace.buildArea':  '📐 Circuit Build Area',

        // === Info panel ===
        'info.placeholder':     'Select a component to see details',

        // === Status ===
        'status.tool':          'Tool',
        'status.hint.default':  'Click a component from the sidebar then click on workspace to place it',
        'status.hint.placing':  'Click on the workspace to place the component (Esc to cancel)',
        'status.hint.wire':     'Click a pin to start a wire, click another pin to finish',
        'status.hint.wireDrawing': 'Click waypoints to shape the wire, click target pin to finish (Esc to cancel)',
        'status.hint.delete':   'Click a component or wire to delete it',
        'status.hint.cutWire':  'Click a wire to cut it',
        'status.hint.select':   'Click to select. Drag to move. Right-click for options',

        // === Info panel sections ===
        'info.section.pinout':  'PINOUT diagram',
        'info.section.truth':   'Truth table',
        'info.section.pinState':'Current pin states',
        'info.section.555mode': '⚡ Operating mode',
        'info.555.astable':     'Astable mode — generates continuous pulses. Connect TRIG (2) to THRES (6) for astable. Frequency depends on R1, R2, and C.',
        'info.555.changeFreq':  '🔧 Change frequency',
        'info.555.changeFreqHelp': '• Right-click resistors R1 or R2 to change values\n• Right-click capacitor to change capacitance\n• Adding more components changes the timing',

        // === Toasts ===
        'toast.placedClamped':  '⚠️ Position clamped inside the build area',
        'toast.wireOutsideArea':'⚠️ Cannot draw wires outside the build area',
        'toast.saved':          '✅ Project saved',
        'toast.loaded':         '✅ Project loaded',
        'toast.empty':          '⚠️ No components to save',
        'toast.invalidFile':    '❌ Invalid file',
        'toast.invalidJSON':    '❌ Invalid JSON file',
        'toast.loadFailed':     '❌ Failed to load project',
        'toast.readFailed':     '❌ Failed to read file',
        'toast.fileNewer':      '⚠️ File version is newer than the simulator',

        // === Help modal ===
        'help.title':           'Controls',
        'help.section.tools':   '🛠️ Basic Tools',
        'help.section.editing': '⚡ Editing',
        'help.section.view':    '🔍 View & Navigation',
        'help.section.tips':    '💡 Tips',
        'help.tool.select':     'Select tool',
        'help.tool.wire':       'Wire tool',
        'help.tool.cut':        'Cut wire',
        'help.tool.delete':     'Delete component',
        'help.editing.rotate':  'Rotate component',
        'help.editing.cancel':  'Cancel current action',
        'help.editing.multi':   'Multi-select',
        'help.editing.delete':  'Delete selected',
        'help.view.zoom':       'Zoom in / out',
        'help.view.pan':        'Pan workspace',
        'help.view.touchPan':   'Two-finger drag (trackpad)',
        'help.view.touchZoom':  'Pinch (trackpad / touch)',
        'help.tips.body':       '• Hold <b>Ctrl</b> and click to multi-select components, then press <b>Delete</b> to remove all of them.<br>• Right-click any component for additional options (change values, colors, rotation).',
        'help.close':           'Close',

    },

    ar: {
        // === App ===
        'app.title':            'محاكي الدوائر',
        'app.subtitle':         'محاكي الدوائر المتكاملة',

        // === Tools ===
        'tool.select':          'تحديد',
        'tool.wire':            'سلك',
        'tool.cut':             'قص',
        'tool.delete':          'حذف',
        'tool.undo':            'تراجع',
        'tool.redo':            'إعادة',
        'tool.undo.tooltip':    'تراجع (Ctrl+Z)',
        'tool.redo.tooltip':    'إعادة (Ctrl+Y)',

        // === Header ===
        'header.help':          'مساعدة',
        'header.save':          'حفظ',
        'header.load':          'تحميل',
        'header.example1':      'بوابة AND',
        'header.example2':      'مقارن',
        'header.example3':      'عرض 7447',
        'header.example4':      'مؤقت 555',
        'header.example5':      'سحب سفلي + AND',
        'header.example6':      'عدّاد 74193 + LEDs',
        'header.example7':      'عدّاد 74193 + 7447 + شاشة',
        'header.example8':      'عدّاد أوتوماتيكي (555+74193+7447+شاشة)',
        'header.examples':      'أمثلة',
        'header.examples.tooltip': 'تحميل دائرة مثال',
        'header.clearAll':      'مسح الكل',
        'header.save.tooltip':  'حفظ الدائرة كـ JSON',
        'header.load.tooltip':  'تحميل دائرة من JSON',
        'header.langToggle.tooltip': 'تبديل اللغة',
        'header.langToggle.label': 'English',
        'header.refresh.tooltip': 'تحديث قسري من الخادم (تجاوز الكاش)',
        'header.exam':          'وضع الاختبار',
        'header.examExit':      'إنهاء الاختبار',
        'header.exam.tooltip':  'وضع الاختبار: يخفي الأمثلة ومسميات الأطراف',
        'exam.badge':           '📝 وضع الاختبار — مسميات الأطراف والأمثلة مخفية',
        'exam.confirmExit':     'هل تريد إنهاء وضع الاختبار؟ ستظهر مسميات الأطراف والأمثلة بعد انتظار دقيقتين.',
        'header.examExiting':   'إلغاء الإنهاء ({time})',
        'exam.badgeExiting':    '⏳ ينتهي وضع الاختبار بعد {time}',
        'toast.examExitStarted':   '⏳ سينتهي وضع الاختبار بعد دقيقتين',
        'toast.examExitCancelled': '📝 أُلغي الإنهاء — وضع الاختبار مستمر',
        'toast.examOn':         '📝 تم تفعيل وضع الاختبار',
        'toast.examOff':        'تم إنهاء وضع الاختبار',
        'refresh.refreshing':   'جاري التحديث من الخادم...',

        // === Sidebar ===
        'sidebar.searchPlaceholder': '🔍 ابحث عن المكونات...',
        'sidebar.cat.ic':       'الدوائر المتكاملة',
        'sidebar.cat.io':       'المداخل / المخارج',
        'sidebar.cat.power':    'مصادر الطاقة',
        'sidebar.cat.passive':  'مكونات إلكترونية',
        'sidebar.footer':       'انقر لإضافة مكون',

        // === Components ===
        'comp.7408.desc':       'أربع بوابات AND',
        'comp.7485.desc':       'مقارن 4-بت',
        'comp.7447.desc':       'BCD ← 7-أجزاء',
        'comp.74193.desc':      'عدّاد 4-بت ↑↓',
        'comp.555.desc':        'مؤقت / مذبذب',
        'comp.switch.name':     'مفتاح منطقي',
        'comp.switch.desc':     'مصدر HIGH / LOW',
        'comp.switchPhys.name': 'مفتاح فيزيائي',
        'comp.switchPhys.desc': 'يحتاج Pull-up/down',
        'comp.dip.name':        'مفتاح DIP',
        'comp.dip.desc':        'مفتاح DIP رباعي',
        'comp.push.name':       'زر منطقي',
        'comp.push.desc':       'مصدر لحظي',
        'comp.pushPhys.name':   'زر فيزيائي',
        'comp.pushPhys.desc':   'يحتاج Pull-up/down',
        'comp.led.desc':        'مؤشر ضوئي',
        'comp.7segCC.name':     '7-أجزاء CC',
        'comp.7segCC.desc':     'كاثود مشترك',
        'comp.7segCA.name':     '7-أجزاء CA',
        'comp.7segCA.desc':     'أنود مشترك',
        'comp.vcc.desc':        'تغذية موجبة',
        'comp.gnd.desc':        'أرضي',
        'comp.resistor.name':   'مقاومة',
        'comp.resistor.desc':   'كليك يمين للتعديل',
        'comp.capacitor.name':  'مكثف',
        'comp.capacitor.desc':  'كليك يمين للتعديل',

        // === IC descriptions ===
        'ic.7408.desc':         'بوابات AND ثنائية المدخل (4 بوابات)',
        'ic.7485.desc':         'مقارن أحجام 4-بت',
        'ic.7447.desc':         'محوّل BCD إلى شاشة 7 أجزاء (مخارج Active-LOW — لقيادة Common Anode)',
        'ic.74193.desc':        'عدّاد ثنائي 4-بت صعودي/نزولي',
        'ic.555.desc':          'مؤقت دقيق / مولد نبضات',

        // === 7-Segment ===
        'sevenSeg.cc.connect':  'وصّل COM بـ GND. كل شريحة تضيء عندما يكون الطرف HIGH. مناسب مع IC 74LS48.',
        'sevenSeg.ca.connect':  'وصّل COM بـ VCC. كل شريحة تضيء عندما يكون الطرف LOW. مناسب مع IC 7447.',

        // === Workspace ===
        'workspace.buildArea':  '📐 منطقة بناء الدائرة',

        // === Info panel ===
        'info.placeholder':     'اختر مكوناً لعرض معلوماته',

        // === Status ===
        'status.tool':          'الأداة',
        'status.hint.default':  'انقر على مكون من الشريط الجانبي ثم انقر على منطقة العمل لوضعه',
        'status.hint.placing':  'انقر على منطقة العمل لوضع المكون (Esc للإلغاء)',
        'status.hint.wire':     'انقر على طرف لبدء سلك، ثم انقر على طرف آخر للإنهاء',
        'status.hint.wireDrawing': 'انقر لإضافة نقاط مسار، ثم انقر على الطرف الهدف للإنهاء (Esc للإلغاء)',
        'status.hint.delete':   'انقر على مكون أو سلك لحذفه',
        'status.hint.cutWire':  'انقر على سلك لقطعه',
        'status.hint.select':   'انقر للتحديد. اسحب للتحريك. كليك يمين للخيارات',

        // === Info panel sections ===
        'info.section.pinout':  'مخطط الأطراف (PINOUT)',
        'info.section.truth':   'جدول الحقيقة',
        'info.section.pinState':'حالة الأطراف الحالية',
        'info.section.555mode': '⚡ وضع التشغيل',
        'info.555.astable':     'وضع غير مستقر (Astable) — يولّد نبضات مستمرة. وصّل TRIG (2) مع THRES (6) للوضع غير المستقر. التردد يعتمد على R1، R2، و C.',
        'info.555.changeFreq':  '🔧 تغيير التردد',
        'info.555.changeFreqHelp': '• كليك يمين على المقاومات R1 أو R2 لتغيير القيم\n• كليك يمين على المكثف لتغيير السعة\n• إضافة مكونات أخرى تغيّر التوقيت',

        // === Toasts ===
        'toast.placedClamped':  '⚠️ تم تثبيت الموضع داخل منطقة البناء',
        'toast.wireOutsideArea':'⚠️ لا يمكن رسم الأسلاك خارج منطقة البناء',
        'toast.saved':          '✅ تم حفظ المشروع',
        'toast.loaded':         '✅ تم تحميل المشروع',
        'toast.empty':          '⚠️ لا توجد مكونات للحفظ',
        'toast.invalidFile':    '❌ ملف غير صالح',
        'toast.invalidJSON':    '❌ ملف JSON غير صالح',
        'toast.loadFailed':     '❌ فشل تحميل المشروع',
        'toast.readFailed':     '❌ فشل قراءة الملف',
        'toast.fileNewer':      '⚠️ نسخة الملف أحدث من المحاكي',

        // === Help modal ===
        'help.title':           'تعليمات التحكم',
        'help.section.tools':   '🛠️ الأدوات الأساسية',
        'help.section.editing': '⚡ التحكم والتحرير',
        'help.section.view':    '🔍 العرض والتنقل',
        'help.section.tips':    '💡 تلميحات',
        'help.tool.select':     'أداة التحديد',
        'help.tool.wire':       'أداة الأسلاك',
        'help.tool.cut':        'قطع الأسلاك',
        'help.tool.delete':     'حذف عنصر',
        'help.editing.rotate':  'تدوير العنصر',
        'help.editing.cancel':  'إلغاء الأمر الحالي',
        'help.editing.multi':   'تحديد متعدد',
        'help.editing.delete':  'حذف المحدد (جماعي)',
        'help.view.zoom':       'تقريب / تبعيد',
        'help.view.pan':        'تحريك اللوحة',
        'help.view.touchPan':   'سحب بإصبعَين (تاتش-باد)',
        'help.view.touchZoom':  'فتح/ضم الإصبعَين (تاتش-باد / لمس)',
        'help.tips.body':       '• يمكنك تحديد عدة عناصر بحبس مفتاح <b>Ctrl</b> والنقر عليها، ثم حذفها جميعاً بزر <b>Delete</b>.<br>• انقر بزر الماوس الأيمن على أي عنصر لخيارات إضافية (تغيير القيم، الألوان، التدوير).',
        'help.close':           'إغلاق',

    }
};

// — يُرجع النص المترجم للمفتاح المعطى أو fallback أو الـ key نفسه —
function t(key, fallback) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    return (dict[key] !== undefined) ? dict[key] : (fallback !== undefined ? fallback : key);
}

// — تطبيق الترجمة على كل العناصر التي تحوي data-i18n* —
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
    // اللغة المعروضة في الزر تكون اللغة المقابلة (الزر يُظهر "ماذا سيحدث لو ضغطته")
    const langDisplay = document.getElementById('lang-display');
    if (langDisplay) langDisplay.textContent = t('header.langToggle.label');
    // تحديث lang و dir على الـ <html>
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    // تحديث النصوص الديناميكية إن أمكن (info panel، status hint...)
    refreshDynamicI18n();
}

function setLanguage(lang) {
    if (lang !== 'ar' && lang !== 'en') return;
    currentLang = lang;
    try { localStorage.setItem('icsim-lang', lang); } catch (e) {}
    applyTranslations();
}

function toggleLanguage() {
    setLanguage(currentLang === 'ar' ? 'en' : 'ar');
}

// — تحديث النصوص الديناميكية (تتطلب إعادة عرض شيء في الـ DOM) —
function refreshDynamicI18n() {
    // إعادة عرض لوحة المعلومات إذا كانت مفتوحة على مكون
    if (typeof selectedCompId !== 'undefined' && selectedCompId) {
        const comp = (typeof components !== 'undefined') ? components.get(selectedCompId) : null;
        if (comp && typeof showComponentInfo === 'function') {
            showComponentInfo(comp);
        }
    }
    // تحديث الـ status hint والأداة الحالية
    if (typeof updateHint === 'function') updateHint();
    if (typeof updateToolStatus === 'function' && typeof currentTool !== 'undefined') {
        updateToolStatus(currentTool);
    }
    // تحديث نصوص وضع الاختبار (الزر والشارة)
    updateExamUI();
}

// ==========================================
// IC PIN DEFINITIONS
// ==========================================
const IC_DEFINITIONS = {
    IC7408: {
        name: '74LS08',
        fullName: 'IC 7408 — Quad 2-Input AND Gates',
        descAr: 'بوابات AND ثنائية المدخل (4 بوابات)',
        descKey: 'ic.7408.desc',
        sublabel: 'AND',
        pinCount: 14,
        // نطاق التشغيل من datasheet 74LS08 (TTL)
        voltageMin: 4.75,    // أدنى فولتية للعمل الموثوق
        voltageMax: 5.25,    // أعلى فولتية للعمل العادي
        absoluteMax: 7.0,    // فوقها → احتراق دائم
        pins: [
            { num: 1, name: '1A', type: 'input', side: 'left' },
            { num: 2, name: '1B', type: 'input', side: 'left' },
            { num: 3, name: '1Y', type: 'output', side: 'left' },
            { num: 4, name: '2A', type: 'input', side: 'left' },
            { num: 5, name: '2B', type: 'input', side: 'left' },
            { num: 6, name: '2Y', type: 'output', side: 'left' },
            { num: 7, name: 'GND', type: 'power', side: 'left' },
            { num: 8, name: '3Y', type: 'output', side: 'right' },
            { num: 9, name: '3A', type: 'input', side: 'right' },
            { num: 10, name: '3B', type: 'input', side: 'right' },
            { num: 11, name: '4Y', type: 'output', side: 'right' },
            { num: 12, name: '4A', type: 'input', side: 'right' },
            { num: 13, name: '4B', type: 'input', side: 'right' },
            { num: 14, name: 'VCC', type: 'power', side: 'right' },
        ],
        evaluate(pinStates, comp) {
            // مدخلات floating → 0 (LOW) لتجنّب وميض الخرج
            const s = comp.pinStrengths || {};
            const isDriven = (p) => s[p] === 'strong' || s[p] === 'weak';
            const g = (p) => isDriven(p) ? (pinStates[p] || 0) : 0;
            return {
                3: g(1) && g(2),
                6: g(4) && g(5),
                8: g(9) && g(10),
                11: g(12) && g(13),
            };
        },
        pinout: `        ┌──U──┐
   1A   │ 1 14│ VCC
   1B   │ 2 13│ 4B
   1Y   │ 3 12│ 4A
   2A   │ 4 11│ 4Y
   2B   │ 5 10│ 3B
   2Y   │ 6  9│ 3A
   GND  │ 7  8│ 3Y
        └─────┘
Y = A · B (Quad 2-input AND)`,
        truthTable: {
            headers: ['A', 'B', 'Y = A·B'],
            rows: [
                [0, 0, 0],
                [0, 1, 0],
                [1, 0, 0],
                [1, 1, 1],
            ]
        }
    },
    IC7485: {
        name: '74LS85',
        fullName: 'IC 7485 — 4-Bit Magnitude Comparator',
        descAr: 'مقارن حجم 4-بت',
        descKey: 'ic.7485.desc',
        sublabel: 'CMP',
        pinCount: 16,
        voltageMin: 4.75,
        voltageMax: 5.25,
        absoluteMax: 7.0,
        pins: [
            { num: 1, name: 'B3', type: 'input', side: 'left' },
            { num: 2, name: 'IA<B', type: 'input', side: 'left' },        // Cascade Input
            { num: 3, name: 'IA=B', type: 'input', side: 'left' },        // Cascade Input
            { num: 4, name: 'IA>B', type: 'input', side: 'left' },        // Cascade Input
            { num: 5, name: 'OA>B', type: 'output', side: 'left' },       // Output
            { num: 6, name: 'OA=B', type: 'output', side: 'left' },       // Output
            { num: 7, name: 'OA<B', type: 'output', side: 'left' },       // Output
            { num: 8, name: 'GND', type: 'power', side: 'left' },
            { num: 9, name: 'B0', type: 'input', side: 'right' },
            { num: 10, name: 'A0', type: 'input', side: 'right' },
            { num: 11, name: 'B1', type: 'input', side: 'right' },
            { num: 12, name: 'A1', type: 'input', side: 'right' },
            { num: 13, name: 'A2', type: 'input', side: 'right' },
            { num: 14, name: 'B2', type: 'input', side: 'right' },
            { num: 15, name: 'A3', type: 'input', side: 'right' },
            { num: 16, name: 'VCC', type: 'power', side: 'right' },
        ],
        evaluate(pinStates, comp, nets) {
            // — قارئ ذكي يستبدل القيم العشوائية floating بـ 0 (LOW) —
            // المقارن حساس جداً لأي ضوضاء على أيٍّ من 11 مدخلاً، فنُجبر
            // الـ floating على LOW حتى لا يقفز الخرج عشوائياً (سلوك مماثل
            // لـ pull-down داخلي ضمني). الأطراف الموصولة فعلياً تأخذ قيمها.
            const strengths = comp.pinStrengths || {};
            const isDriven = (p) => strengths[p] === 'strong' || strengths[p] === 'weak';
            const g = (p, dflt = 0) => isDriven(p) ? (pinStates[p] || 0) : dflt;

            // Cascade inputs: defaults للعمل المستقل single-chip mode
            const iLT = g(2, 0);    // IA<B floating → 0
            const iEQ = g(3, 1);    // IA=B floating → 1 (يسمح بمقارنة 4 بت كاملة)
            const iGT = g(4, 0);    // IA>B floating → 0

            // مداخل البيانات: floating → 0 (مثل pull-down داخلي)
            const A = [g(10), g(12), g(13), g(15)];   // A0..A3
            const B = [g(9),  g(11), g(14), g(1)];    // B0..B3

            // المقارنة 4-بت بدءاً من MSB
            for (let i = 3; i >= 0; i--) {
                if (A[i] > B[i]) return { 5: 1, 6: 0, 7: 0 };
                if (A[i] < B[i]) return { 5: 0, 6: 0, 7: 1 };
            }
            // A == B → cascade يقرّر
            if (iGT === 1 && iLT === 0) return { 5: 1, 6: 0, 7: 0 };
            if (iLT === 1 && iGT === 0) return { 5: 0, 6: 0, 7: 1 };
            return { 5: 0, 6: iEQ, 7: 0 };
        },
        pinout: `         ┌──U──┐
   B3    │ 1 16│ VCC
   IA<B  │ 2 15│ A3
   IA=B  │ 3 14│ B2
   IA>B  │ 4 13│ A2
   OA>B  │ 5 12│ A1
   OA=B  │ 6 11│ B1
   OA<B  │ 7 10│ A0
   GND   │ 8  9│ B0
         └─────┘
I = Cascade Input | O = Comparator Output`,
        truthTable: {
            headers: ['A vs B', 'OA>B', 'OA=B', 'OA<B'],
            rows: [
                ['A > B', 1, 0, 0],
                ['A = B', 0, 1, 0],
                ['A < B', 0, 0, 1],
            ]
        }
    },
    IC7447: {
        name: '74LS47',
        fullName: 'IC 7447 — BCD to 7-Segment Decoder/Driver',
        descAr: 'محوّل BCD إلى شاشة 7 أجزاء (مخارج Active-LOW — لقيادة Common Anode)',
        descKey: 'ic.7447.desc',
        sublabel: 'BCD→7S',
        pinCount: 16,
        voltageMin: 4.75,
        voltageMax: 5.25,
        absoluteMax: 7.0,
        pins: [
            // BCD inputs: A=LSB (weight 1), B (weight 2), C (weight 4), D=MSB (weight 8)
            { num: 1, name: 'B', type: 'input', side: 'left' },                          // BCD bit 1 (weight 2)
            { num: 2, name: 'C', type: 'input', side: 'left' },                          // BCD bit 2 (weight 4)
            { num: 3, name: 'LT', type: 'input', side: 'left', activeLow: true },        // Lamp Test (active LOW)
            { num: 4, name: 'BI/RBO', type: 'input', side: 'left', activeLow: true },    // Blanking In / Ripple-Blanking Out (active LOW)
            { num: 5, name: 'RBI', type: 'input', side: 'left', activeLow: true },       // Ripple Blanking In (active LOW)
            { num: 6, name: 'D', type: 'input', side: 'left' },                          // BCD bit 3 = MSB (weight 8)
            { num: 7, name: 'A', type: 'input', side: 'left' },                          // BCD bit 0 = LSB (weight 1)
            { num: 8, name: 'GND', type: 'power', side: 'left' },
            { num: 9, name: 'e', type: 'output', side: 'right' },
            { num: 10, name: 'd', type: 'output', side: 'right' },
            { num: 11, name: 'c', type: 'output', side: 'right' },
            { num: 12, name: 'b', type: 'output', side: 'right' },
            { num: 13, name: 'a', type: 'output', side: 'right' },
            { num: 14, name: 'g', type: 'output', side: 'right' },
            { num: 15, name: 'f', type: 'output', side: 'right' },
            { num: 16, name: 'VCC', type: 'power', side: 'right' },
        ],
        evaluate(pinStates, comp) {
            // floating → القيمة الافتراضية الآمنة (BCD=0، control inputs=1 للتعطيل)
            const _strengths = comp.pinStrengths || {};
            const isDriven = (p) => _strengths[p] === 'strong' || _strengths[p] === 'weak';
            // BCD: floating → 0 (يعرض الرقم 0)
            const g = (p) => isDriven(p) ? (pinStates[p] || 0) : 0;
            // Control inputs (active LOW): floating → 1 (HIGH = معطّل)
            const gc = (p) => isDriven(p) ? (pinStates[p] || 0) : 1;

            // BCD inputs per datasheet: A=pin7 (LSB), B=pin1, C=pin2, D=pin6 (MSB)
            const A = g(7), B = g(1), C = g(2), D = g(6);
            const bcd = A + B * 2 + C * 4 + D * 8;

            // Auxiliary inputs (active LOW): pin 4 = BI̅, pin 3 = LT̅, pin 5 = RBI̅
            if (gc(4) === 0) return { 13: 1, 12: 1, 11: 1, 10: 1, 9: 1, 15: 1, 14: 1 }; // BI̅=0 → blank
            if (gc(3) === 0) return { 13: 0, 12: 0, 11: 0, 10: 0, 9: 0, 15: 0, 14: 0 }; // LT̅=0 → all segments
            if (gc(5) === 0 && bcd === 0) return { 13: 1, 12: 1, 11: 1, 10: 1, 9: 1, 15: 1, 14: 1 }; // RBI̅=0 & BCD=0 → blank

            const T = [
                [0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 1, 1, 1, 1],
                [0, 0, 1, 0, 0, 1, 0],
                [0, 0, 0, 0, 1, 1, 0],
                [1, 0, 0, 1, 1, 0, 0],
                [0, 1, 0, 0, 1, 0, 0],
                [1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 1, 1],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0],
                [1, 1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1, 0],
                [1, 0, 1, 1, 1, 0, 0],
                [0, 1, 1, 0, 1, 0, 0],
                [1, 1, 1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1]
            ];
            const s = T[bcd] || T[15];
            return { 13: s[0], 12: s[1], 11: s[2], 10: s[3], 9: s[4], 15: s[5], 14: s[6] };
        },
        pinout: `         ┌──U──┐
   B     │ 1 16│ VCC
   C     │ 2 15│ f
   LT\\   │ 3 14│ g
 BI\\/RBO\\│ 4 13│ a
   RBI\\  │ 5 12│ b
   D     │ 6 11│ c
   A     │ 7 10│ d
   GND   │ 8  9│ e
         └─────┘
A=LSB, D=MSB | (\\) = Active-LOW`,
        truthTable: {
            headers: ['BCD', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
            rows: [
                [0, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 0, 0, 1, 1, 1, 1],
                [2, 0, 0, 1, 0, 0, 1, 0],
                [3, 0, 0, 0, 0, 1, 1, 0],
                [4, 1, 0, 0, 1, 1, 0, 0],
                [5, 0, 1, 0, 0, 1, 0, 0],
                [6, 1, 1, 0, 0, 0, 0, 0],
                [7, 0, 0, 0, 1, 1, 1, 1],
                [8, 0, 0, 0, 0, 0, 0, 0],
                [9, 0, 0, 0, 1, 1, 0, 0]
            ]
        }
    },
    IC74193: {
        name: '74LS193',
        fullName: 'IC 74193 — 4-Bit Up/Down Counter',
        descAr: 'عدّاد ثنائي 4-بت صعودي/نزولي',
        descKey: 'ic.74193.desc',
        sublabel: 'CTR',
        pinCount: 16,
        voltageMin: 4.75,
        voltageMax: 5.25,
        absoluteMax: 7.0,
        // الأطراف موثّقة من Motorola/ON-Semi SN74LS193 datasheet
        // P0–P3: مداخل البيانات المتوازية (P0 = LSB)
        // Q0–Q3: مخارج العدّاد (Q0 = LSB)
        // CPU: نبضة العد التصاعدي (Count Pulse Up)
        // CPD: نبضة العد التنازلي (Count Pulse Down)
        // PL: تحميل متوازٍ (active LOW)
        // MR: إعادة ضبط رئيسية (Master Reset, active HIGH)
        // TCU: مخرج Carry  (Terminal Count Up, active LOW)
        // TCD: مخرج Borrow (Terminal Count Down, active LOW)
        pins: [
            { num: 1, name: 'P1', type: 'input', side: 'left' },
            { num: 2, name: 'Q1', type: 'output', side: 'left' },
            { num: 3, name: 'Q0', type: 'output', side: 'left' },
            { num: 4, name: 'CPD', type: 'input', side: 'left' },
            { num: 5, name: 'CPU', type: 'input', side: 'left' },
            { num: 6, name: 'Q2', type: 'output', side: 'left' },
            { num: 7, name: 'Q3', type: 'output', side: 'left' },
            { num: 8, name: 'GND', type: 'power', side: 'left' },
            { num: 9, name: 'P3', type: 'input', side: 'right' },
            { num: 10, name: 'P2', type: 'input', side: 'right' },
            { num: 11, name: 'PL', type: 'input', side: 'right', activeLow: true },     // Parallel Load (active LOW)
            { num: 12, name: 'TCU', type: 'output', side: 'right', activeLow: true },   // Terminal Count Up = Carry (active LOW)
            { num: 13, name: 'TCD', type: 'output', side: 'right', activeLow: true },   // Terminal Count Down = Borrow (active LOW)
            { num: 14, name: 'MR', type: 'input', side: 'right' },
            { num: 15, name: 'P0', type: 'input', side: 'right' },
            { num: 16, name: 'VCC', type: 'power', side: 'right' },
        ],
        evaluate(pinStates, comp) {
            // — مساعد ذكي للتعويم —
            // CPU (pin 5) و CPD (pin 4): تقرأ القيم الخام (تشمل الضوضاء العشوائية)
            //   ← هذا يحافظ على الدرس التربوي: floating clock = عدّ عشوائي
            // باقي المداخل (MR, PL, P0..P3): floating → قيمة افتراضية آمنة
            const s = comp.pinStrengths || {};
            const isDriven = (p) => s[p] === 'strong' || s[p] === 'weak';
            const g = (p) => pinStates[p] || 0;                                  // raw (للـ clock)
            const gSafe = (p, dflt) => isDriven(p) ? (pinStates[p] || 0) : dflt; // مع default

            if (comp.counterValue === undefined) comp.counterValue = 0;
            if (!comp._prevClk) comp._prevClk = { up: 0, dn: 0 };

            // Clock pins: raw (تشمل floating noise)
            const CPU = g(5), CPD = g(4);
            // Control pins: مع defaults آمنة
            const MR = gSafe(14, 0);  // floating → LOW (لا reset)
            const PL = gSafe(11, 1);  // floating → HIGH (active LOW disabled)

            if (MR === 1) {
                // Master Reset (active HIGH) — يصفّر العدّاد
                comp.counterValue = 0;
            } else if (PL === 0) {
                // Parallel Load (active LOW) — يحمّل P0..P3 (مع defaults 0)
                const P0 = gSafe(15, 0), P1 = gSafe(1, 0), P2 = gSafe(10, 0), P3 = gSafe(9, 0);
                comp.counterValue = P0 + P1 * 2 + P2 * 4 + P3 * 8;
            } else if (!comp._edgeProcessed) {
                // كشف الحافة الصاعدة لـ CPU أو CPD
                if (CPU === 1 && comp._prevClk.up === 0) {
                    comp.counterValue = (comp.counterValue + 1) & 0xF;
                    comp._edgeProcessed = true;
                }
                if (CPD === 1 && comp._prevClk.dn === 0) {
                    comp.counterValue = (comp.counterValue - 1) & 0xF;
                    comp._edgeProcessed = true;
                }
            }

            const v = comp.counterValue;
            // حسب الـ datasheet (TCU̅ = NOT(Q0·Q1·Q2·Q3·CPU̅)):
            // TCU = LOW عند العد 15 و CPU=LOW، ويعود HIGH مع الحافة الصاعدة
            //       التالية لـ CPU (لحظة الرجوع إلى 0) ← هذه الحافة تُعدّ المرحلة التالية
            // TCD = LOW عند العد 0  و CPD=LOW
            const TCU = (v === 15 && CPU === 0) ? 0 : 1;
            const TCD = (v === 0 && CPD === 0) ? 0 : 1;

            return {
                3: (v >> 0) & 1,   // Q0
                2: (v >> 1) & 1,   // Q1
                6: (v >> 2) & 1,   // Q2
                7: (v >> 3) & 1,   // Q3
                12: TCU,
                13: TCD
            };
        },
        pinout: `         ┌──U──┐
   P1    │ 1 16│ VCC
   Q1    │ 2 15│ P0
   Q0    │ 3 14│ MR
   CPD   │ 4 13│ TCD\\
   CPU   │ 5 12│ TCU\\
   Q2    │ 6 11│ PL\\
   Q3    │ 7 10│ P2
   GND   │ 8  9│ P3
         └─────┘
P0=LSB, P3=MSB | (\\) = Active-LOW`,
        truthTable: {
            headers: ['Action', 'Result'],
            rows: [
                ['MR = 1', 'Reset → Q3Q2Q1Q0 = 0000'],
                ['PL = 0', 'Load → Qn = Pn (asynchronous)'],
                ['CPU rising edge', 'Count Up: Q ← Q + 1'],
                ['CPD rising edge', 'Count Down: Q ← Q − 1'],
                ['Q = 1111, CPU = 0', 'TCU = 0 (Carry)'],
                ['Q = 0000, CPD = 0', 'TCD = 0 (Borrow)']
            ]
        }
    },
    IC555: {
        name: 'NE555',
        fullName: 'IC 555 — Timer / Oscillator',
        descAr: 'مؤقت دقيق / مولد نبضات',
        descKey: 'ic.555.desc',
        sublabel: 'TMR',
        pinCount: 8,
        // NE555 يقبل نطاق فولتية واسع جداً مقارنة بـ TTL
        voltageMin: 4.5,
        voltageMax: 16.0,
        absoluteMax: 18.0,
        // الأطراف موثّقة من Texas Instruments NE555 datasheet
        // T̄R̄Ī (Trigger, active LOW): يبدأ النبضة عندما V<1/3·VCC
        // R̄Ē̄S̄Ē̄T̄ (active LOW): يطفئ المخرج فوراً
        // CONT (Control Voltage): تعديل الجهد المرجعي
        // THRES (Threshold, active HIGH): ينهي النبضة عندما V>2/3·VCC
        // DISCH (Discharge): مخرج open-collector لتفريغ المكثف
        pins: [
            { num: 1, name: 'GND', type: 'power', side: 'left' },
            { num: 2, name: 'TRIG', type: 'input', side: 'left', activeLow: true },     // Trigger (active LOW)
            { num: 3, name: 'OUT', type: 'output', side: 'left' },
            { num: 4, name: 'RST', type: 'input', side: 'left', activeLow: true },      // Reset (active LOW)
            { num: 5, name: 'CONT', type: 'input', side: 'right' },                     // Control Voltage
            { num: 6, name: 'THRES', type: 'input', side: 'right' },                    // Threshold
            { num: 7, name: 'DISCH', type: 'output', side: 'right' },                   // Discharge (open-collector)
            { num: 8, name: 'VCC', type: 'power', side: 'right' },
        ],
        evaluate(pinStates, comp, nets) {
            // floating defaults آمنة: RST=1 (لا reset)، TRIG=1 (لا trigger)، THRES=0 (تحت العتبة)
            const _str = comp.pinStrengths || {};
            const isDriven = (p) => _str[p] === 'strong' || _str[p] === 'weak';
            const gSafe = (p, dflt) => isDriven(p) ? (pinStates[p] || 0) : dflt;
            const g = (p) => pinStates[p] || 0; // raw للأطراف غير الحرجة

            if (comp.timerState === undefined) {
                comp.timerState = {
                    output: 0,
                    discharge: 0,
                    lastTrigger: 0,
                    lastThreshold: 0
                };
            }

            const state = comp.timerState;
            const reset = gSafe(4, 1);   // floating → 1 (HIGH = لا reset، active LOW)

            // إذا كان في وضع astable مكتشف، الـ output يُحدَّث من المؤقّت الزمني (خارج evaluate).
            // هنا نحترم RESET فقط، ونُرجع الحالة الحالية.
            if (comp._astableConfig) {
                if (reset === 0) {
                    state.output = 0;
                    state.discharge = 0;
                    comp._astableTimeAcc = 0;   // إعادة تصفير المؤقّت عند الـ reset
                    return { 3: 0, 7: 0 };
                }
                return { 3: state.output, 7: state.discharge };
            }

            const trigger = gSafe(2, 1);      // floating → 1 (HIGH = لا trigger، active LOW)
            const threshold = gSafe(6, 0);    // floating → 0 (تحت العتبة، لا تذبذب طارئ)

            if (reset === 0) {
                state.output = 0;
                state.discharge = 0;
                return { 3: 0, 7: 0 };
            }

            if (trigger === 0) {
                state.output = 1;
                state.discharge = 1;   // OUT HIGH → ترانزستور DISCH مغلق → pin 7 = HIGH (مع pull-up)
            } else if (threshold === 1) {
                state.output = 0;
                state.discharge = 0;   // OUT LOW → ترانزستور DISCH مفتوح → pin 7 يصرّف للأرضي = LOW
            }

            return {
                3: state.output,
                7: state.discharge
            };
        },
        pinout: `         ┌──U──┐
   GND   │ 1  8│ VCC
   TRIG\\ │ 2  7│ DISCH
   OUT   │ 3  6│ THRES
   RST\\  │ 4  5│ CONT
         └─────┘
(\\) = Active-LOW`,
        truthTable: {
            headers: ['TRIG\\', 'THRES', 'RST\\', 'OUT'],
            rows: [
                ['0', 'X', '1', '1'],
                ['1', '0', '1', 'Maintain'],
                ['1', '1', '1', '0'],
                ['X', 'X', '0', '0'],
            ]
        }
    },
};

// ==========================================
// 7-SEGMENT DISPLAY CONSTANTS
// ==========================================
const SEVEN_SEG_PINS = [
    { num: 1, name: 'e', side: 'left' },
    { num: 2, name: 'd', side: 'left' },
    { num: 3, name: 'COM', side: 'left' },
    { num: 4, name: 'c', side: 'left' },
    { num: 5, name: 'dp', side: 'left' },
    { num: 6, name: 'b', side: 'right' },
    { num: 7, name: 'a', side: 'right' },
    { num: 8, name: 'COM', side: 'right' },
    { num: 9, name: 'f', side: 'right' },
    { num: 10, name: 'g', side: 'right' },
];

const SEG_TO_PIN = { a: 7, b: 6, c: 4, d: 2, e: 1, f: 9, g: 10, dp: 5 };

function isICType(type) { return type in IC_DEFINITIONS; }
function isSevenSegType(type) { return type === 'SEVEN_SEG_CC' || type === 'SEVEN_SEG_CA'; }

// ==========================================
// HISTORY MANAGER
// ==========================================
class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = 50;
        this.isRestoring = false;
    }

    push(action) {
        if (this.isRestoring) return;
        this.undoStack.push(action);
        if (this.undoStack.length > this.maxSize) this.undoStack.shift();
        this.redoStack = []; // Clear redo stack on new action
        this.updateUI();
    }

    undo() {
        if (this.undoStack.length === 0) return;
        // تنظيف حالات الواجهة قبل التراجع لمنع تجمّد التطبيق
        // (مثلاً مرجع قديم لعنصر تم حذفه ثم استعادته)
        resetInteractionState();
        const action = this.undoStack.pop();
        this.redoStack.push(action);
        this.isRestoring = true;
        try { this.apply(action, true); }
        catch (err) { console.error('Undo apply error:', err); }
        this.isRestoring = false;
        this.updateUI();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        // نفس التنظيف قبل الإعادة
        resetInteractionState();
        const action = this.redoStack.pop();
        this.undoStack.push(action);
        this.isRestoring = true;
        try { this.apply(action, false); }
        catch (err) { console.error('Redo apply error:', err); }
        this.isRestoring = false;
        this.updateUI();
    }

    apply(action, isUndo) {
        switch (action.type) {
            case 'ADD_COMP':
                if (isUndo) {
                    deleteComponent(action.data.comp.id, true);
                } else {
                    restoreComponent(action.data.comp);
                }
                break;
            case 'DEL_COMP':
                if (isUndo) {
                    restoreComponent(action.data.comp);
                    action.data.wires.forEach(w => restoreWire(w));
                } else {
                    deleteComponent(action.data.comp.id, true);
                }
                break;
            case 'ADD_WIRE':
                if (isUndo) {
                    deleteWire(action.data.wire.id, true);
                } else {
                    restoreWire(action.data.wire);
                }
                break;
            case 'DEL_WIRE':
                if (isUndo) {
                    restoreWire(action.data.wire);
                } else {
                    deleteWire(action.data.wire.id, true);
                }
                break;
            case 'MOVE_COMP':
                const comp = components.get(action.data.id);
                if (comp) {
                    comp.x = isUndo ? action.data.oldX : action.data.newX;
                    comp.y = isUndo ? action.data.oldY : action.data.newY;
                    const el = document.getElementById(comp.id);
                    if (el) {
                        el.style.left = comp.x + 'px';
                        el.style.top = comp.y + 'px';
                    }
                    updateAllWires();
                }
                break;
            case 'ROTATE_COMP':
                const cRot = components.get(action.data.id);
                if (cRot) {
                    cRot.rotation = isUndo ? action.data.oldRot : action.data.newRot;
                    renderComponent(cRot);
                    updateComponentVisuals(cRot);
                    updateAllWires();
                    if (selectedCompId === cRot.id) showComponentInfo(cRot);
                }
                break;
            case 'PROP_CHANGE':
                const cProp = components.get(action.data.id);
                if (cProp) {
                    cProp[action.data.key] = isUndo ? action.data.oldVal : action.data.newVal;
                    renderComponent(cProp);
                    updateComponentVisuals(cProp);
                    simulate();
                    if (selectedCompId === cProp.id) showComponentInfo(cProp);
                }
                break;
        }
        // أي تغيير يحرّك المكونات أو يضيف/يحذف أسلاكاً قد يحتاج إعادة توزيع الـ lanes
        recomputeWireLanes();
        updateAllWires();
        simulate();
    }

    updateUI() {
        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');
        if (btnUndo) btnUndo.disabled = this.undoStack.length === 0;
        if (btnRedo) btnRedo.disabled = this.redoStack.length === 0;
        if (btnUndo) btnUndo.style.opacity = this.undoStack.length === 0 ? 0.5 : 1;
        if (btnRedo) btnRedo.style.opacity = this.redoStack.length === 0 ? 0.5 : 1;
    }
}

const history = new HistoryManager();

// ==========================================
// INTERACTION STATE RESET — يُنادى قبل undo/redo
// ==========================================
// يضمن أن أي حالة معلّقة (سحب، رسم سلك، وضع مكوّن) تنتهي قبل التراجع،
// حتى لا تبقى مراجع للعناصر المحذوفة وتسبّب تجمّد الواجهة.
function resetInteractionState() {
    try {
        // إلغاء رسم سلك إذا كان جارياً
        if (typeof wireStartComp !== 'undefined' && wireStartComp) {
            wireStartComp = null;
            if (typeof wireStartPin !== 'undefined') wireStartPin = null;
            if (typeof wireDrawLine !== 'undefined' && wireDrawLine) {
                wireDrawLine.remove();
                wireDrawLine = null;
            }
        }
        // إلغاء سحب مكوّن
        if (typeof isDragging !== 'undefined') isDragging = false;
        if (typeof dragComp !== 'undefined') dragComp = null;
        // إلغاء وضع مكوّن
        if (typeof placingType !== 'undefined' && placingType) {
            placingType = null;
            if (typeof ghostPreview !== 'undefined' && ghostPreview) {
                ghostPreview.remove();
                ghostPreview = null;
            }
        }
        // إلغاء تحديد مربّع
        if (typeof isSelecting !== 'undefined') isSelecting = false;
        if (typeof selectionRect !== 'undefined' && selectionRect) {
            selectionRect.remove();
            selectionRect = null;
        }
    } catch (e) {
        console.warn('resetInteractionState issue:', e);
    }
}

// ==========================================
// RESTORE HELPERS
// ==========================================
function restoreComponent(compData) {
    // Clone data to avoid reference issues
    const comp = JSON.parse(JSON.stringify(compData));
    components.set(comp.id, comp);
    renderComponent(comp);

    // Restore states that might affect visuals
    if (comp.type === 'LED' && comp.state) {
        // visual update will handle it
    }
    updateComponentVisuals(comp);
    return comp;
}

function restoreWire(wireData) {
    const wire = JSON.parse(JSON.stringify(wireData));
    wires.set(wire.id, wire);
    renderWire(wire);
    return wire;
}

// — escape HTML للنصوص التي تحوي < أو > (مثل أسماء الأطراف A<B, A>B) —
// بدونها، '<B' يُفسَّر كبداية tag والاسم يختفي من الواجهة
function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ==========================================
// WORKSPACE BOUNDS — منطقة البناء المسموح بها
// ==========================================
// الـ workspace كاملاً ٦٠٠٠×٤٠٠٠ بكسل (منطقة كبيرة قابلة للتنقل)
// لكن منطقة البناء الفعلية محدودة داخل هذا الإطار:
const BUILD_AREA = {
    x: 100,           // بداية المنطقة على المحور X
    y: 50,            // بداية المنطقة على المحور Y
    width: 2400,      // عرض منطقة البناء
    height: 1500,     // ارتفاع منطقة البناء
    padding: 30       // هامش داخلي للمكونات
};
// الحد الأدنى لإحداثيات المكون داخل منطقة البناء:
BUILD_AREA.minX = BUILD_AREA.x + BUILD_AREA.padding;
BUILD_AREA.minY = BUILD_AREA.y + BUILD_AREA.padding;
BUILD_AREA.maxX = BUILD_AREA.x + BUILD_AREA.width - BUILD_AREA.padding;
BUILD_AREA.maxY = BUILD_AREA.y + BUILD_AREA.height - BUILD_AREA.padding;

// تحقق ما إذا كانت النقطة (x,y) داخل منطقة البناء
function isInBuildArea(x, y) {
    return x >= BUILD_AREA.minX && x <= BUILD_AREA.maxX &&
        y >= BUILD_AREA.minY && y <= BUILD_AREA.maxY;
}

// إظهار رسالة تحذير قصيرة للمستخدم
function showToast(message, type = 'warning') {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast-' + type + ' show';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

// ==========================================
// GLOBALS
// ==========================================
let compIdCounter = 0;
let wireIdCounter = 0;
const components = new Map();
const wires = new Map();

// تحليل قوّة الإشارة لكل شبكة (يُحدَّث في نهاية simulate)
// كل عنصر: { net, drivers, value, strength, conflict }
//   strength: 'strong' | 'weak' | 'floating' | 'conflict'
let netAnalysis = [];

// مؤقّت تذبذب الـ 555 (يعمل فقط عند وجود 555 في وضع astable)
let astableTimerHandle = null;
let astableLastTime = 0;

function startAstableTimer() {
    if (astableTimerHandle) return;
    astableLastTime = performance.now();
    astableTimerHandle = setInterval(astableTick, 50);   // 20 Hz refresh
}

function stopAstableTimer() {
    if (astableTimerHandle) {
        clearInterval(astableTimerHandle);
        astableTimerHandle = null;
    }
}

function astableTick() {
    const now = performance.now();
    const dt = (now - astableLastTime) / 1000;   // ثوانٍ
    astableLastTime = now;

    let anyChanged = false;
    for (const [, comp] of components) {
        if (comp.type !== 'IC555' || !comp._astableConfig) continue;
        if (!comp.timerState) comp.timerState = { output: 0, discharge: 0 };

        // نتقدّم بالزمن المتراكم وفقاً لـ T_high أو T_low بحسب الحالة
        comp._astableTimeAcc = (comp._astableTimeAcc || 0) + dt;
        const tH = comp._astablePeriodHigh;
        const tL = comp._astablePeriodLow;

        // إذا كان الـ output حالياً HIGH، الانتظار T_high ثم القلب إلى LOW
        // إذا كان LOW، الانتظار T_low ثم القلب إلى HIGH
        let didFlip = false;
        let safety = 0;
        while (safety++ < 100) {
            const target = comp.timerState.output ? tH : tL;
            if (comp._astableTimeAcc < target) break;
            comp._astableTimeAcc -= target;
            comp.timerState.output = comp.timerState.output ? 0 : 1;
            comp.timerState.discharge = comp.timerState.output;   // pin 7 يطابق pin 3
            didFlip = true;
        }

        if (didFlip) {
            anyChanged = true;
            // نسخ القيم إلى pinStates مباشرة (لأن evaluate() لن يعيد الحساب إلا عند simulate)
            comp.pinStates[3] = comp.timerState.output;
            comp.pinStates[7] = comp.timerState.discharge;
        }
    }

    if (anyChanged) simulate();
}

// ==========================================
// NOISE TIMER — محاكاة الضوضاء على الـ floating inputs
// ==========================================
// عندما يكون هناك input على IC في حالة floating (غير متصل بـ pull-up/down)،
// نُعيد تشغيل simulate() عدة مرات في الثانية لتوليد قيم عشوائية متجدّدة.
// هذا يُظهر للطالب السلوك غير الموثوق للدوائر الحقيقية:
//   • العدّاد يقفز عشوائياً
//   • الـ LEDs ترمش
//   • مخارج البوابات تتذبذب
let noiseTimerHandle = null;

function startNoiseTimer() {
    if (noiseTimerHandle) return;
    noiseTimerHandle = setInterval(noiseTick, 100);   // 10 Hz — ضوضاء مرئية للعين
}

function stopNoiseTimer() {
    if (noiseTimerHandle) {
        clearInterval(noiseTimerHandle);
        noiseTimerHandle = null;
    }
}

function hasFloatingICInput() {
    // الساعة الدورية تعمل عند وجود أي IC بمدخل floating
    // (لتجديد القيم العشوائية بصرياً كل 100ms)
    for (const [, comp] of components) {
        if (!isICType(comp.type)) continue;
        const def = IC_DEFINITIONS[comp.type];
        if (!def) continue;
        const s = comp.pinStrengths || {};
        for (const pinDef of def.pins) {
            if (pinDef.type !== 'input') continue;
            if (s[pinDef.num] === 'floating') return true;
        }
    }
    return false;
}

function noiseTick() {
    if (!hasFloatingICInput()) {
        stopNoiseTimer();
        return;
    }
    simulate();   // إعادة الحساب — القيم العشوائية ستتجدّد في تحليل الـ nets
}
let currentTool = 'select';
let placingType = null;
let selectedCompId = null;
let selectedCompIds = new Set();
let isSelecting = false;
let selectionStartX = 0, selectionStartY = 0;
let selectionRect = null;
let toolFloatLabel = null;

// ألوان الأسلاك — داكنة مُشبعة لتظهر بوضوح على الخلفية الكريمية
// (الألوان الفاتحة كالـ pastels تختفي على الخلفية الفاتحة)
const WIRE_COLORS = [
    '#dc2626',  // red-600
    '#1d4ed8',  // blue-700
    '#15803d',  // green-700
    '#b45309',  // amber-700
    '#7e22ce',  // purple-700
    '#0d9488',  // teal-600
    '#c2410c',  // orange-700
    '#0891b2',  // cyan-600
    '#be185d',  // pink-700
    '#a16207',  // yellow-700
    '#9d174d',  // pink-800
    '#4338ca',  // indigo-700
    '#166534',  // green-800
    '#9a3412',  // orange-800
    '#1e40af',  // blue-800
];

const LED_COLORS = [
    { name: 'Red', value: 'red', hex: '#ff4457' },
    { name: 'Green', value: 'green', hex: '#2ecc71' },
    { name: 'Blue', value: 'blue', hex: '#3498db' },
    { name: 'Yellow', value: 'yellow', hex: '#f1c40f' },
    { name: 'Orange', value: 'orange', hex: '#e67e22' },
    { name: 'Purple', value: 'purple', hex: '#9b59b6' },
    { name: 'Cyan', value: 'cyan', hex: '#1abc9c' }
];

let wireColorIdx = 0;
let wireStartComp = null;
let wireStartPin = null;
let wireDrawLine = null;
let wireWaypoints = [];

let wsZoom = 1;
let wsPanX = 0;
let wsPanY = 0;
let isPanning = false;
let panStartX = 0, panStartY = 0;
let panStartPanX = 0, panStartPanY = 0;

let isDragging = false;
let dragComp = null;
let dragOffsetX = 0, dragOffsetY = 0;

const workspace = document.getElementById('workspace');
const wsContainer = document.getElementById('workspace-container');
const componentsLayer = document.getElementById('components-layer');
const wireLayer = document.getElementById('wire-layer');
const infoContent = document.getElementById('info-content');
const infoPlaceholder = document.getElementById('info-placeholder');
const infoDetails = document.getElementById('info-details');
const statusTool = document.getElementById('status-tool');
const statusHint = document.getElementById('status-hint');
const statusCoords = document.getElementById('status-coords');
const zoomLevelText = document.getElementById('zoom-level');

// — عند المرور بمؤشر الفأرة فوق سلك، يخبت لون باقي الأسلاك ليسهل تتبع المسار —
// نستخدم event delegation لأن الأسلاك تُنشأ ديناميكياً
wireLayer.addEventListener('mouseover', (e) => {
    if (e.target.classList && e.target.classList.contains('wire')) {
        wireLayer.classList.add('has-hover');
    }
});
wireLayer.addEventListener('mouseout', (e) => {
    if (e.target.classList && e.target.classList.contains('wire')) {
        // تأخير صغير لتجنب الوميض عند الانتقال بين أسلاك متجاورة
        if (!wireLayer.querySelector('.wire:hover')) {
            wireLayer.classList.remove('has-hover');
        }
    }
});

// ==========================================
// UTILITY
// ==========================================
function snap(val, grid = 10) {
    return Math.round(val / grid) * grid;
}

function newCompId() {
    return 'comp-' + (++compIdCounter);
}

function newWireId() {
    return 'wire-' + (++wireIdCounter);
}

function getWorkspaceCoords(clientX, clientY) {
    const rect = wsContainer.getBoundingClientRect();
    const x = (clientX - rect.left - wsPanX) / wsZoom;
    const y = (clientY - rect.top - wsPanY) / wsZoom;
    return { x, y };
}

function getPinWorldPos(compId, pinNum) {
    const el = document.querySelector(`.pin-dot[data-comp="${compId}"][data-pin="${pinNum}"]`);
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;
    return getWorkspaceCoords(clientX, clientY);
}

function rotateDir(dir, rotation) {
    if (!rotation) return dir;
    let { dx, dy } = dir;
    const steps = Math.round(((rotation % 360) + 360) % 360 / 90);
    for (let i = 0; i < steps; i++) {
        const tmp = dx;
        dx = -dy;
        dy = tmp;
    }
    return { dx, dy };
}

function getPinDirection(compId, pinNum) {
    const comp = components.get(compId);
    if (!comp) return { dx: 0, dy: 0 };
    let dir;

    if (isICType(comp.type)) {
        const def = IC_DEFINITIONS[comp.type];
        const pin = def.pins.find(p => p.num === pinNum);
        if (!pin) return { dx: 0, dy: 0 };
        dir = pin.side === 'left' ? { dx: -1, dy: 0 } : { dx: 1, dy: 0 };
    } else if (isSevenSegType(comp.type)) {
        const pin = SEVEN_SEG_PINS.find(p => p.num === pinNum);
        if (!pin) return { dx: -1, dy: 0 };
        dir = pin.side === 'left' ? { dx: -1, dy: 0 } : { dx: 1, dy: 0 };
    } else if (comp.type === 'DIP_SWITCH') {
        dir = pinNum <= 4 ? { dx: -1, dy: 0 } : { dx: 1, dy: 0 };
    } else if (comp.type === 'SWITCH') {
        dir = { dx: 0, dy: -1 };       // مفتاح منطقي: قطب واحد للأعلى
    } else if (comp.type === 'PUSH_BUTTON') {
        dir = { dx: 0, dy: -1 };       // زر منطقي: قطب واحد للأعلى
    } else if (comp.type === 'SWITCH_PHYSICAL' || comp.type === 'PUSH_BUTTON_PHYSICAL') {
        dir = pinNum === 1 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };   // فيزيائي: قطبان
    } else if (comp.type === 'LED') {
        dir = { dx: 0, dy: 1 };
    } else if (comp.type === 'VCC') {
        dir = { dx: 0, dy: 1 };
    } else if (comp.type === 'GND') {
        dir = { dx: 0, dy: 1 };
    } else if (comp.type === 'RESISTOR') {
        dir = pinNum === 1 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };
    } else if (comp.type === 'CAPACITOR') {
        dir = pinNum === 1 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };
    } else {
        dir = { dx: 0, dy: 0 };
    }

    return rotateDir(dir, comp.rotation);
}

function getWireExtension(compId, pinNum) {
    const comp = components.get(compId);
    if (!comp) return 30;

    if (isICType(comp.type)) {
        const def = IC_DEFINITIONS[comp.type];
        const pin = def.pins.find(p => p.num === pinNum);
        if (!pin) return 30;
        const sameSidePins = def.pins.filter(p => p.side === pin.side);
        const idx = sameSidePins.findIndex(p => p.num === pinNum);
        return 20 + idx * 6;
    }

    if (isSevenSegType(comp.type)) {
        const pin = SEVEN_SEG_PINS.find(p => p.num === pinNum);
        if (!pin) return 30;
        const sameSidePins = SEVEN_SEG_PINS.filter(p => p.side === pin.side);
        const idx = sameSidePins.findIndex(p => p.num === pinNum);
        return 20 + idx * 6;
    }

    if (comp.type === 'DIP_SWITCH') return 12;
    if (comp.type === 'SWITCH' || comp.type === 'PUSH_BUTTON' ||
        comp.type === 'SWITCH_PHYSICAL' || comp.type === 'PUSH_BUTTON_PHYSICAL') return 12;
    return 12;
}

function getComponentBounds(excludeCompIds) {
    const bounds = [];
    const MARGIN = 12;
    for (const [id, comp] of components) {
        if (excludeCompIds.includes(id)) continue;
        const el = document.getElementById(id);
        if (!el) continue;
        bounds.push({
            x1: comp.x - MARGIN,
            y1: comp.y - MARGIN,
            x2: comp.x + el.offsetWidth + MARGIN,
            y2: comp.y + el.offsetHeight + MARGIN
        });
    }
    return bounds;
}

// ==========================================
// COMPONENT CREATION
// ==========================================
function createComponent(type, x, y) {
    const id = newCompId();
    // تثبيت الإحداثيات داخل منطقة البناء حتى لا "تختفي" المكونات في المنطقة العمياء
    const sx = snap(x);
    const sy = snap(y);
    const clampedX = Math.max(BUILD_AREA.minX, Math.min(BUILD_AREA.maxX - 80, sx));
    const clampedY = Math.max(BUILD_AREA.minY, Math.min(BUILD_AREA.maxY - 60, sy));
    if (clampedX !== sx || clampedY !== sy) {
        showToast(t('toast.placedClamped'), 'warning');
    }
    const comp = {
        id,
        type,
        x: clampedX,
        y: clampedY,
        pinStates: {},
        pinStrengths: {},   // 'strong' | 'weak' | 'floating' لكل قطب
        outputStates: {},
        state: 0,
        rotation: 0,
    };

    if (isICType(type)) {
        const def = IC_DEFINITIONS[type];
        def.pins.forEach(p => { comp.pinStates[p.num] = 0; });
        if (type === 'IC74193') {
            comp.counterValue = 0;
            comp._prevClk = { up: 0, dn: 0 };
            comp._edgeProcessed = false;
        }
        if (type === 'IC555') {
            comp.timerState = { output: 0, discharge: 0, lastTrigger: 0, lastThreshold: 0 };
        }
    } else if (isSevenSegType(type)) {
        comp.pinStates = {};
        SEVEN_SEG_PINS.forEach(p => { comp.pinStates[p.num] = 0; });
        comp.color = 'red';
    } else if (type === 'SWITCH') {
        // مفتاح منطقي ثنائي مستقرّ — قطب واحد، يولّد HIGH/LOW
        comp.state = 0;
        comp.pinStates = { 1: 0 };
    } else if (type === 'PUSH_BUTTON') {
        // زر منطقي لحظي — قطب واحد، يولّد HIGH عند الضغط
        comp.state = 0;
        comp.pinStates = { 1: 0 };
    } else if (type === 'SWITCH_PHYSICAL') {
        // مفتاح فيزيائي ثنائي مستقرّ — قطبان، يصلهما عند الإغلاق
        comp.state = 0;
        comp.pinStates = { 1: 0, 2: 0 };
    } else if (type === 'PUSH_BUTTON_PHYSICAL') {
        // زر فيزيائي لحظي — قطبان، يصلهما أثناء الضغط
        comp.state = 0;
        comp.pinStates = { 1: 0, 2: 0 };
    } else if (type === 'DIP_SWITCH') {
        comp.state = [0, 0, 0, 0];
        comp.pinStates = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
    } else if (type === 'LED') {
        comp.state = 0;
        comp.burned = false;
        comp.color = 'red';
        comp.pinStates = { 1: 0 };
    } else if (type === 'RESISTOR') {
        comp.resistance = 330;
        comp.pinStates = { 1: 0, 2: 0 };
    } else if (type === 'CAPACITOR') {
        comp.capacitance = '100nF';
        comp.pinStates = { 1: 0, 2: 0 };
    } else if (type === 'VCC') {
        comp.voltage = 0;          // الافتراضي: مطفأ — المستخدم يجب أن يحدّد الفولتية
        comp.pinStates = { 1: 0 };
    } else if (type === 'GND') {
        comp.pinStates = { 1: 0 };
    }

    components.set(id, comp);
    renderComponent(comp);
    simulate();

    history.push({
        type: 'ADD_COMP',
        data: { comp: JSON.parse(JSON.stringify(comp)) }
    });

    return comp;
}

/** ينشئ VCC ويضبطه على فولتية محدّدة (للأمثلة المضمّنة). */
function createPoweredVCC(x, y, voltage = 5) {
    const v = createComponent('VCC', x, y);
    v.voltage = voltage;
    v.pinStates[1] = voltage > 0 ? 1 : 0;
    renderComponent(v);
    return v;
}

// ==========================================
// COMPONENT RENDERING
// ==========================================
function renderComponent(comp) {
    const oldEl = document.getElementById(comp.id);
    if (oldEl) oldEl.remove();

    const el = document.createElement('div');
    el.className = 'component';
    el.id = comp.id;
    el.dataset.type = comp.type;
    el.style.left = comp.x + 'px';
    el.style.top = comp.y + 'px';

    if (comp.rotation) {
        el.style.transform = `rotate(${comp.rotation}deg)`;
        el.style.transformOrigin = 'center center';
    }

    if (isICType(comp.type)) {
        renderIC(el, comp);
    } else if (isSevenSegType(comp.type)) {
        renderSevenSeg(el, comp);
    } else if (comp.type === 'SWITCH') {
        renderSwitch(el, comp);
    } else if (comp.type === 'PUSH_BUTTON') {
        renderPushButton(el, comp);
    } else if (comp.type === 'SWITCH_PHYSICAL') {
        renderSwitchPhysical(el, comp);
    } else if (comp.type === 'PUSH_BUTTON_PHYSICAL') {
        renderPushButtonPhysical(el, comp);
    } else if (comp.type === 'DIP_SWITCH') {
        renderDIPSwitch(el, comp);
    } else if (comp.type === 'LED') {
        renderLED(el, comp);
    } else if (comp.type === 'RESISTOR') {
        renderResistor(el, comp);
    } else if (comp.type === 'CAPACITOR') {
        renderCapacitor(el, comp);
    } else if (comp.type === 'VCC') {
        renderVCC(el, comp);
    } else if (comp.type === 'GND') {
        renderGND(el, comp);
    }

    componentsLayer.appendChild(el);
}

function renderIC(el, comp) {
    const def = IC_DEFINITIONS[comp.type];
    const leftPins = def.pins.filter(p => p.side === 'left');
    const rightPins = def.pins.filter(p => p.side === 'right').reverse();

    // helper: وضع الاسم مع overline لو كان طرف active LOW
    const pinNameHTML = (p) => p.activeLow
        ? `<span class="pin-name pin-active-low">${escapeHTML(p.name)}</span>`
        : `<span class="pin-name">${escapeHTML(p.name)}</span>`;

    el.classList.add('ic-component');
    el.innerHTML = `
        <div class="ic-pins-col ic-pins-left">
            ${leftPins.map(p => `
                <div class="ic-pin" data-comp="${comp.id}" data-pin="${p.num}">
                    <div class="pin-dot" data-comp="${comp.id}" data-pin="${p.num}"></div>
                    <span class="pin-num">${p.num}</span>
                    ${pinNameHTML(p)}
                </div>
            `).join('')}
        </div>
        <div class="ic-body-el">
            <div class="ic-notch"></div>
            <span class="ic-chip-label">${def.name}</span>
            <span class="ic-chip-sublabel">${def.sublabel || ''}</span>
        </div>
        <div class="ic-pins-col ic-pins-right">
            ${rightPins.map(p => `
                <div class="ic-pin" data-comp="${comp.id}" data-pin="${p.num}">
                    ${pinNameHTML(p)}
                    <span class="pin-num">${p.num}</span>
                    <div class="pin-dot" data-comp="${comp.id}" data-pin="${p.num}"></div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderSwitch(el, comp) {
    el.classList.add('switch-component');
    el.innerHTML = `
        <div class="switch-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
        <div class="switch-body ${comp.state ? 'on' : ''}" data-comp="${comp.id}">
            <div class="switch-knob"></div>
        </div>
    `;
}

function renderPushButton(el, comp) {
    // الزر المنطقي: قطب واحد، يولّد إشارة بنفسه
    el.classList.add('push-button-component');
    el.innerHTML = `
        <div class="switch-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
        <div class="push-button-body ${comp.state ? 'pressed' : ''}" data-comp="${comp.id}">
            <div class="push-button-cap"></div>
        </div>
    `;
}

function renderSwitchPhysical(el, comp) {
    // مفتاح فيزيائي: قطبان (علوي وسفلي)
    el.classList.add('switch-component', 'switch-physical');
    el.innerHTML = `
        <div class="switch-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
        <div class="switch-body ${comp.state ? 'on' : ''}" data-comp="${comp.id}">
            <div class="switch-knob"></div>
        </div>
        <div class="switch-pin" data-comp="${comp.id}" data-pin="2">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="2"></div>
        </div>
    `;
}

function renderPushButtonPhysical(el, comp) {
    // زر فيزيائي: قطبان (علوي وسفلي)
    el.classList.add('push-button-component', 'push-button-physical');
    el.innerHTML = `
        <div class="switch-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
        <div class="push-button-body ${comp.state ? 'pressed' : ''}" data-comp="${comp.id}">
            <div class="push-button-cap"></div>
        </div>
        <div class="switch-pin" data-comp="${comp.id}" data-pin="2">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="2"></div>
        </div>
    `;
}

function renderLED(el, comp) {
    el.classList.add('led-component');
    el.innerHTML = `
        <div class="led-body ${comp.color || 'red'} ${comp.state ? 'on' : ''}" data-comp="${comp.id}"></div>
        <span class="led-label">LED</span>
        <div class="led-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
    `;
}

function formatResistance(r) {
    if (r >= 1000000) return (r / 1000000).toFixed(r % 1000000 === 0 ? 0 : 1) + 'MΩ';
    if (r >= 1000) return (r / 1000).toFixed(r % 1000 === 0 ? 0 : 1) + 'kΩ';
    return r + 'Ω';
}

function getResistorBandColor(r) {
    if (r >= 1000000) return 'band-blue';
    if (r >= 100000) return 'band-green';
    if (r >= 10000) return 'band-orange';
    if (r >= 1000) return 'band-red';
    if (r >= 100) return 'band-brown';
    return 'band-black';
}

function renderResistor(el, comp) {
    el.classList.add('resistor-component');
    const r = comp.resistance || 330;
    const bandClass = getResistorBandColor(r);
    el.innerHTML = `
        <div class="resistor-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
        <div class="resistor-body">
            <div class="resistor-bands">
                <div class="resistor-band ${bandClass}"></div>
                <div class="resistor-band ${bandClass}"></div>
                <div class="resistor-band band-brown"></div>
                <div class="resistor-band band-gold"></div>
            </div>
            <span class="resistor-label">${formatResistance(r)}</span>
        </div>
        <div class="resistor-pin" data-comp="${comp.id}" data-pin="2">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="2"></div>
        </div>
    `;
}

function renderCapacitor(el, comp) {
    el.classList.add('capacitor-component');
    el.innerHTML = `
        <div class="capacitor-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
        <div class="capacitor-body">
            <div class="capacitor-symbol">
                <div class="cap-plate"></div>
                <div class="cap-gap"></div>
                <div class="cap-plate"></div>
            </div>
            <span class="capacitor-label">${comp.capacitance || '100nF'}</span>
        </div>
        <div class="capacitor-pin" data-comp="${comp.id}" data-pin="2">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="2"></div>
        </div>
    `;
}

function renderVCC(el, comp) {
    el.classList.add('vcc-component');
    const v = (typeof comp.voltage === 'number') ? comp.voltage : 5;
    const label = (v === 0) ? 'OFF' : `+${v}V`;
    el.classList.toggle('unpowered', v === 0);
    el.innerHTML = `
        <div class="vcc-symbol">${label}</div>
        <div class="power-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
    `;
}

function renderGND(el, comp) {
    el.classList.add('gnd-component');
    el.innerHTML = `
        <div class="gnd-symbol">GND</div>
        <div class="power-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
    `;
}

function renderDIPSwitch(el, comp) {
    el.classList.add('dip-switch-component');
    const states = comp.state;

    el.innerHTML = `
        <div class="dip-switch-row">
            <div class="dip-switch-col-pins">
                ${[1, 2, 3, 4].map(p => `
                    <div class="dip-pin-wrap" data-comp="${comp.id}" data-pin="${p}">
                        <div class="pin-dot left" data-comp="${comp.id}" data-pin="${p}"></div>
                    </div>
                `).join('')}
            </div>
            <div class="dip-switch-body-container" data-comp="${comp.id}">
                ${[0, 1, 2, 3].map((i, idx) => `
                    <div class="dip-bit-row">
                        <span class="dip-num-left">${idx + 1}</span>
                        <div class="dip-bit ${states[i] ? 'on' : ''}" data-comp="${comp.id}" data-bit="${i}">
                            <div class="dip-bit-knob"></div>
                        </div>
                        <span class="dip-num-right">ON</span>
                    </div>
                `).join('')}
            </div>
            <div class="dip-switch-col-pins">
                ${[8, 7, 6, 5].map(p => `
                    <div class="dip-pin-wrap" data-comp="${comp.id}" data-pin="${p}">
                        <div class="pin-dot right" data-comp="${comp.id}" data-pin="${p}"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderSevenSeg(el, comp) {
    el.classList.add('seven-seg-component');
    const leftPins = SEVEN_SEG_PINS.filter(p => p.side === 'left');
    const rightPins = SEVEN_SEG_PINS.filter(p => p.side === 'right').reverse();
    const colorClass = comp.color || 'red';
    const typeLabel = comp.type === 'SEVEN_SEG_CC' ? 'CC' : 'CA';

    el.innerHTML = `
        <div class="ic-pins-col ic-pins-left">
            ${leftPins.map(p => `
                <div class="ic-pin" data-comp="${comp.id}" data-pin="${p.num}">
                    <div class="pin-dot" data-comp="${comp.id}" data-pin="${p.num}"></div>
                    <span class="pin-num">${p.num}</span>
                    <span class="pin-name">${escapeHTML(p.name)}</span>
                </div>
            `).join('')}
        </div>
        <div class="seven-seg-body">
            <div class="ic-notch"></div>
            <div class="seven-seg-display ${colorClass}" data-comp="${comp.id}">
                <svg viewBox="0 0 60 100" width="50" height="84">
                    <polygon class="seg seg-a" data-seg="a" points="12,6 48,6 44,12 16,12"/>
                    <polygon class="seg seg-b" data-seg="b" points="49,8 49,46 45,42 45,14"/>
                    <polygon class="seg seg-c" data-seg="c" points="49,52 49,90 45,86 45,56"/>
                    <polygon class="seg seg-d" data-seg="d" points="12,92 48,92 44,86 16,86"/>
                    <polygon class="seg seg-e" data-seg="e" points="11,52 11,90 15,86 15,56"/>
                    <polygon class="seg seg-f" data-seg="f" points="11,8 11,46 15,42 15,14"/>
                    <polygon class="seg seg-g" data-seg="g" points="13,47 47,47 45,52 15,52 13,49"/>
                    <circle class="seg seg-dp" data-seg="dp" cx="54" cy="92" r="3"/>
                </svg>
            </div>
            <span class="seven-seg-type-label">${typeLabel}</span>
        </div>
        <div class="ic-pins-col ic-pins-right">
            ${rightPins.map(p => `
                <div class="ic-pin" data-comp="${comp.id}" data-pin="${p.num}">
                    <span class="pin-name">${escapeHTML(p.name)}</span>
                    <span class="pin-num">${p.num}</span>
                    <div class="pin-dot" data-comp="${comp.id}" data-pin="${p.num}"></div>
                </div>
            `).join('')}
        </div>
    `;
}

// ==========================================
// COMPONENT UPDATE
// ==========================================
function updateComponentVisuals(comp) {
    const el = document.getElementById(comp.id);
    if (!el) return;

    if (comp.type === 'SWITCH' || comp.type === 'SWITCH_PHYSICAL') {
        const body = el.querySelector('.switch-body');
        if (body) body.classList.toggle('on', !!comp.state);
    } else if (comp.type === 'PUSH_BUTTON' || comp.type === 'PUSH_BUTTON_PHYSICAL') {
        const body = el.querySelector('.push-button-body');
        if (body) body.classList.toggle('pressed', !!comp.state);
    } else if (comp.type === 'DIP_SWITCH') {
        const bits = el.querySelectorAll('.dip-bit');
        bits.forEach(bit => {
            const idx = parseInt(bit.dataset.bit);
            bit.classList.toggle('on', !!comp.state[idx]);
        });
    } else if (comp.type === 'LED') {
        const body = el.querySelector('.led-body');
        if (body) {
            const isBurned = !!comp.burned;
            const isOn = !!comp.state && !isBurned;
            body.classList.toggle('on', isOn);
            body.classList.toggle('burned', isBurned);

            if (isOn) {
                const brightness = comp.brightness !== undefined ? comp.brightness : 1;
                const brightFilter = 0.4 + (1.1 * brightness);
                body.style.filter = `brightness(${brightFilter})`;
                const glowSize = 5 + (25 * brightness);
                body.style.boxShadow = `0 0 ${glowSize}px var(--led-on-glow), 0 0 ${glowSize * 2.5}px var(--led-on-glow)`;
            } else {
                body.style.filter = '';
                body.style.boxShadow = '';
            }
        }
        const label = el.querySelector('.led-label');
        if (label) label.textContent = comp.burned ? '💥 محروق!' : 'LED';
    } else if (isSevenSegType(comp.type)) {
        const isCC = comp.type === 'SEVEN_SEG_CC';
        const comOK = comp._comOK || false;
        const segs = el.querySelectorAll('.seg');
        segs.forEach(seg => {
            const segName = seg.dataset.seg;
            const pinNum = SEG_TO_PIN[segName];
            if (!pinNum) return;
            const pinVal = comp.pinStates[pinNum] || 0;
            let on = false;
            if (comOK) {
                on = isCC ? (pinVal === 1) : (pinVal === 0 && isPinConnected(comp.id, pinNum));
            }
            seg.classList.toggle('on', on);
        });
    }

    if (isICType(comp.type)) {
        const powered = isICPowered(comp);
        el.classList.toggle('unpowered', !powered && !comp.burned);
        el.classList.toggle('ic-burned', !!comp.burned);
    }

    const dots = el.querySelectorAll('.pin-dot');
    dots.forEach(dot => {
        const pinNum = parseInt(dot.dataset.pin);
        const val = comp.pinStates[pinNum] || 0;
        dot.classList.toggle('high', !!val);

        // مؤشّرات بصرية على ICs: floating (برتقالي)، weak-low/high (pull-up/down)
        if (isICType(comp.type) && isICPowered(comp) && !comp.burned) {
            const def = IC_DEFINITIONS[comp.type];
            const pinDef = def.pins.find(p => p.num === pinNum);
            const isInput = pinDef && pinDef.type === 'input';
            const isConnected = isPinConnected(comp.id, pinNum);
            const strength = (comp.pinStrengths && comp.pinStrengths[pinNum]) || 'floating';
            const isFloating = isConnected && strength === 'floating';
            dot.classList.toggle('floating', !!(isInput && isFloating));
            // pull-down (weak-LO) / pull-up (weak-HI) — يُظهر للمستخدم أن المقاومة فاعلة
            // يُطبَّق على كل أنواع الأطراف الموصولة بـ weak strength (مدخل/خرج/طاقة)
            const isWeak = isConnected && strength === 'weak';
            dot.classList.toggle('weak-low',  !!(isWeak && val === 0));
            dot.classList.toggle('weak-high', !!(isWeak && val === 1));
        } else {
            dot.classList.remove('floating');
            dot.classList.remove('weak-low');
            dot.classList.remove('weak-high');
        }
    });
}

// ==========================================
// WIRE CREATION & RENDERING
// ==========================================
function createWire(fromCompId, fromPin, toCompId, toPin, waypoints = []) {
    if (fromCompId === toCompId && fromPin === toPin) return null;

    for (const [, w] of wires) {
        if ((w.from.comp === fromCompId && w.from.pin === fromPin &&
            w.to.comp === toCompId && w.to.pin === toPin) ||
            (w.from.comp === toCompId && w.from.pin === toPin &&
                w.to.comp === fromCompId && w.to.pin === fromPin)) {
            return null;
        }
    }

    const id = newWireId();
    const wire = {
        id,
        from: { comp: fromCompId, pin: fromPin },
        to: { comp: toCompId, pin: toPin },
        waypoints: waypoints,
        active: false,
        color: WIRE_COLORS[wireColorIdx++ % WIRE_COLORS.length],
        laneOffset: 0,                            // إزاحة للـ lane (تُحسب لاحقاً)
    };
    wires.set(id, wire);
    recomputeWireLanes();                         // أعد توزيع الأسلاك على lanes
    renderWire(wire);
    updateAllWires();                             // أعد رسم كل الأسلاك (بعض laneOffsets قد تغيّرت)
    simulate();

    history.push({
        type: 'ADD_WIRE',
        data: { wire: JSON.parse(JSON.stringify(wire)) }
    });

    return wire;
}

function getManualWireSegments(wire, p1, p2) {
    const segments = [];
    const dir1 = getPinDirection(wire.from.comp, wire.from.pin);
    const dir2 = getPinDirection(wire.to.comp, wire.to.pin);
    const EXT = 15;
    const exit1 = { x: p1.x + dir1.dx * EXT, y: p1.y + dir1.dy * EXT };
    const exit2 = { x: p2.x + dir2.dx * EXT, y: p2.y + dir2.dy * EXT };
    const allPoints = [p1, exit1, ...wire.waypoints, exit2, p2];

    for (let i = 0; i < allPoints.length - 1; i++) {
        const from = allPoints[i];
        const to = allPoints[i + 1];
        if (Math.abs(from.x - to.x) > 0.5 && Math.abs(from.y - to.y) > 0.5) {
            segments.push({ x1: from.x, y1: from.y, x2: to.x, y2: from.y, type: 'H' });
            segments.push({ x1: to.x, y1: from.y, x2: to.x, y2: to.y, type: 'V' });
        } else if (Math.abs(from.x - to.x) > 0.5) {
            segments.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, type: 'H' });
        } else if (Math.abs(from.y - to.y) > 0.5) {
            segments.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, type: 'V' });
        }
    }
    return segments;
}

function getWireSegments(wire) {
    if (!wire) return [];
    const p1 = getPinWorldPos(wire.from.comp, wire.from.pin);
    const p2 = getPinWorldPos(wire.to.comp, wire.to.pin);

    if (wire.waypoints && wire.waypoints.length > 0) {
        return getManualWireSegments(wire, p1, p2);
    }

    const dir1 = getPinDirection(wire.from.comp, wire.from.pin);
    const dir2 = getPinDirection(wire.to.comp, wire.to.pin);
    const ext1 = getWireExtension(wire.from.comp, wire.from.pin);
    const ext2 = getWireExtension(wire.to.comp, wire.to.pin);

    let e1x = p1.x + dir1.dx * ext1;
    let e1y = p1.y + dir1.dy * ext1;
    let e2x = p2.x + dir2.dx * ext2;
    let e2y = p2.y + dir2.dy * ext2;

    // === حالة خاصة: نفس المكون، طرفان متقابلان (يسار ↔ يمين) ===
    // الافتراضي يستثني المكون من العوائق فيعبر السلك جسمه.
    // الحل: توجيه السلك حول المكون. اختيار أعلى/أسفل تلقائياً:
    //   - إذا متوسط الـ pins أقرب لقمة المكون → التف من أعلى
    //   - إذا أقرب للقاعدة → التف من أسفل
    if (wire.from.comp === wire.to.comp &&
        dir1.dx !== 0 && dir2.dx !== 0 &&
        Math.sign(dir1.dx) !== Math.sign(dir2.dx)) {
        const comp = components.get(wire.from.comp);
        const compEl = document.getElementById(comp.id);
        const compHeight = (compEl && compEl.offsetHeight) ? compEl.offsetHeight : 200;
        const compMidY = comp.y + compHeight / 2;
        const pinsMidY = (p1.y + p2.y) / 2;
        const offsetByLane = (wire.laneOffset || 0);

        // قرار "أعلى أم أسفل" بناءً على موقع الـ pins
        const goAbove = pinsMidY < compMidY;
        const routeY = goAbove
            ? comp.y - 20 - offsetByLane               // فوق المكون بـ 20px (+ إزاحة lane)
            : comp.y + compHeight + 20 + offsetByLane; // تحت المكون

        return [
            { x1: p1.x, y1: p1.y,    x2: e1x,  y2: p1.y,    type: 'H' },
            { x1: e1x,  y1: p1.y,    x2: e1x,  y2: routeY,  type: 'V' },
            { x1: e1x,  y1: routeY,  x2: e2x,  y2: routeY,  type: 'H' },
            { x1: e2x,  y1: routeY,  x2: e2x,  y2: p2.y,    type: 'V' },
            { x1: e2x,  y1: p2.y,    x2: p2.x, y2: p2.y,    type: 'H' }
        ];
    }

    // طبّق lane offset على الـ extensions في الحالة العامة (لمنع تراكب الأسلاك)
    const laneOffset = wire.laneOffset || 0;
    if (dir1.dx !== 0) e1x += dir1.dx * laneOffset;
    else if (dir1.dy !== 0) e1y += dir1.dy * laneOffset;
    if (dir2.dx !== 0) e2x += dir2.dx * laneOffset;
    else if (dir2.dy !== 0) e2y += dir2.dy * laneOffset;

    const obstacles = getComponentBounds([wire.from.comp, wire.to.comp]);

    for (const box of obstacles) {
        if (dir1.dx !== 0) {
            if (e1x >= box.x1 && e1x <= box.x2) {
                const yMin = Math.min(p1.y, e2y);
                const yMax = Math.max(p1.y, e2y);
                if (!(yMax < box.y1 || yMin > box.y2)) {
                    e1x = dir1.dx < 0 ? Math.min(e1x, box.x1 - 5) : Math.max(e1x, box.x2 + 5);
                }
            }
        } else {
            if (e1y >= box.y1 && e1y <= box.y2) {
                const xMin = Math.min(p1.x, e2x);
                const xMax = Math.max(p1.x, e2x);
                if (!(xMax < box.x1 || xMin > box.x2)) {
                    e1y = dir1.dy < 0 ? Math.min(e1y, box.y1 - 5) : Math.max(e1y, box.y2 + 5);
                }
            }
        }
        if (dir2.dx !== 0) {
            if (e2x >= box.x1 && e2x <= box.x2) {
                const yMin = Math.min(p2.y, e1y);
                const yMax = Math.max(p2.y, e1y);
                if (!(yMax < box.y1 || yMin > box.y2)) {
                    e2x = dir2.dx < 0 ? Math.min(e2x, box.x1 - 5) : Math.max(e2x, box.x2 + 5);
                }
            }
        } else {
            if (e2y >= box.y1 && e2y <= box.y2) {
                const xMin = Math.min(p2.x, e1x);
                const xMax = Math.max(p2.x, e1x);
                if (!(xMax < box.x1 || xMin > box.x2)) {
                    e2y = dir2.dy < 0 ? Math.min(e2y, box.y1 - 5) : Math.max(e2y, box.y2 + 5);
                }
            }
        }
    }

    const segments = [];

    if (dir1.dx !== 0) {
        segments.push({ x1: p1.x, y1: p1.y, x2: e1x, y2: p1.y, type: 'H' });
        segments.push({ x1: e1x, y1: p1.y, x2: e1x, y2: e2y, type: 'V' });
        segments.push({ x1: e1x, y1: e2y, x2: e2x, y2: e2y, type: 'H' });
        segments.push({ x1: e2x, y1: e2y, x2: p2.x, y2: p2.y, type: 'V' });
    } else {
        segments.push({ x1: p1.x, y1: p1.y, x2: p1.x, y2: e1y, type: 'V' });
        segments.push({ x1: p1.x, y1: e1y, x2: e2x, y2: e1y, type: 'H' });
        segments.push({ x1: e2x, y1: e1y, x2: e2x, y2: e2y, type: 'V' });
        segments.push({ x1: e2x, y1: e2y, x2: p2.x, y2: p2.y, type: 'H' });
    }
    return segments;
}

function getAllHorizontalSegments(excludeWireId) {
    const list = [];
    for (const [id, w] of wires) {
        if (id === excludeWireId) continue;
        const segs = getWireSegments(w);
        for (const s of segs) {
            if (s.type === 'H') list.push(s);
        }
    }
    return list;
}

// ==========================================
// LANE ASSIGNMENT — منع تراكب الأسلاك على نفس المسار
// ==========================================
// يحدّد لكل سلك "مسار رئيسي" (trunk) — هي القطعة الأكبر التي تحدّد شكل المسار
// ثم يخصّص laneOffset لإزاحة الأسلاك المتراكبة جنباً إلى جنب.

const LANE_STEP = 8;          // مسافة الفصل بين الـ lanes (بكسل)
const LANE_TOL = 3;           // التسامح في تطابق الإحداثيات
const MAX_LANES = 12;         // حد أقصى لعدد الـ lanes (سلامة)

// استخرج المسار الرئيسي للسلك بدون استدعاء getWireSegments (تجنّباً للـ recursion)
function _computeWireTrunk(w) {
    const p1 = getPinWorldPos(w.from.comp, w.from.pin);
    const p2 = getPinWorldPos(w.to.comp, w.to.pin);
    const dir1 = getPinDirection(w.from.comp, w.from.pin);
    const dir2 = getPinDirection(w.to.comp, w.to.pin);
    const ext1 = getWireExtension(w.from.comp, w.from.pin);

    // — حالة same-IC opposite-sides: trunk = القطعة الأفقية فوق/تحت المكون —
    if (w.from.comp === w.to.comp &&
        dir1.dx !== 0 && dir2.dx !== 0 &&
        Math.sign(dir1.dx) !== Math.sign(dir2.dx)) {
        const comp = components.get(w.from.comp);
        const compEl = document.getElementById(comp.id);
        const compHeight = (compEl && compEl.offsetHeight) ? compEl.offsetHeight : 200;
        const compMidY = comp.y + compHeight / 2;
        const pinsMidY = (p1.y + p2.y) / 2;
        const goAbove = pinsMidY < compMidY;
        const baseRouteY = goAbove ? comp.y - 20 : comp.y + compHeight + 20;
        return {
            type: 'H',
            coord: baseRouteY,
            sign: goAbove ? -1 : 1,                    // اتجاه الإزاحة
            span: [Math.min(p1.x, p2.x), Math.max(p1.x, p2.x)]
        };
    }

    // — حالة عامة: trunk = القطعة العمودية e1x→e2y أو الأفقية e1y→e2x —
    if (dir1.dx !== 0) {
        // pin أفقي → trunk عمودي (V)
        const e1x = p1.x + dir1.dx * ext1;
        return {
            type: 'V',
            coord: e1x,
            sign: dir1.dx,
            span: [Math.min(p1.y, p2.y), Math.max(p1.y, p2.y)]
        };
    } else {
        // pin عمودي → trunk أفقي (H)
        const e1y = p1.y + dir1.dy * ext1;
        return {
            type: 'H',
            coord: e1y,
            sign: dir1.dy,
            span: [Math.min(p1.x, p2.x), Math.max(p1.x, p2.x)]
        };
    }
}

// خصّص laneOffset لكل سلك بحيث لا تتراكب الـ trunks على نفس الإحداثي
function recomputeWireLanes() {
    if (wires.size === 0) return;

    // ترتيب مستقر لضمان نفس النتيجة في كل مرة تُحسب فيها
    const all = Array.from(wires.values()).sort((a, b) => a.id.localeCompare(b.id));

    // امسح القيم القديمة وأعد الحساب من البداية
    for (const w of all) w.laneOffset = 0;

    // احسب trunks مرّة واحدة (بدون laneOffset) — هي المرجع
    const trunks = new Map();
    for (const w of all) trunks.set(w.id, _computeWireTrunk(w));

    // لكل سلك (ابتداء من الثاني)، إذا تداخل trunkه مع سلك سابق على نفس الإحداثي → أزحه
    for (let i = 1; i < all.length; i++) {
        const wi = all[i];
        const ti = trunks.get(wi.id);
        if (!ti) continue;

        for (let lane = 0; lane <= MAX_LANES; lane++) {
            const adjustedCoord = ti.coord + lane * LANE_STEP * ti.sign;
            let conflict = false;

            for (let j = 0; j < i; j++) {
                const wj = all[j];
                const tj = trunks.get(wj.id);
                if (!tj || tj.type !== ti.type) continue;
                const tjAdjusted = tj.coord + (wj.laneOffset || 0) * tj.sign;
                if (Math.abs(adjustedCoord - tjAdjusted) >= LANE_TOL) continue;
                // إحداثي متطابق — افحص التداخل في الـ span
                if (ti.span[1] > tj.span[0] && ti.span[0] < tj.span[1]) {
                    conflict = true;
                    break;
                }
            }

            if (!conflict) {
                wi.laneOffset = lane * LANE_STEP;
                break;
            }
        }
    }
}

// تبسيط مسار: حذف النقاط المتعاقبة على نفس الخط (collinear)،
// والقطع التي تعود لنفسها (z-zigzag بطول صفر).
function simplifySegments(segments) {
    if (segments.length <= 1) return segments;
    // 1) ابنِ قائمة نقاط من القطع
    const points = [{ x: segments[0].x1, y: segments[0].y1 }];
    for (const s of segments) {
        const last = points[points.length - 1];
        if (s.x2 !== last.x || s.y2 !== last.y) {
            points.push({ x: s.x2, y: s.y2 });
        }
    }
    // 2) أزل النقاط الثلاث التي تكون على نفس الخط المستقيم
    const cleaned = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
        const a = cleaned[cleaned.length - 1];
        const b = points[i];
        const c = points[i + 1];
        const collinearH = a.y === b.y && b.y === c.y;
        const collinearV = a.x === b.x && b.x === c.x;
        if (collinearH || collinearV) continue;        // نقطة وسطية لا حاجة لها
        cleaned.push(b);
    }
    cleaned.push(points[points.length - 1]);
    // 3) أعِد بناء القطع
    const out = [];
    for (let i = 0; i < cleaned.length - 1; i++) {
        const a = cleaned[i], b = cleaned[i + 1];
        if (a.x === b.x && a.y === b.y) continue;
        out.push({
            x1: a.x, y1: a.y, x2: b.x, y2: b.y,
            type: a.x === b.x ? 'V' : 'H'
        });
    }
    return out;
}

function renderWire(wire) {
    const p1 = getPinWorldPos(wire.from.comp, wire.from.pin);
    let segments = getWireSegments(wire);
    segments = simplifySegments(segments);            // إزالة الزوائد قبل الرسم
    const otherHoriz = getAllHorizontalSegments(wire.id);

    // الزوايا الآن 90° حادّة (نعومة بصرية تأتي من stroke-linejoin: round في CSS)
    // الأقواس الوحيدة المتبقية هي مؤشرات التقاطع (jumpers) فوق الأسلاك المتعاقدة
    const JUMPER_R = 5;        // نصف قطر قوس العبور
    const JUMPER_PAD = 8;      // هامش حول الـ jumper

    let d = `M ${p1.x} ${p1.y}`;

    for (const seg of segments) {
        if (seg.type === 'V') {
            // — قطعة عمودية: ابحث عن تقاطعات مع أسلاك أفقية لرسم jumper —
            const x = seg.x1;
            const yStart = seg.y1, yEnd = seg.y2;
            const yMin = Math.min(yStart, yEnd), yMax = Math.max(yStart, yEnd);
            const goingDown = yEnd > yStart;

            const hits = [];
            for (const h of otherHoriz) {
                const hxMin = Math.min(h.x1, h.x2);
                const hxMax = Math.max(h.x1, h.x2);
                const hy = h.y1;
                if (hy > yMin + JUMPER_PAD && hy < yMax - JUMPER_PAD) {
                    if (x > hxMin + 1 && x < hxMax - 1) hits.push(hy);
                }
            }
            hits.sort((a, b) => goingDown ? a - b : b - a);

            // ارسم القطعة مع إدراج jumpers في كل تقاطع
            for (const hy of hits) {
                const approachY = goingDown ? hy - JUMPER_R : hy + JUMPER_R;
                const landY = goingDown ? hy + JUMPER_R : hy - JUMPER_R;
                d += ` L ${x} ${approachY}`;
                const sweep = goingDown ? 1 : 0;
                d += ` A ${JUMPER_R} ${JUMPER_R} 0 0 ${sweep} ${x} ${landY}`;
            }
            d += ` L ${x} ${yEnd}`;       // 90° حادّ إلى نهاية القطعة

        } else {
            // — قطعة أفقية: مستقيم بسيط —
            d += ` L ${seg.x2} ${seg.y2}`;
        }
    }

    // — تطبيق المسار على عنصر SVG —
    let pathEl = wireLayer.querySelector(`#${wire.id}`);
    if (!pathEl) {
        pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.id = wire.id;
        pathEl.classList.add('wire');
        pathEl.dataset.wireId = wire.id;
        wireLayer.appendChild(pathEl);
    }

    pathEl.setAttribute('d', d);
    pathEl.style.stroke = wire.active ? wire.color : 'var(--wire-inactive)';
    pathEl.classList.toggle('active', wire.active);
    pathEl.style.fill = 'none';
    pathEl.style.filter = '';     // لا glow على الخلفية الفاتحة
}


function updateAllWires() {
    for (const [, wire] of wires) {
        renderWire(wire);
    }
}

function deleteWire(wireId, isUndoOrRedo = false) {
    const wire = wires.get(wireId);
    if (!wire) return;

    if (!isUndoOrRedo) {
        history.push({
            type: 'DEL_WIRE',
            data: { wire: JSON.parse(JSON.stringify(wire)) }
        });
    }

    const el = wireLayer.querySelector(`#${wireId}`);
    if (el) el.remove();
    wires.delete(wireId);
    recomputeWireLanes();         // قد تكون lanes تخصّصت تجنّباً لهذا السلك
    updateAllWires();
    simulate();
}

// ==========================================
// COMPONENT DELETION
// ==========================================
function deleteComponent(compId, isUndoOrRedo = false) {
    const toDeleteWires = [];
    const dataToSave = [];

    for (const [wid, w] of wires) {
        if (w.from.comp === compId || w.to.comp === compId) {
            toDeleteWires.push(wid);
            dataToSave.push(JSON.parse(JSON.stringify(w)));
        }
    }

    // We only push to history if this is a user action, not an undo/redo op
    if (!isUndoOrRedo) {
        const comp = components.get(compId);
        if (comp) {
            history.push({
                type: 'DEL_COMP',
                data: {
                    comp: JSON.parse(JSON.stringify(comp)),
                    wires: dataToSave
                }
            });
        }
    }

    toDeleteWires.forEach(wid => deleteWire(wid, true)); // true to skip history push for wire deletions

    const comp = components.get(compId);
    const el = document.getElementById(compId);
    if (el) el.remove();
    components.delete(compId);

    if (selectedCompId === compId) {
        selectedCompId = null;
        showInfoPlaceholder();
    }
    if (selectedCompIds.has(compId)) {
        selectedCompIds.delete(compId);
    }
    simulate();
}

// ==========================================
// PHYSICS HELPERS
// ==========================================
function isICPowered(comp) {
    const def = IC_DEFINITIONS[comp.type];
    const vccPin = def.pins.find(p => p.name === 'VCC');
    const gndPin = def.pins.find(p => p.name === 'GND');
    if (!vccPin || !gndPin) return false;

    const vccHigh = comp.pinStates[vccPin.num] === 1;

    let gndConnected = false;
    for (const [, wire] of wires) {
        if ((wire.from.comp === comp.id && wire.from.pin === gndPin.num) ||
            (wire.to.comp === comp.id && wire.to.pin === gndPin.num)) {
            gndConnected = true;
            break;
        }
    }
    return vccHigh && gndConnected;
}

/**
 * يحسب فولتية التغذية الفعلية على pin VCC للـ IC، بفحص الشبكة المتصلة.
 * يُرجع 0 إن لم يكن هناك VCC مُغذٍّ في الشبكة، وأعلى فولتية إن وُجدت عدّة مصادر.
 */
function getICSupplyVoltage(comp, nets) {
    const def = IC_DEFINITIONS[comp.type];
    const vccPin = def.pins.find(p => p.name === 'VCC');
    if (!vccPin) return 0;

    for (const net of nets) {
        const hasIcVcc = net.some(p => p.comp === comp.id && p.pin === vccPin.num);
        if (!hasIcVcc) continue;
        let maxV = 0;
        for (const p of net) {
            const c = components.get(p.comp);
            if (c && c.type === 'VCC') {
                const v = (typeof c.voltage === 'number') ? c.voltage : 5;
                if (v > maxV) maxV = v;
            }
        }
        return maxV;
    }
    return 0;
}

function isLEDProtected(ledComp, nets) {
    for (const net of nets) {
        const hasLED = net.some(p => p.comp === ledComp.id && p.pin === 1);
        if (hasLED) {
            const res = net.find(p => {
                const c = components.get(p.comp);
                return c && c.type === 'RESISTOR';
            });
            if (res) {
                const resComp = components.get(res.comp);
                const r = resComp.resistance || 330;
                return r >= 150;
            }
            return false;
        }
    }
    return false;
}

function isPinGrounded(comp, pinNum, nets) {
    for (const net of nets) {
        const hasPin = net.some(p => p.comp === comp.id && p.pin === pinNum);
        if (hasPin) {
            return net.some(p => {
                const c = components.get(p.comp);
                return c && c.type === 'GND';
            });
        }
    }
    return false;
}

function isPinVCC(comp, pinNum, nets) {
    for (const net of nets) {
        const hasPin = net.some(p => p.comp === comp.id && p.pin === pinNum);
        if (hasPin) {
            return net.some(p => {
                const c = components.get(p.comp);
                return c && c.type === 'VCC';
            });
        }
    }
    return false;
}

function isPinConnected(compId, pinNum) {
    for (const [, wire] of wires) {
        if ((wire.from.comp === compId && wire.from.pin === pinNum) ||
            (wire.to.comp === compId && wire.to.pin === pinNum)) {
            return true;
        }
    }
    return false;
}

/**
 * تحويل قيمة المكثّف من نص (مثل "100nF") إلى رقم بالـ Farads.
 */
function parseCapacitance(str) {
    if (!str) return 100e-9;
    const m = str.match(/^([\d.]+)\s*(pF|nF|µF|uF)?$/i);
    if (!m) return 100e-9;
    const val = parseFloat(m[1]);
    const unit = (m[2] || '').toLowerCase().replace('µ', 'u');
    const mult = { 'pf': 1e-12, 'nf': 1e-9, 'uf': 1e-6 }[unit] || 1e-9;
    return val * mult;
}

/**
 * يكشف ما إذا كان الـ 555 موصولاً في وضع astable الكلاسيكي،
 * ويُرجع قيم R1 و R2 و C إذا نجح الكشف.
 *
 * شروط الكشف:
 *   - TRIG (pin 2) و THRES (pin 6) على نفس الشبكة
 *   - مكثّف موصول بين هذه الشبكة و GND (يستخدم القيمة الافتراضية إن لم يوجد)
 *   - مقاومة بين هذه الشبكة و DISCH (pin 7)  → R2
 *   - مقاومة بين DISCH و VCC                → R1
 */
function detectAstable555(comp, nets) {
    const findNet = (pin) => nets.find(n => n.some(p => p.comp === comp.id && p.pin === pin));

    const netTrigThres = findNet(2);
    if (!netTrigThres) return null;
    if (!netTrigThres.some(p => p.comp === comp.id && p.pin === 6)) return null;

    // قيم افتراضية احتياطية
    let C = 100e-9;
    let R1 = 1000;
    let R2 = 10000;

    // ابحث عن مكثّف على الشبكة TRIG/THRES
    for (const pinRef of netTrigThres) {
        const c = components.get(pinRef.comp);
        if (c && c.type === 'CAPACITOR') {
            C = parseCapacitance(c.capacitance);
            break;
        }
    }

    // ابحث عن مقاومة بين TRIG/THRES و DISCH (R2)
    const netDisch = findNet(7);
    if (netDisch) {
        for (const pinRef of netTrigThres) {
            const c = components.get(pinRef.comp);
            if (c && c.type === 'RESISTOR') {
                const otherPin = pinRef.pin === 1 ? 2 : 1;
                const onDisch = netDisch.some(p => p.comp === pinRef.comp && p.pin === otherPin);
                if (onDisch) { R2 = c.resistance || 10000; break; }
            }
        }
    }

    // ابحث عن مقاومة بين DISCH و VCC (R1)
    const netVcc = findNet(8);
    if (netDisch && netVcc) {
        for (const pinRef of netDisch) {
            const c = components.get(pinRef.comp);
            if (c && c.type === 'RESISTOR') {
                const otherPin = pinRef.pin === 1 ? 2 : 1;
                const onVcc = netVcc.some(p => p.comp === pinRef.comp && p.pin === otherPin);
                if (onVcc) { R1 = c.resistance || 1000; break; }
            }
        }
    }

    return { R1, R2, C };
}

// ==========================================
// SIMULATION ENGINE
// ==========================================
function simulate() {
    const nets = buildNets();

    // ضمان تزامن VCC pinStates مع قيمة voltage الحالية
    for (const [, comp] of components) {
        if (comp.type === 'VCC') {
            const v = (typeof comp.voltage === 'number') ? comp.voltage : 5;
            comp.pinStates[1] = v > 0 ? 1 : 0;
        }
    }

    for (const [, comp] of components) {
        if (isICType(comp.type)) {
            const def = IC_DEFINITIONS[comp.type];
            def.pins.forEach(p => {
                if (p.type === 'input' || p.type === 'output') {
                    comp.pinStates[p.num] = 0;
                }
                if (p.type === 'power') {
                    const inNet = nets.some(net => net.some(np => np.comp === comp.id && np.pin === p.num));
                    if (!inNet) comp.pinStates[p.num] = 0;
                }
            });
            if (comp.type === 'IC74193') comp._edgeProcessed = false;
        } else if (comp.type === 'LED') {
            comp.state = 0;
            comp.pinStates[1] = 0;
        } else if (isSevenSegType(comp.type)) {
            for (let p = 1; p <= 10; p++) comp.pinStates[p] = 0;
        } else if (comp.type === 'RESISTOR' || comp.type === 'CAPACITOR') {
            comp.pinStates[1] = 0;
            comp.pinStates[2] = 0;
        }
    }

    // إعادة تصفير pinStrengths في بداية كل دورة
    for (const [, comp] of components) {
        if (!comp.pinStrengths) comp.pinStrengths = {};
        for (const k in comp.pinStates) {
            comp.pinStrengths[k] = 'floating';
        }
    }

    for (let iter = 0; iter < 20; iter++) {
        let changed = false;

        for (const net of nets) {
            // **التقييم الجديد المعتمد على قوّة الإشارة:**
            //
            // المساهمون "المباشرون" (يُولّدون قوّتهم بأنفسهم):
            //   strong-HI: VCC مباشر (voltage>0)، SWITCH ON، PUSH_BUTTON ON،
            //              مخرج IC نشط HIGH
            //   strong-LO: GND مباشر، مخرج IC نشط LOW
            //
            // المكوّنات "الناقلة" (تنقل قوّة قطبها الآخر، مع تعديل):
            //   المقاومة: strong → weak (تُضعف الإشارة)، weak → weak، floating → floating
            //   المكثّف: مثل المقاومة
            //   المفتاح الفيزيائي / الزر الفيزيائي: ينقل القوّة كما هي (strong→strong)
            //   DIP_SWITCH: مثل المفتاح الفيزيائي
            //
            // ترتيب الأولوية:
            //   strong-1 + strong-0 → conflict (نُعتبره HIGH افتراضياً)
            //   strong وحده → القوّة قويّة، القيمة بحسبه
            //   weak وحده → القوّة ضعيفة، القيمة بحسبه (هذا هو الـ pull-up/down الطبيعي)
            //   لا شيء → floating

            let strongHi = false, strongLo = false;
            let weakHi = false, weakLo = false;

            for (const pin of net) {
                const comp = components.get(pin.comp);
                if (!comp) continue;

                if (comp.type === 'VCC') {
                    const v = (typeof comp.voltage === 'number') ? comp.voltage : 5;
                    if (v > 0) strongHi = true;
                } else if (comp.type === 'GND') {
                    strongLo = true;
                } else if (comp.type === 'SWITCH') {
                    // Logic Toggle: مصدر منطقي نشط في الحالتَين — يدفع HIGH عند ON و LOW عند OFF.
                    // (لا يصبح floating أبداً — لذلك لا يتأثر بنظام الضوضاء)
                    if (comp.state) strongHi = true;
                    else            strongLo = true;
                } else if (comp.type === 'PUSH_BUTTON') {
                    // Logic Push: نفس السلوك — مصدر نشط دائماً
                    if (comp.state) strongHi = true;
                    else            strongLo = true;
                } else if (comp.type === 'SWITCH_PHYSICAL' || comp.type === 'PUSH_BUTTON_PHYSICAL') {
                    // المفتاح الفيزيائي: عند state=1، merge في buildNets يجمع الشبكتَين تلقائياً.
                    // عند state=0، الشبكتان منفصلتان ولا يُسمح بأي نقل.
                    // لا حاجة لمعالجة هنا — السلوك ينبع من بنية الشبكة.
                } else if (comp.type === 'RESISTOR') {
                    // المقاومة تُضعف الإشارة: strong → weak
                    const otherPin = pin.pin === 1 ? 2 : 1;
                    const otherV = comp.pinStates[otherPin] || 0;
                    const otherS = comp.pinStrengths[otherPin] || 'floating';
                    if (otherS === 'strong' || otherS === 'weak') {
                        if (otherV) weakHi = true; else weakLo = true;
                    }
                } else if (comp.type === 'CAPACITOR') {
                    // المكثّف يمرّر مثل المقاومة (نموذج مبسّط)
                    const otherPin = pin.pin === 1 ? 2 : 1;
                    const otherV = comp.pinStates[otherPin] || 0;
                    const otherS = comp.pinStrengths[otherPin] || 'floating';
                    if (otherS === 'strong' || otherS === 'weak') {
                        if (otherV) weakHi = true; else weakLo = true;
                    }
                } else if (comp.type === 'DIP_SWITCH') {
                    // مثل المفتاح الفيزيائي: merge في buildNets يجمع الشبكات للـ bits المفعّلة.
                    // لا حاجة للنقل اليدوي هنا.
                } else if (isICType(comp.type)) {
                    const def = IC_DEFINITIONS[comp.type];
                    const pinDef = def.pins.find(p => p.num === pin.pin);
                    if (pinDef && pinDef.type === 'output') {
                        if (isICPowered(comp) && !comp.burned) {
                            if (comp.pinStates[pin.pin] === 1) strongHi = true;
                            else strongLo = true;
                        }
                    }
                }
            }

            // قرار القيمة + القوّة
            let value, strength;
            if (strongHi && strongLo)      { value = 1; strength = 'strong'; }   // conflict (نُعتبره strong-1)
            else if (strongHi)             { value = 1; strength = 'strong'; }
            else if (strongLo)             { value = 0; strength = 'strong'; }
            else if (weakHi && weakLo)     { value = 1; strength = 'weak'; }     // weak conflict
            else if (weakHi)               { value = 1; strength = 'weak'; }
            else if (weakLo)               { value = 0; strength = 'weak'; }
            else                           {
                // FLOATING — قيمة ثابتة LOW افتراضياً (لا وميض في الأسلاك)،
                // **إلّا** إذا كانت الشبكة متصلة بساعة 74193 (CPU=5 أو CPD=4):
                // عندها نُولّد قيمة عشوائية لتعليم الطالب أهمية pull resistors
                // على الـ edge-triggered clock pins. كل الـ ICs الأخرى تستخدم
                // isDriven داخلياً، فمخارجها ثابتة بكل الأحوال.
                const has193Clock = net.some(p => {
                    const c = components.get(p.comp);
                    return c && c.type === 'IC74193' && (p.pin === 4 || p.pin === 5);
                });
                value = has193Clock ? (Math.random() < 0.5 ? 1 : 0) : 0;
                strength = 'floating';
            }

            for (const pin of net) {
                const comp = components.get(pin.comp);
                if (!comp) continue;
                if (comp.type === 'LED') {
                    if (comp.pinStates[1] !== value) { comp.pinStates[1] = value; changed = true; }
                    comp.pinStrengths[1] = strength;
                    comp.state = value;

                    if (value) {
                        let resistance = Infinity;
                        const hasDirectVCC = net.some(nep => {
                            const c = components.get(nep.comp);
                            return c && c.type === 'VCC';
                        });

                        if (hasDirectVCC) {
                            resistance = 0;
                        } else {
                            net.forEach(nep => {
                                const c = components.get(nep.comp);
                                if (c && c.type === 'RESISTOR') {
                                    const otherPin = nep.pin === 1 ? 2 : 1;
                                    const rVal = c.resistance || 330;
                                    resistance = Math.min(resistance, rVal);
                                } else if (c && isICType(c.type)) {
                                    resistance = Math.min(resistance, 220);
                                }
                            });
                        }

                        if (resistance === Infinity) resistance = 0;
                        const current = 3 / Math.max(1, resistance);

                        if (current > 0.05) {
                            comp.burned = true;
                            comp.state = 0;
                        } else {
                            comp.burned = false;
                            let ratio = current / 0.02;
                            if (ratio < 0) ratio = 0;
                            let b = Math.pow(ratio, 0.5);
                            if (b > 1.2) b = 1.2;
                            if (b < 0.1 && current > 0.0001) b = 0.1;
                            if (current <= 0.0001) b = 0;
                            comp.brightness = b;
                        }
                    } else {
                        comp.brightness = 0;
                        if (comp.burned) {
                            comp.burned = false;
                        }
                    }
                } else if (isSevenSegType(comp.type)) {
                    if (comp.pinStates[pin.pin] !== value) { comp.pinStates[pin.pin] = value; changed = true; }
                    comp.pinStrengths[pin.pin] = strength;
                } else if (comp.type === 'RESISTOR' || comp.type === 'CAPACITOR') {
                    if (comp.pinStates[pin.pin] !== value) { comp.pinStates[pin.pin] = value; changed = true; }
                    comp.pinStrengths[pin.pin] = strength;
                } else if (isICType(comp.type)) {
                    const def = IC_DEFINITIONS[comp.type];
                    const pinDef = def.pins.find(p => p.num === pin.pin);
                    if (pinDef && (pinDef.type === 'input' || pinDef.type === 'power')) {
                        if (comp.pinStates[pin.pin] !== value) {
                            comp.pinStates[pin.pin] = value;
                            changed = true;
                        }
                        comp.pinStrengths[pin.pin] = strength;
                    }
                } else if (comp.type === 'SWITCH_PHYSICAL' || comp.type === 'PUSH_BUTTON_PHYSICAL') {
                    // المفاتيح الفيزيائية: تحفظ القيمة والقوّة لتمريرها للجانب الآخر في iter لاحق
                    if (comp.pinStates[pin.pin] !== value) { comp.pinStates[pin.pin] = value; changed = true; }
                    if (comp.pinStrengths[pin.pin] !== strength) { comp.pinStrengths[pin.pin] = strength; changed = true; }
                } else if (comp.type === 'DIP_SWITCH') {
                    if (comp.pinStates[pin.pin] !== value) { comp.pinStates[pin.pin] = value; changed = true; }
                    if (comp.pinStrengths[pin.pin] !== strength) { comp.pinStrengths[pin.pin] = strength; changed = true; }
                }
            }
        }

        for (const [, comp] of components) {
            if (isICType(comp.type)) {
                const def = IC_DEFINITIONS[comp.type];

                // فحص الفولتية الفعلية ومنطق الاحتراق
                const supplyV = getICSupplyVoltage(comp, nets);
                const absMax = def.absoluteMax || Infinity;
                const vMin = def.voltageMin || 0;

                // الاحتراق ديناميكي — يعكس الفولتية الحالية فقط (للتجربة في الدوائر المعقدة)
                comp.burned = supplyV > absMax;

                // IC محترق أو غير مغذٍّ بشكل صحيح → كل المخارج 0
                const undervolted = supplyV > 0 && supplyV < vMin;
                if (comp.burned || !isICPowered(comp) || undervolted) {
                    def.pins.forEach(p => {
                        if (p.type === 'output' && comp.pinStates[p.num] !== 0) {
                            comp.pinStates[p.num] = 0;
                            changed = true;
                        }
                    });
                    continue;
                }
                const outputs = def.evaluate(comp.pinStates, comp, nets);
                for (const [pin, val] of Object.entries(outputs)) {
                    const pinNum = parseInt(pin);
                    if (comp.pinStates[pinNum] !== val) {
                        comp.pinStates[pinNum] = val;
                        changed = true;
                    }
                }
            }
        }

        if (!changed) break;
    }

    for (const [, comp] of components) {
        if (comp.type === 'IC74193') {
            if (!comp._prevClk) comp._prevClk = { up: 0, dn: 0 };
            comp._prevClk.up = comp.pinStates[5] || 0;
            comp._prevClk.dn = comp.pinStates[4] || 0;
        }
    }

    for (const [, comp] of components) {
        if (isSevenSegType(comp.type)) {
            const isCC = comp.type === 'SEVEN_SEG_CC';
            if (isCC) {
                comp._comOK = isPinGrounded(comp, 3, nets) || isPinGrounded(comp, 8, nets);
            } else {
                comp._comOK = isPinVCC(comp, 3, nets) || isPinVCC(comp, 8, nets);
            }
        }
    }

    for (const [, comp] of components) {
        if (comp.type === 'LED') {
            if (comp.state) {
                comp.burned = !isLEDProtected(comp, nets);
            } else {
                comp.burned = false;
            }
        }
    }

    // تحليل قوّة الإشارة لكل شبكة (للمكوّنات الجديدة وفحوصات الاحتراق)
    netAnalysis = analyzeNets(nets);

    // كشف وضع astable للـ 555 وتحديث المؤقّت
    let anyAstable = false;
    for (const [, comp] of components) {
        if (comp.type === 'IC555') {
            // الـ 555 المحترق أو غير المغذّى لا يتذبذب
            const supplyV = getICSupplyVoltage(comp, nets);
            const def = IC_DEFINITIONS.IC555;
            const powered = isICPowered(comp) && !comp.burned &&
                supplyV >= (def.voltageMin || 0) && supplyV <= (def.absoluteMax || Infinity);

            if (powered) {
                comp._astableConfig = detectAstable555(comp, nets);
                if (comp._astableConfig) {
                    const cfg = comp._astableConfig;
                    comp._astablePeriodHigh = 0.693 * (cfg.R1 + cfg.R2) * cfg.C;
                    comp._astablePeriodLow  = 0.693 * cfg.R2 * cfg.C;
                    if (comp._astableTimeAcc === undefined) comp._astableTimeAcc = 0;
                    anyAstable = true;
                }
            } else {
                comp._astableConfig = null;
            }
        }
    }
    if (anyAstable) startAstableTimer();
    else stopAstableTimer();

    for (const [, wire] of wires) {
        const fromComp = components.get(wire.from.comp);
        const toComp = components.get(wire.to.comp);
        let active = false;

        if (fromComp) {
            if (fromComp.type === 'VCC') active = (typeof fromComp.voltage === 'number' ? fromComp.voltage : 5) > 0;
            else if (fromComp.type === 'SWITCH') active = !!fromComp.state;
            else active = !!(fromComp.pinStates[wire.from.pin]);
        }
        if (toComp && !active) {
            if (toComp.type === 'VCC') active = (typeof toComp.voltage === 'number' ? toComp.voltage : 5) > 0;
            else if (toComp.type === 'SWITCH') active = !!toComp.state;
            else active = !!(toComp.pinStates[wire.to.pin]);
        }

        wire.active = active;
        const pathEl = wireLayer.querySelector(`#${wire.id}`);
        if (pathEl) {
            pathEl.style.stroke = wire.active ? wire.color : 'var(--wire-inactive)';
            pathEl.classList.toggle('active', active);
            pathEl.style.filter = active ? `drop-shadow(0 0 5px ${wire.color})` : '';
        }
    }

    for (const [, comp] of components) {
        updateComponentVisuals(comp);
    }

    if (selectedCompId) {
        const comp = components.get(selectedCompId);
        if (comp && isICType(comp.type)) {
            updatePinStatesDisplay(comp);
        }
    }

    // === تفعيل/تعطيل ساعة الضوضاء حسب وجود floating inputs على ICs ===
    if (hasFloatingICInput()) {
        startNoiseTimer();
    } else {
        stopNoiseTimer();
    }
}

function buildNets() {
    const nets = [];
    const pinToNet = new Map();

    function pinKey(comp, pin) {
        return `${comp}:${pin}`;
    }

    function merge(c1, p1, c2, p2) {
        const k1 = pinKey(c1, p1);
        const k2 = pinKey(c2, p2);
        const net1 = pinToNet.get(k1);
        const net2 = pinToNet.get(k2);

        if (net1 !== undefined && net2 !== undefined) {
            if (net1 !== net2) {
                const net2Pins = nets[net2];
                for (const p of net2Pins) {
                    nets[net1].push(p);
                    pinToNet.set(pinKey(p.comp, p.pin), net1);
                }
                nets[net2] = [];
            }
        } else if (net1 !== undefined) {
            nets[net1].push({ comp: c2, pin: p2 });
            pinToNet.set(k2, net1);
        } else if (net2 !== undefined) {
            nets[net2].push({ comp: c1, pin: p1 });
            pinToNet.set(k1, net2);
        } else {
            const idx = nets.length;
            nets.push([
                { comp: c1, pin: p1 },
                { comp: c2, pin: p2 }
            ]);
            pinToNet.set(k1, idx);
            pinToNet.set(k2, idx);
        }
    }

    // المرور 1: دمج الشبكات بناءً على الأسلاك فقط
    for (const [, wire] of wires) {
        merge(wire.from.comp, wire.from.pin, wire.to.comp, wire.to.pin);
    }

    // === فحص: هل يصل من هذا الطرف مصدر قوي (VCC/GND/مخرج IC/مفتاح منطقي)؟ ===
    // الفحص يعبر عبر المقاومات (لدعم pull-up/pull-down) ولا يعبر عبر المفاتيح
    // الفيزيائية (لأنها هي ما نقرّر تفعيله الآن).
    function hasReachableStrongSource(compId, pinNum, visited) {
        const k = pinKey(compId, pinNum);
        if (visited.has(k)) return false;
        visited.add(k);
        const netIdx = pinToNet.get(k);
        if (netIdx === undefined) return false;
        for (const p of nets[netIdx]) {
            const c = components.get(p.comp);
            if (!c) continue;
            if (c.type === 'VCC' || c.type === 'GND') return true;
            if (c.type === 'SWITCH' || c.type === 'PUSH_BUTTON') return true;   // مصدر نشط دائماً
            if (isICType(c.type)) {
                const def = IC_DEFINITIONS[c.type];
                const pinDef = def && def.pins.find(pp => pp.num === p.pin);
                if (pinDef && pinDef.type === 'output') return true;
            }
            if (c.type === 'RESISTOR') {
                // المقاومة تمرّر — اعبر إلى الطرف الآخر (لدعم pull-up و pull-down)
                const otherPin = p.pin === 1 ? 2 : 1;
                if (hasReachableStrongSource(p.comp, otherPin, visited)) return true;
            }
        }
        return false;
    }

    // المرور 2: دمج الشبكات عبر المفاتيح الفيزيائية و DIP — بشرط وجود مصدر طاقة
    // قاعدة جديدة: المفتاح الفيزيائي/الزر لا يعمل إلا إذا كان أحد قطبَيه متصلاً
    // (مباشرة أو عبر مقاومة) بـ VCC، GND، مخرج IC، أو مفتاح منطقي.
    // هذا يدعم نمطَي pull-up و pull-down بشكل طبيعي.
    for (const [id, comp] of components) {
        if (comp.type === 'SWITCH_PHYSICAL' || comp.type === 'PUSH_BUTTON_PHYSICAL') {
            if (comp.state) {
                const hasPower = hasReachableStrongSource(id, 1, new Set()) ||
                                 hasReachableStrongSource(id, 2, new Set());
                if (hasPower) merge(id, 1, id, 2);
                // بدون مصدر طاقة: المفتاح ميت كهربائياً — لا يصل قطبَيه
            }
        } else if (comp.type === 'DIP_SWITCH') {
            const states = comp.state;
            for (let i = 0; i < 4; i++) {
                if (states[i]) {
                    const a = i + 1, b = 8 - i;
                    const hasPower = hasReachableStrongSource(id, a, new Set()) ||
                                     hasReachableStrongSource(id, b, new Set());
                    if (hasPower) merge(id, a, id, b);
                }
            }
        }
    }

    return nets.filter(n => n.length > 0);
}

/**
 * يحلّل قوّة الإشارة في كل شبكة بعد انتهاء حلقة simulate.
 * لا يُغيّر pinStates ولا يؤثّر على المنطق الحالي — فقط يوفّر بيانات
 * للمكوّنات الجديدة (المفاتيح الفيزيائية، pull-up/pull-down، فحوصات الاحتراق).
 *
 * أنواع المساهمات:
 *   strong   = مصدر يقود الشبكة بقوة (VCC، GND، مخارج ICs، المفاتيح المنطقية ON)
 *   weak     = مقاومة pull-up/pull-down (للمراحل اللاحقة)
 *   floating = لا مصدر، الشبكة تطفو
 *   conflict = strong-1 و strong-0 معاً → خطأ كهربائي (للمرحلة 3)
 */
function analyzeNets(nets) {
    return nets.map(net => {
        const drivers = { strongHi: [], strongLo: [], weakHi: [], weakLo: [] };

        for (const pinRef of net) {
            const comp = components.get(pinRef.comp);
            if (!comp) continue;

            if (comp.type === 'VCC') {
                if ((comp.voltage || 0) > 0) {
                    drivers.strongHi.push({ compId: pinRef.comp, pin: pinRef.pin });
                }
            } else if (comp.type === 'GND') {
                drivers.strongLo.push({ compId: pinRef.comp, pin: pinRef.pin });
            } else if (comp.type === 'SWITCH') {
                // المفتاح المنطقي: ON → strong-1، OFF → لا مساهمة (يطفو)
                if (comp.state) {
                    drivers.strongHi.push({ compId: pinRef.comp, pin: pinRef.pin });
                }
            } else if (comp.type === 'PUSH_BUTTON') {
                // الزر المنطقي: pressed → strong-1، released → لا مساهمة
                if (comp.state) {
                    drivers.strongHi.push({ compId: pinRef.comp, pin: pinRef.pin });
                }
            } else if (isICType(comp.type)) {
                const def = IC_DEFINITIONS[comp.type];
                const pinDef = def.pins.find(p => p.num === pinRef.pin);
                if (pinDef && pinDef.type === 'output') {
                    if (comp.pinStates[pinRef.pin] === 1) {
                        drivers.strongHi.push({ compId: pinRef.comp, pin: pinRef.pin });
                    } else {
                        drivers.strongLo.push({ compId: pinRef.comp, pin: pinRef.pin });
                    }
                }
            }
            // ملاحظة: المقاومات والـ PUSH_BUTTON و DIP_SWITCH لا يُساهمون مباشرةً.
            // الـ DIP/PUSH يمرّرون الإشارة عبر merge في buildNets، فمساهمتهم تظهر عبر
            // الأقطاب الأخرى المتّصلة بنفس الشبكة الموسّعة.
        }

        const hasStrongHi = drivers.strongHi.length > 0;
        const hasStrongLo = drivers.strongLo.length > 0;
        const conflict = hasStrongHi && hasStrongLo;

        let value, strength;
        if (conflict) {
            value = 1;          // افتراضياً نُبقيها HIGH للتوافق مع OR-logic الحالية
            strength = 'conflict';
        } else if (hasStrongHi) {
            value = 1; strength = 'strong';
        } else if (hasStrongLo) {
            value = 0; strength = 'strong';
        } else if (drivers.weakHi.length > 0) {
            value = 1; strength = 'weak';
        } else if (drivers.weakLo.length > 0) {
            value = 0; strength = 'weak';
        } else {
            value = 0; strength = 'floating';
        }

        return { net, drivers, value, strength, conflict };
    });
}

// ==========================================
// INFO PANEL
// ==========================================
function showInfoPlaceholder() {
    infoPlaceholder.style.display = '';
    infoDetails.style.display = 'none';
}

function showComponentInfo(comp) {
    infoPlaceholder.style.display = 'none';
    infoDetails.style.display = '';

    if (isICType(comp.type)) {
        showICInfo(comp);
    } else if (comp.type === 'SWITCH') {
        infoDetails.innerHTML = `
            <div class="info-title">مفتاح منطقي</div>
            <div class="info-subtitle">Logic Toggle — ${comp.state ? 'HIGH (1)' : 'LOW (0)'}</div>
            <div class="info-section">
                <div class="info-section-title">الحالة</div>
                <p style="color: ${comp.state ? 'var(--high)' : 'var(--text-muted)'}; font-size:18px; font-weight:700; text-align:center; padding:10px;">
                    ${comp.state ? '⬤ HIGH (1)' : '○ LOW (0)'}
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">الاستخدام</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    مصدر إشارة مباشر — لا يحتاج VCC أو مقاومات. انقر للتبديل بين HIGH و LOW.
                </p>
            </div>
        `;
    } else if (comp.type === 'SWITCH_PHYSICAL') {
        const stateLbl = comp.state ? 'مغلق (Closed)' : 'مفتوح (Open)';
        infoDetails.innerHTML = `
            <div class="info-title">مفتاح فيزيائي</div>
            <div class="info-subtitle">Physical SPST — ${stateLbl}</div>
            <div class="info-section">
                <div class="info-section-title">الحالة</div>
                <p style="color: ${comp.state ? 'var(--high)' : 'var(--text-muted)'}; font-size:16px; font-weight:700; text-align:center; padding:10px;">
                    ${comp.state ? '⊢⊣ Closed' : '⊢ ⊣ Open'}
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">الاستخدام</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    مفتاح حقيقي — يصل قطبَيه عند الإغلاق فقط. لا يولّد إشارة بنفسه.
                    لاستخدامه في دائرة منطقية: VCC → مقاومة → نقطة → مفتاح → GND.
                </p>
            </div>
        `;
    } else if (comp.type === 'PUSH_BUTTON') {
        infoDetails.innerHTML = `
            <div class="info-title">زر منطقي</div>
            <div class="info-subtitle">Logic Push — ${comp.state ? 'PRESSED' : 'RELEASED'}</div>
            <div class="info-section">
                <div class="info-section-title">الحالة</div>
                <p style="color: ${comp.state ? 'var(--high)' : 'var(--text-muted)'}; font-size:16px; font-weight:700; text-align:center; padding:10px;">
                    ${comp.state ? '⬤ HIGH (مضغوط)' : '○ LOW (محرّر)'}
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">الاستخدام</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    مصدر لحظي — يُرسل HIGH أثناء الضغط فقط. لا يحتاج VCC.
                </p>
            </div>
        `;
    } else if (comp.type === 'PUSH_BUTTON_PHYSICAL') {
        const stateLbl = comp.state ? 'مضغوط (Pressed)' : 'محرّر (Released)';
        infoDetails.innerHTML = `
            <div class="info-title">زر فيزيائي</div>
            <div class="info-subtitle">Physical Push — ${stateLbl}</div>
            <div class="info-section">
                <div class="info-section-title">الحالة</div>
                <p style="color: ${comp.state ? 'var(--high)' : 'var(--text-muted)'}; font-size:16px; font-weight:700; text-align:center; padding:10px;">
                    ${comp.state ? '⊢⊣ Closed' : '⊢ ⊣ Open'}
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">الاستخدام</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    زر حقيقي لحظي — يصل قطبَيه أثناء الضغط فقط. يحتاج دائرة pull-up أو pull-down.
                </p>
            </div>
        `;
    } else if (comp.type === 'LED') {
        const nets = buildNets();
        const protectedLED = isLEDProtected(comp, nets);
        let statusHTML = '';

        if (comp.burned) {
            statusHTML = `
                <p style="color: var(--danger); font-size:16px; font-weight:700; text-align:center; padding:10px;">
                    💥 LED محروق!<br><small style="font-size:11px; font-weight:400;">لم يتم توصيل مقاومة حماية</small>
                </p>`;
        } else if (comp.state) {
            statusHTML = `
                <p style="color: var(--led-on); font-size:16px; font-weight:700; text-align:center; padding:10px;">
                    🔴 مضاء (ON) ${protectedLED ? '✅' : ''}
                </p>`;
        } else {
            statusHTML = `
                <p style="color: var(--text-muted); font-size:16px; font-weight:700; text-align:center; padding:10px;">
                    ⚫ مطفأ (OFF)
                </p>`;
        }

        infoDetails.innerHTML = `
            <div class="info-title">مؤشر LED</div>
            <div class="info-subtitle">Light Emitting Diode — Vf = 2V, If = 20mA</div>
            <div class="info-section">
                <div class="info-section-title">الحالة</div>
                ${statusHTML}
            </div>
            <div class="info-section">
                <div class="info-section-title">الحماية</div>
                <p style="font-size:11px; color: ${protectedLED ? 'var(--high)' : 'var(--danger)'}; line-height:1.6; padding:6px; background:rgba(0,0,0,0.2); border-radius:6px;">
                    ${protectedLED
                ? '✅ محمي بمقاومة — التيار محدود والدائرة آمنة'
                : '⚠️ غير محمي! يجب توصيل مقاومة (330Ω) بين الخرج وLED لمنع احتراقه'}
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">ملاحظة تعليمية</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    في الواقع، توصيل LED مباشرة بـ 5V بدون مقاومة يسبب تدفق تيار زائد يحرق LED. المقاومة تحد التيار إلى قيمة آمنة.
                </p>
            </div>
        `;
    } else if (comp.type === 'VCC') {
        infoDetails.innerHTML = `
            <div class="info-title">VCC (+5V)</div>
            <div class="info-subtitle">مصدر تغذية موجبة</div>
            <div class="info-section">
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    يوفر جهد HIGH ثابت (+5V). قم بتوصيله بأطراف VCC للدوائر المتكاملة أو كمدخل HIGH.
                </p>
            </div>
        `;
    } else if (comp.type === 'GND') {
        infoDetails.innerHTML = `
            <div class="info-title">GND (الأرضي)</div>
            <div class="info-subtitle">مرجع الجهد الصفري</div>
            <div class="info-section">
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    يوفر جهد LOW ثابت (0V). قم بتوصيله بأطراف GND للدوائر المتكاملة.
                </p>
            </div>
        `;
    } else if (isSevenSegType(comp.type)) {
        // ملاحظة: نصوص الـ 7-Segment تبقى بالإنجليزية دائماً (لا ترجمة)
        // لأنها مصطلحات قياسية في الإلكترونيات (Common Cathode / Common Anode)
        const isCC = comp.type === 'SEVEN_SEG_CC';
        const typeName = isCC ? 'Common Cathode' : 'Common Anode';
        let segStatesHTML = '';

        SEVEN_SEG_PINS.forEach(p => {
            const val = comp.pinStates[p.num] || 0;
            segStatesHTML += `
                <li class="pin-state-item">
                    <span class="pin-state-name">Pin ${p.num}<span class="exam-hide"> (${escapeHTML(p.name)})</span></span>
                    <span class="pin-state-val ${val ? 'high' : 'low'}">${val}</span>
                </li>
            `;
        });

        const segOrder = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
        const segVals = segOrder.map(s => {
            const pin = SEG_TO_PIN[s];
            const raw = comp.pinStates[pin] || 0;
            return isCC ? raw : (isPinConnected(comp.id, pin) ? (raw === 0 ? 1 : 0) : 0);
        });

        const digitMap = {
            '1111110': '0', '0110000': '1', '1101101': '2', '1111001': '3',
            '0110011': '4', '1011011': '5', '1011111': '6', '1110000': '7',
            '1111111': '8', '1111011': '9', '1110111': 'A', '0011111': 'b',
            '1001110': 'C', '0111101': 'd', '1001111': 'E', '1000111': 'F'
        };
        const digit = (comp._comOK ? digitMap[segVals.join('')] : null) || '—';

        // النصوص هنا ثابتة بالإنجليزية حسب طلب المستخدم
        infoDetails.innerHTML = `
            <div class="info-title">7-Segment Display</div>
            <div class="info-subtitle">${typeName}</div>
            <div class="info-section">
                <div class="info-section-title">Displayed digit</div>
                <p style="font-size:36px; font-weight:700; text-align:center; padding:10px; color:var(--led-on); font-family:var(--font-mono);">
                    ${digit}
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">Pin states</div>
                <ul class="pin-states">${segStatesHTML}</ul>
            </div>
            <div class="info-section exam-hide">
                <div class="info-section-title">Pinout (DIP)</div>
                <div class="pinout-diagram">      ┌──────┐
e   │ 1 10│ g
d   │ 2  9│ f
COM │ 3  8│ COM
c   │ 4  7│ a
dp  │ 5  6│ b
      └──────┘</div>
                <div class="info-section-title">Usage</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    ${isCC
                ? 'Connect COM to GND. Each segment lights when its pin is HIGH. Works with the 74LS48 decoder.'
                : 'Connect COM to VCC. Each segment lights when its pin is LOW. Works with the 7447 decoder.'}
                </p>
            </div>
        `;
    } else if (comp.type === 'RESISTOR') {
        const r = comp.resistance || 330;
        const current_mA = (3 / r * 1000).toFixed(1);
        const power_mW = (3 * 3 / r * 1000).toFixed(1);
        let statusMsg = '';

        if (r < 150) statusMsg = '<span style="color:#e74c3c; font-weight:700;">⚠️ تيار مرتفع جداً — LED سيحترق! (I > 20mA)</span>';
        else if (r > 10000) statusMsg = '<span style="color:#f39c12; font-weight:700;">⚡ تيار منخفض جداً — LED قد لا يضيء</span>';
        else statusMsg = '<span style="color:#2ecc71; font-weight:700;">✅ قيمة مناسبة — LED محمي</span>';

        infoDetails.innerHTML = `
            <div class="info-title">مقاومة ${formatResistance(r)}</div>
            <div class="info-subtitle">Resistor</div>
            <div class="info-section">
                <div class="info-section-title">القيمة</div>
                <p style="font-size:18px; font-weight:700; text-align:center; padding:10px;">${formatResistance(r)}</p>
            </div>
            <div class="info-section">
                <div class="info-section-title">الحسابات (مع LED)</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.8;">
                    ⚡ التيار: I = (5V − 2V) / ${formatResistance(r)} = ${current_mA} mA<br>
                    🔋 القدرة: P = V²/R = ${power_mW} mW
                </p>
                ${statusMsg}
            </div>
            <div class="info-section">
                <div class="info-section-title">ملاحظة</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    كلّك يمين على المقاومة لتغيير القيمة.<br>
                    R ≥ 150Ω = LED محمي | R < 150Ω = LED يحترق | R > 10kΩ = ضعيف
                </p>
            </div>
        `;
    } else if (comp.type === 'CAPACITOR') {
        infoDetails.innerHTML = `
            <div class="info-title">مكثف ${comp.capacitance || '100nF'}</div>
            <div class="info-subtitle">Capacitor</div>
            <div class="info-section">
                <div class="info-section-title">السعة</div>
                <p style="font-size:18px; font-weight:700; text-align:center; padding:10px;">${comp.capacitance || '100nF'}</p>
            </div>
            <div class="info-section">
                <div class="info-section-title">الاستخدام</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    المكثف يخزن الشحنة الكهربائية. يُستخدم في دوائر التوقيت مع الـ 555 Timer.
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">ملاحظة</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    كلّك يمين على المكثف لتغيير القيمة.
                </p>
            </div>
        `;
    }
}

function showICInfo(comp) {
    const def = IC_DEFINITIONS[comp.type];
    let pinStatesHTML = '';

    def.pins.forEach(p => {
        if (p.type === 'power') return;
        const val = comp.pinStates[p.num] || 0;
        // عرض اسم الـ pin مع شرطة فوقية إن كان active-LOW
        const nameDisplay = p.activeLow
            ? `<span class="pin-active-low">${escapeHTML(p.name)}</span>`
            : escapeHTML(p.name);
        pinStatesHTML += `
            <li class="pin-state-item">
                <span class="pin-state-name">Pin ${p.num}<span class="exam-hide"> (${nameDisplay})</span></span>
                <span class="pin-state-val ${val ? 'high' : 'low'}">${val ? 'HIGH' : 'LOW'}</span>
            </li>
        `;
    });

    let truthHTML = '';
    def.truthTable.rows.forEach(row => {
        truthHTML += '<tr>' + row.map(v => `<td>${escapeHTML(v)}</td>`).join('') + '</tr>';
    });

    infoDetails.innerHTML = `
        <div class="info-title">${def.fullName}</div>
        <div class="info-subtitle">${t(def.descKey, def.descAr)}</div>
        <div class="info-section exam-hide">
            <div class="info-section-title">${t('info.section.pinout')}</div>
            <div class="pinout-diagram">${escapeHTML(def.pinout)}</div>
        </div>
        <div class="info-section exam-hide">
            <div class="info-section-title">${t('info.section.truth')}</div>
            <table class="truth-table">
                <thead>
                    <tr>${def.truthTable.headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}</tr>
                </thead>
                <tbody>${truthHTML}</tbody>
            </table>
        </div>
        <div class="info-section">
            <div class="info-section-title">${t('info.section.pinState')}</div>
            <ul class="pin-states" id="pin-states-list">${pinStatesHTML}</ul>
        </div>
    `;

    // Add 555 Timer frequency info
    if (comp.type === 'IC555') {
        const extraInfo = document.createElement('div');
        extraInfo.className = 'info-section exam-hide';
        extraInfo.innerHTML = `
            <div class="info-section-title">${t('info.section.555mode')}</div>
            <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                ${t('info.555.astable')}
            </p>
            <div class="info-section-title" style="margin-top:10px;">${t('info.555.changeFreq')}</div>
            <p style="font-size:10px; color:var(--text-muted); line-height:1.6; white-space:pre-line;">${t('info.555.changeFreqHelp')}</p>
        `;
        infoDetails.appendChild(extraInfo);
    }
}

function updatePinStatesDisplay(comp) {
    const list = document.getElementById('pin-states-list');
    if (!list) return;
    const def = IC_DEFINITIONS[comp.type];
    let html = '';

    def.pins.forEach(p => {
        if (p.type === 'power') return;
        const val = comp.pinStates[p.num] || 0;
        const nameDisplay = p.activeLow
            ? `<span class="pin-active-low">${escapeHTML(p.name)}</span>`
            : escapeHTML(p.name);
        html += `
            <li class="pin-state-item">
                <span class="pin-state-name">Pin ${p.num}<span class="exam-hide"> (${nameDisplay})</span></span>
                <span class="pin-state-val ${val ? 'high' : 'low'}">${val ? 'HIGH' : 'LOW'}</span>
            </li>
        `;
    });
    list.innerHTML = html;
}

// ==========================================
// EVENT HANDLERS
// ==========================================
document.querySelectorAll('.tool-btn').forEach(btn => {
    // تجاهل أزرار Undo/Redo (لها class="tool-btn" بدون data-tool)
    if (!btn.dataset.tool) return;
    btn.addEventListener('click', () => {
        setTool(btn.dataset.tool);
    });
});

function setTool(tool) {
    // حماية: تجاهل الاستدعاءات بقيمة غير صالحة (تجنّب "undefined" في شريط الحالة)
    if (!tool) return;
    currentTool = tool;
    placingType = null;
    cancelWireDrawing();
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    wsContainer.className = '';
    if (tool === 'wire') wsContainer.classList.add('tool-wire');
    else if (tool === 'delete') wsContainer.classList.add('tool-delete');
    else if (tool === 'cut-wire') wsContainer.classList.add('tool-cut-wire');

    // اسم الأداة المترجم: cut-wire → tool.cut ، البقية tool.<name>
    const toolKey = 'tool.' + (tool === 'cut-wire' ? 'cut' : tool);
    const toolName = t(toolKey, tool);

    wsContainer.dataset.toolLabel = '';
    if (tool !== 'select') wsContainer.dataset.toolLabel = toolName;

    statusTool.textContent = `🔧 ${t('status.tool', 'Tool')}: ${toolName}`;
    removeGhostPreview();
    updateHint();
}

function updateHint() {
    if (placingType) {
        statusHint.textContent = t('status.hint.placing');
    } else if (currentTool === 'wire') {
        statusHint.textContent = wireStartComp
            ? t('status.hint.wireDrawing')
            : t('status.hint.wire');
    } else if (currentTool === 'delete') {
        statusHint.textContent = t('status.hint.delete');
    } else if (currentTool === 'cut-wire') {
        statusHint.textContent = t('status.hint.cutWire');
    } else {
        statusHint.textContent = t('status.hint.select');
    }
}

document.querySelectorAll('.comp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        placingType = btn.dataset.type;
        setTool('select');
        placingType = btn.dataset.type;
        wsContainer.className = 'tool-place';
        statusHint.textContent = `انقر على مساحة العمل لوضع ${btn.querySelector('.comp-name').textContent}`;
        createGhostPreview(btn.dataset.type);
    });
});

let ghostPreview = null;

function createGhostPreview(type) {
    removeGhostPreview();
    const tempId = 'ghost-preview';
    const tempComp = { id: tempId, type: type, x: -9999, y: -9999, pinStates: {}, rotation: 0 };

    if (type === 'DIP_SWITCH') tempComp.state = [0, 0, 0, 0];
    else if (type === 'SWITCH' || type === 'SWITCH_PHYSICAL') tempComp.state = 0;
    else if (type === 'PUSH_BUTTON' || type === 'PUSH_BUTTON_PHYSICAL') tempComp.state = 0;
    else if (type === 'LED') { tempComp.state = 0; tempComp.color = 'red'; }
    else if (type === 'VCC') tempComp.voltage = 5;
    else if (type === 'RESISTOR') tempComp.resistance = 330;
    else if (type === 'CAPACITOR') tempComp.capacitance = '100nF';

    ghostPreview = document.createElement('div');
    ghostPreview.className = 'component ghost-preview';
    ghostPreview.dataset.type = type;       // مهم: ليطابق قواعد CSS الخاصة بكل نوع
    ghostPreview.style.position = 'absolute';
    ghostPreview.style.pointerEvents = 'none';
    ghostPreview.style.opacity = '0.45';
    ghostPreview.style.zIndex = '1000';
    ghostPreview.style.filter = 'blur(0.5px)';

    if (isICType(type)) renderIC(ghostPreview, tempComp);
    else if (type === 'SWITCH' || type === 'SWITCH_PHYSICAL') {
        ghostPreview.classList.add('switch-component');
        if (type === 'SWITCH_PHYSICAL') ghostPreview.classList.add('switch-physical');
        ghostPreview.innerHTML = '<div class="switch-body"><div class="switch-track"><div class="switch-knob"></div></div><span class="switch-label">OFF</span></div>';
    } else if (type === 'PUSH_BUTTON' || type === 'PUSH_BUTTON_PHYSICAL') {
        ghostPreview.classList.add('push-button-component');
        if (type === 'PUSH_BUTTON_PHYSICAL') ghostPreview.classList.add('push-button-physical');
        ghostPreview.innerHTML = '<div class="push-button-body"><div class="push-button-cap"></div></div>';
    } else if (type === 'LED') {
        ghostPreview.classList.add('led-component');
        ghostPreview.innerHTML = '<div class="led-body" style="background:rgba(255,0,0,0.3)"><div class="led-glow"></div></div>';
    } else if (type === 'VCC') renderVCC(ghostPreview, tempComp);
    else if (type === 'GND') renderGND(ghostPreview, tempComp);
    else if (type === 'RESISTOR') renderResistor(ghostPreview, tempComp);
    else if (type === 'CAPACITOR') renderCapacitor(ghostPreview, tempComp);
    else if (type === 'DIP_SWITCH') renderDIPSwitch(ghostPreview, tempComp);
    else if (isSevenSegType(type)) renderSevenSeg(ghostPreview, tempComp);

    workspace.appendChild(ghostPreview);
}

function removeGhostPreview() {
    if (ghostPreview) {
        ghostPreview.remove();
        ghostPreview = null;
    }
}

document.querySelectorAll('.sidebar-category-header').forEach(header => {
    header.addEventListener('click', () => {
        header.parentElement.classList.toggle('collapsed');
    });
});

const compSearchInput = document.getElementById('comp-search');
if (compSearchInput) {
    compSearchInput.addEventListener('input', () => {
        const q = compSearchInput.value.trim().toLowerCase();
        document.querySelectorAll('.sidebar-category').forEach(cat => {
            const items = cat.querySelectorAll('.comp-btn');
            let anyVisible = false;
            items.forEach(btn => {
                const name = (btn.querySelector('.comp-name')?.textContent || '').toLowerCase();
                const desc = (btn.querySelector('.comp-desc')?.textContent || '').toLowerCase();
                const type = (btn.dataset.type || '').toLowerCase();
                const match = !q || name.includes(q) || desc.includes(q) || type.includes(q);
                btn.classList.toggle('hidden', !match);
                if (match) anyVisible = true;
            });
            if (q) {
                cat.classList.toggle('collapsed', !anyVisible);
            }
        });
    });
}

wsContainer.addEventListener('mousedown', (e) => {
    if (e.target.closest('#zoom-controls')) return;

    // الزر الأيمن (button=2) لا يجب أن يبدأ سلكاً أو يحرّك أو يبني عنصراً —
    // نتركه للـ contextmenu handler. (middle-click button=1 يبقى للـ pan في الأسفل)
    if (e.button === 2) return;

    if (placingType && e.button === 0) {
        const coords = getWorkspaceCoords(e.clientX, e.clientY);
        createComponent(placingType, coords.x - 40, coords.y - 30);
        createGhostPreview(placingType);
        return;
    }

    const pinEl = e.target.closest('[data-pin]');
    if (pinEl && (currentTool === 'wire' || currentTool === 'select')) {
        if (pinEl.classList.contains('component')) return;
        const ci = pinEl.dataset.comp;
        const pi = parseInt(pinEl.dataset.pin);
        handlePinClick(ci, pi, e);
        return;
    }

    if (wireStartComp && e.button === 0 && (currentTool === 'wire' || currentTool === 'select')) {
        const coords = getWorkspaceCoords(e.clientX, e.clientY);
        // منع رسم الأسلاك خارج منطقة البناء
        if (!isInBuildArea(coords.x, coords.y)) {
            showToast(t('toast.wireOutsideArea'), 'warning');
            return;
        }
        wireWaypoints.push({ x: coords.x, y: coords.y });
        updateHint();
        return;
    }

    if (currentTool === 'delete' || currentTool === 'cut-wire') {
        const wirePath = e.target.closest('.wire');
        if (wirePath) {
            e.stopPropagation();
            deleteWire(wirePath.dataset.wireId);
            return;
        }
        if (currentTool === 'cut-wire') return;
        const comp = e.target.closest('.component');
        if (comp) {
            deleteComponent(comp.id);
            return;
        }
    }

    if (currentTool === 'select') {
        const switchBody = e.target.closest('.switch-body');
        if (switchBody) {
            const comp = components.get(switchBody.dataset.comp);
            if (comp) {
                comp.state = comp.state ? 0 : 1;
                if (comp.type === 'SWITCH') {
                    // المنطقي: يولّد إشارة بنفسه
                    comp.pinStates[1] = comp.state;
                }
                // الفيزيائي: لا يُحدّث pinStates مباشرة — يعتمد على ما يصله من الخارج
                simulate();
                updateComponentVisuals(comp);
                showComponentInfo(comp);
            }
            return;
        }

        const dipBit = e.target.closest('.dip-bit');
        if (dipBit) {
            const comp = components.get(dipBit.dataset.comp);
            const bitIdx = parseInt(dipBit.dataset.bit);
            if (comp && comp.type === 'DIP_SWITCH') {
                comp.state[bitIdx] = comp.state[bitIdx] ? 0 : 1;
                simulate();
                updateComponentVisuals(comp);
                showComponentInfo(comp);
            }
            return;
        }

        const pbBody = e.target.closest('.push-button-body');
        if (pbBody) {
            const comp = components.get(pbBody.dataset.comp);
            if (comp) {
                comp.state = 1;
                if (comp.type === 'PUSH_BUTTON') comp.pinStates[1] = 1;   // الزر المنطقي: مصدر إشارة
                simulate();
                updateComponentVisuals(comp);
                const releaseHandler = () => {
                    comp.state = 0;
                    if (comp.type === 'PUSH_BUTTON') comp.pinStates[1] = 0;
                    simulate();
                    updateComponentVisuals(comp);
                    document.removeEventListener('mouseup', releaseHandler);
                };
                document.addEventListener('mouseup', releaseHandler);
            }
            return;
        }
    }

    if (currentTool === 'select' && !placingType) {
        const compEl = e.target.closest('.component');
        if (compEl && e.button === 0) {
            if (e.ctrlKey) {
                if (selectedCompIds.has(compEl.id)) {
                    selectedCompIds.delete(compEl.id);
                    compEl.classList.remove('selected', 'multi-selected');
                } else {
                    selectedCompIds.add(compEl.id);
                    compEl.classList.add('multi-selected');
                }
                selectedCompId = compEl.id;
            } else {
                clearMultiSelect();
                selectComponent(compEl.id);
            }

            const comp = components.get(compEl.id);
            if (comp) {
                isDragging = true;
                dragComp = comp;
                const coords = getWorkspaceCoords(e.clientX, e.clientY);
                dragOffsetX = coords.x - comp.x;
                dragOffsetY = coords.y - comp.y;
                // Store initial position for undo
                comp._dragStartX = comp.x;
                comp._dragStartY = comp.y;

                compEl.style.cursor = 'grabbing';
                compEl.style.zIndex = '100';
            }
            return;
        }

        if (!compEl && e.button === 0) {
            // Default to Box Select if on empty space, unless we explicitly want to Pan (maybe Shift+Drag or Space+Drag, but let's stick to standard behavior)
            // The user manual says Middle Click is Pan. So Left Drag should be Select.

            // If Ctrl is held, we ADD to selection (logic handled in mouseup)
            // If Ctrl is NOT held, we should clear existing selection first? 
            // Standard behavior: Click empty space clears selection. Drag starts new selection.

            if (!e.ctrlKey) {
                clearMultiSelect();
                deselectAll();
            }

            isSelecting = true;
            const coords = getWorkspaceCoords(e.clientX, e.clientY);
            selectionStartX = coords.x;
            selectionStartY = coords.y;
            selectionRect = document.createElement('div');
            selectionRect.className = 'selection-rect';
            workspace.appendChild(selectionRect);
        }
    }

    // Pan with middle mouse button
    if (e.button === 1) {
        e.preventDefault();
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panStartPanX = wsPanX;
        panStartPanY = wsPanY;
        wsContainer.style.cursor = 'grabbing';
    }
});

document.addEventListener('mousemove', (e) => {
    const coords = getWorkspaceCoords(e.clientX, e.clientY);
    statusCoords.textContent = `X: ${Math.round(coords.x)} Y: ${Math.round(coords.y)}`;

    if (isDragging && dragComp) {
        const c = getWorkspaceCoords(e.clientX, e.clientY);
        const newX = snap(c.x - dragOffsetX);
        const newY = snap(c.y - dragOffsetY);
        // منع سحب المكون خارج منطقة البناء
        dragComp.x = Math.max(BUILD_AREA.minX, Math.min(BUILD_AREA.maxX - 80, newX));
        dragComp.y = Math.max(BUILD_AREA.minY, Math.min(BUILD_AREA.maxY - 60, newY));
        const el = document.getElementById(dragComp.id);
        if (el) {
            el.style.left = dragComp.x + 'px';
            el.style.top = dragComp.y + 'px';
        }
        updateAllWires();
        return;
    }

    if (isPanning) {
        wsPanX = panStartPanX + (e.clientX - panStartX);
        wsPanY = panStartPanY + (e.clientY - panStartY);
        applyTransform();
        return;
    }

    if (ghostPreview && placingType) {
        const coords = getWorkspaceCoords(e.clientX, e.clientY);
        ghostPreview.style.left = (coords.x - 40) + 'px';
        ghostPreview.style.top = (coords.y - 30) + 'px';
    }

    if (wireStartComp && wireDrawLine) {
        const wsRect = wsContainer.getBoundingClientRect();
        const mx = (e.clientX - wsRect.left - wsPanX) / wsZoom;
        const my = (e.clientY - wsRect.top - wsPanY) / wsZoom;
        const p1 = getPinWorldPos(wireStartComp, wireStartPin);
        const allPts = [p1, ...wireWaypoints, { x: mx, y: my }];
        let d = `M ${allPts[0].x} ${allPts[0].y}`;
        for (let i = 1; i < allPts.length; i++) {
            d += ` H ${allPts[i].x} V ${allPts[i].y}`;
        }
        wireDrawLine.setAttribute('d', d);
    }

    if (isSelecting && selectionRect) {
        const coords = getWorkspaceCoords(e.clientX, e.clientY);
        const x = Math.min(selectionStartX, coords.x);
        const y = Math.min(selectionStartY, coords.y);
        const w = Math.abs(coords.x - selectionStartX);
        const h = Math.abs(coords.y - selectionStartY);
        selectionRect.style.left = x + 'px';
        selectionRect.style.top = y + 'px';
        selectionRect.style.width = w + 'px';
        selectionRect.style.height = h + 'px';
    }

    if (toolFloatLabel) {
        toolFloatLabel.style.left = e.clientX + 'px';
        toolFloatLabel.style.top = e.clientY + 'px';
    }
});

document.addEventListener('mouseup', (e) => {
    if (isDragging && dragComp) {
        const movedComp = dragComp;     // احفظ مرجعاً قبل المسح
        const el = document.getElementById(dragComp.id);
        if (el) {
            el.style.cursor = 'grab';
            el.style.zIndex = '15';
        }
        isDragging = false;
        dragComp = null;
        if (el) {
            el.style.cursor = 'grab';
            el.style.zIndex = '15';
        }

        // Push to history if moved
        if (movedComp.x !== movedComp._dragStartX || movedComp.y !== movedComp._dragStartY) {
            history.push({
                type: 'MOVE_COMP',
                data: {
                    id: movedComp.id,
                    oldX: movedComp._dragStartX,
                    oldY: movedComp._dragStartY,
                    newX: movedComp.x,
                    newY: movedComp.y
                }
            });
        }
        delete movedComp._dragStartX;
        delete movedComp._dragStartY;

        isDragging = false;
        dragComp = null;
        recomputeWireLanes();           // إعادة توزيع الـ lanes بعد تغيّر مواقع الـ pins
        updateAllWires();
    }

    if (isSelecting && selectionRect) {
        const rect = selectionRect.getBoundingClientRect();
        components.forEach((comp, id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const compRect = el.getBoundingClientRect();
            const cx = compRect.left + compRect.width / 2;
            const cy = compRect.top + compRect.height / 2;
            if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
                selectedCompIds.add(id);
                el.classList.add('multi-selected');
            }
        });
        selectionRect.remove();
        selectionRect = null;
        isSelecting = false;
    }

    if (isPanning) {
        isPanning = false;
        wsContainer.style.cursor = '';
    }
});

// --- Zoom with Mouse Wheel ---
// — helper: يطبّق zoom حول نقطة محددة (سواء من ماوس أو نقطة لمس) —
function _applyZoomAt(newZoom, anchorX, anchorY) {
    newZoom = Math.max(0.3, Math.min(3, newZoom));
    const rect = wsContainer.getBoundingClientRect();
    const mx = anchorX - rect.left;
    const my = anchorY - rect.top;
    wsPanX = mx - (mx - wsPanX) * (newZoom / wsZoom);
    wsPanY = my - (my - wsPanY) * (newZoom / wsZoom);
    wsZoom = newZoom;
    applyTransform();
    updateAllWires();
}

// — معالج wheel: يميّز بين أنواع الإدخال —
//   • trackpad pinch (Ctrl + wheel من المتصفح)         → تكبير/تصغير
//   • trackpad two-finger scroll (deltaY/deltaX صغير)  → pan
//   • mouse wheel عادي (deltaY كبير ~100)              → تكبير/تصغير
wsContainer.addEventListener('wheel', (e) => {
    e.preventDefault();

    // (1) Ctrl+wheel = pinch من trackpad أو Ctrl-scroll من ماوس → zoom
    if (e.ctrlKey) {
        // pinch — حساسية أعلى لأن deltaY صغير في الـ pinch
        const factor = e.deltaY > 0 ? -0.04 : 0.04;
        _applyZoomAt(wsZoom + factor * Math.abs(e.deltaY) / 10, e.clientX, e.clientY);
        return;
    }

    // (2) كشف trackpad two-finger scroll: deltaY بكسلات قليلة + deltaMode=0
    //     (الماوس العادي عادة deltaY=100 ومتقطّع، deltaMode قد يكون 1=lines)
    const isLikelyTrackpad =
        e.deltaMode === 0 &&
        Math.abs(e.deltaY) < 50 &&
        Math.abs(e.deltaX) < 50 &&
        // تأكيد إضافي: trackpad scroll عادة فيه قيم كسرية أو حركة على المحور X
        (e.deltaX !== 0 || (e.deltaY !== 0 && !Number.isInteger(e.deltaY * 10)));

    if (isLikelyTrackpad) {
        // pan ← حركة الإصبعَين معاً
        wsPanX -= e.deltaX;
        wsPanY -= e.deltaY;
        applyTransform();
        updateAllWires();
        return;
    }

    // (3) mouse wheel عادي → zoom (السلوك السابق)
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    _applyZoomAt(wsZoom + delta, e.clientX, e.clientY);
}, { passive: false });

// ==========================================
// TOUCH GESTURES — للشاشات اللمسية وأجهزة اللابتوب
// إصبعان معاً = pan، فتح/ضم الإصبعين = zoom
// ==========================================
let _touchState = null;

wsContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0], t2 = e.touches[1];
        _touchState = {
            startDist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
            startMidX: (t1.clientX + t2.clientX) / 2,
            startMidY: (t1.clientY + t2.clientY) / 2,
            lastMidX: (t1.clientX + t2.clientX) / 2,
            lastMidY: (t1.clientY + t2.clientY) / 2,
            startZoom: wsZoom,
            mode: null,                     // 'pan' أو 'zoom' — يتحدّد بعد أول حركة كبيرة
        };
    }
}, { passive: false });

wsContainer.addEventListener('touchmove', (e) => {
    if (_touchState && e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0], t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        // === تحديد النية في أوّل حركة ملموسة ===
        // المشكلة: عند الـ pan باصبعَين، تتغيّر المسافة بينهما قليلاً بسبب اهتزاز اليد،
        // فيُسبّب zoom طفيف غير مرغوب. الحل: نقفل النية بناءً على المسافة الأكبر.
        if (_touchState.mode === null) {
            const distChange = Math.abs(dist - _touchState.startDist);
            const midMove = Math.hypot(midX - _touchState.startMidX, midY - _touchState.startMidY);
            const PINCH_THRESHOLD = 30;     // ٣٠ بكسل تغيير في المسافة قبل اعتباره pinch
            const PAN_THRESHOLD = 12;       // ١٢ بكسل تحريك المنتصف قبل اعتباره pan

            if (distChange > PINCH_THRESHOLD && distChange > midMove * 1.2) {
                // المسافة تغيّرت أكثر من حركة المنتصف بفارق واضح → pinch
                _touchState.mode = 'zoom';
            } else if (midMove > PAN_THRESHOLD) {
                // المنتصف تحرّك بشكل ملموس → pan
                _touchState.mode = 'pan';
            }
            // قبل تجاوز أيّ threshold: لا نطبّق شيئاً (تجنّب الـ jitter)
            if (_touchState.mode === null) {
                _touchState.lastMidX = midX;
                _touchState.lastMidY = midY;
                return;
            }
        }

        if (_touchState.mode === 'pan') {
            // pan فقط — تجاهل تغيير المسافة بين الإصبعَين كلياً
            const dx = midX - _touchState.lastMidX;
            const dy = midY - _touchState.lastMidY;
            wsPanX += dx;
            wsPanY += dy;
            _touchState.lastMidX = midX;
            _touchState.lastMidY = midY;
            applyTransform();
            updateAllWires();
        } else if (_touchState.mode === 'zoom') {
            // zoom حول منتصف الإصبعَين
            const scale = dist / _touchState.startDist;
            const newZoom = Math.max(0.3, Math.min(3, _touchState.startZoom * scale));
            _applyZoomAt(newZoom, midX, midY);
            _touchState.lastMidX = midX;
            _touchState.lastMidY = midY;
        }
    }
}, { passive: false });

wsContainer.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        _touchState = null;
    }
});

// --- Zoom Buttons ---
document.getElementById('btn-zoom-in').addEventListener('click', () => {
    wsZoom = Math.min(3, wsZoom + 0.15);
    applyTransform();
    updateAllWires();
});

document.getElementById('btn-zoom-out').addEventListener('click', () => {
    wsZoom = Math.max(0.3, wsZoom - 0.15);
    applyTransform();
    updateAllWires();
});

function applyTransform() {
    workspace.style.transform = `translate(${wsPanX}px, ${wsPanY}px) scale(${wsZoom})`;
    zoomLevelText.textContent = Math.round(wsZoom * 100) + '%';
}

// ==========================================
// ZOOM TO FIT — احسب bounding box لجميع المكونات ووسّط/كبّر لإظهار التجربة كاملة
// ==========================================
function fitWorkspaceToContents() {
    const containerRect = wsContainer.getBoundingClientRect();
    const cW = containerRect.width;
    const cH = containerRect.height;

    let minX, minY, maxX, maxY;

    if (components.size === 0) {
        // لا توجد مكونات → اعرض منطقة البناء كاملة
        minX = BUILD_AREA.x;
        minY = BUILD_AREA.y;
        maxX = BUILD_AREA.x + BUILD_AREA.width;
        maxY = BUILD_AREA.y + BUILD_AREA.height;
    } else {
        // bounding box من جميع المكونات (نستخدم x,y المخزّنة + قياس تقديري)
        minX = Infinity; minY = Infinity;
        maxX = -Infinity; maxY = -Infinity;
        for (const [, comp] of components) {
            // قياس تقديري لكل نوع (الـ ICs أعرض، الـ LEDs أصغر، إلخ)
            let w = 100, h = 80;
            if (isICType(comp.type))         { w = 200; h = 110; }
            else if (isSevenSegType(comp.type)) { w = 110; h = 180; }
            else if (comp.type === 'LED')       { w = 50;  h = 50;  }
            else if (comp.type === 'RESISTOR' || comp.type === 'CAPACITOR') { w = 120; h = 50; }
            else if (comp.type === 'VCC' || comp.type === 'GND') { w = 70; h = 70; }
            else if (comp.type === 'DIP_SWITCH') { w = 160; h = 80; }
            // الإحداثيات المخزّنة (x,y) تمثّل الزاوية اليسرى العليا تقريباً
            const x0 = comp.x, y0 = comp.y;
            const x1 = x0 + w, y1 = y0 + h;
            if (x0 < minX) minX = x0;
            if (y0 < minY) minY = y0;
            if (x1 > maxX) maxX = x1;
            if (y1 > maxY) maxY = y1;
        }
    }

    // هامش حول المحتوى ليبدو مريحاً بصرياً
    const padding = 60;
    const bboxW = (maxX - minX) + padding * 2;
    const bboxH = (maxY - minY) + padding * 2;
    const bboxCenterX = (minX + maxX) / 2;
    const bboxCenterY = (minY + maxY) / 2;

    // مقياس مناسب — أصغر القيمتَين لضمان احتواء البُعدَين
    const scale = Math.max(0.25, Math.min(2.5, Math.min(cW / bboxW, cH / bboxH)));

    wsZoom = scale;
    // الـ pan = منتصف الـ container - منتصف الـ bbox مضروباً بالـ scale
    wsPanX = cW / 2 - bboxCenterX * scale;
    wsPanY = cH / 2 - bboxCenterY * scale;

    applyTransform();
    updateAllWires();
}

document.getElementById('btn-zoom-out').addEventListener('click', () => {
    wsZoom = Math.max(0.3, wsZoom - 0.15);
    applyTransform();
    updateAllWires();
});

document.getElementById('btn-zoom-fit').addEventListener('click', fitWorkspaceToContents);

function handlePinClick(compId, pinNum, e) {
    e.stopPropagation();
    if (!wireStartComp) {
        wireStartComp = compId;
        wireStartPin = pinNum;
        wireWaypoints = [];

        wireDrawLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        wireDrawLine.classList.add('wire-drawing');
        wireLayer.appendChild(wireDrawLine);

        const p = getPinWorldPos(compId, pinNum);
        wireDrawLine.setAttribute('d', `M ${p.x} ${p.y} L ${p.x} ${p.y}`);

        updateHint();
    } else {
        createWire(wireStartComp, wireStartPin, compId, pinNum, [...wireWaypoints]);
        cancelWireDrawing();
    }
}

function cancelWireDrawing() {
    wireStartComp = null;
    wireStartPin = null;
    wireWaypoints = [];
    if (wireDrawLine) {
        wireDrawLine.remove();
        wireDrawLine = null;
    }
    updateHint();
}

function selectComponent(compId) {
    document.querySelectorAll('.component.selected').forEach(el => el.classList.remove('selected'));
    selectedCompId = compId;
    const el = document.getElementById(compId);
    if (el) el.classList.add('selected');

    const comp = components.get(compId);
    if (comp) showComponentInfo(comp);
}

function deselectAll() {
    document.querySelectorAll('.component.selected').forEach(el => el.classList.remove('selected'));
    selectedCompId = null;
    showInfoPlaceholder();
}

function clearMultiSelect() {
    document.querySelectorAll('.component.multi-selected').forEach(el => el.classList.remove('multi-selected'));
    selectedCompIds.clear();
}

function rotateComponent(compId) {
    const comp = components.get(compId);
    if (!comp) return;
    const oldRot = comp.rotation || 0;
    comp.rotation = ((comp.rotation || 0) + 90) % 360;

    // History push
    if (history) { // Ensure history is available
        history.push({
            type: 'ROTATE_COMP',
            data: {
                id: compId,
                oldRot: oldRot,
                newRot: comp.rotation
            }
        });
    }

    renderComponent(comp);
    updateComponentVisuals(comp);
    updateAllWires();
    if (selectedCompId === compId) showComponentInfo(comp);
}

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
    // Skip shortcuts when typing in search
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Esc - Cancel
    if (e.key === 'Escape') {
        cancelWireDrawing();
        placingType = null;
        removeGhostPreview();
        wsContainer.className = '';
        clearMultiSelect();
        deselectAll();
        updateHint();
    }

    // S - Select Tool
    if (e.key === 's' || e.key === 'S') {
        setTool('select');
    }

    // W - Wire Tool
    if (e.key === 'w' || e.key === 'W') {
        setTool('wire');
    }

    // X - Cut Wire
    if (e.key === 'x' || e.key === 'X') {
        setTool('cut-wire');
    }

    // D - Delete
    if (e.key === 'd' || e.key === 'D') {
        setTool('delete');
    }

    // R - Rotate
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey) {
        if (selectedCompIds.size > 0) {
            selectedCompIds.forEach(id => rotateComponent(id));
        } else if (selectedCompId) {
            rotateComponent(selectedCompId);
        }
    }

    // Del - Delete Selected
    if (e.key === 'Delete') {
        if (selectedCompIds.size > 0) {
            selectedCompIds.forEach(id => deleteComponent(id));
            clearMultiSelect();
            deselectAll();
        } else if (selectedCompId) {
            deleteComponent(selectedCompId);
            selectedCompId = null;
            showInfoPlaceholder();
        }
    }


    // Undo / Redo Shortcuts
    // Ctrl+Z (Undo) - Check !e.shiftKey to ensure it's not Redo
    if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        history.undo();
    }
    // Ctrl+Y or Ctrl+Shift+Z (Redo)
    else if ((e.ctrlKey && (e.key === 'y' || e.key === 'Y')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
        e.preventDefault();
        history.redo();
    }
});

// Undo/Redo Buttons
document.getElementById('btn-undo').addEventListener('click', () => history.undo());
document.getElementById('btn-redo').addEventListener('click', () => history.redo());

let contextMenu = null;

wsContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    if (wireStartComp) {
        cancelWireDrawing();
        return;
    }

    if (placingType) {
        placingType = null;
        removeGhostPreview();
        wsContainer.className = '';
        updateHint();
        return;
    }

    removeContextMenu();

    const compEl = e.target.closest('.component');
    const wirePath = e.target.closest('.wire');

    if (!compEl && !wirePath) return;

    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';

    if (compEl) {
        const comp = components.get(compEl.id);
        let extraOptions = '';

        if (comp.type === 'LED' || isSevenSegType(comp.type)) {
            const swatches = LED_COLORS.map(c => `
                <div class="color-swatch ${comp.color === c.value ? 'active' : ''}"
                    data-color="${c.value}"
                    style="background:${c.hex};"
                    title="${c.name}">
                </div>
            `).join('');

            extraOptions = `
                <div class="context-menu-item no-hover" style="cursor:default; flex-direction:column; align-items:flex-start; pointer-events:none;">
                    <span style="margin-bottom:6px; font-size:11px; opacity:0.8; font-weight:600;">🎨 لون الإضاءة</span>
                    <div class="color-picker-row" style="pointer-events:all;">
                        ${swatches}
                    </div>
                </div>
            `;
        } else if (comp.type === 'VCC') {
            const voltOptions = [0, 3.3, 5, 9, 12];
            const curV = (typeof comp.voltage === 'number') ? comp.voltage : 5;
            const btns = voltOptions.map(v => {
                const lbl = (v === 0) ? 'OFF (0V)' : `${v}V`;
                return `<div class="context-menu-item ${v === curV ? 'active-freq' : ''}" data-action="set-voltage" data-volt="${v}">⚡ ${lbl}</div>`;
            }).join('');
            extraOptions = btns;
        } else if (comp.type === 'RESISTOR') {
            extraOptions = `<div class="context-menu-item" data-action="resistance">Ω قيمة المقاومة: ${formatResistance(comp.resistance || 330)}</div>`;
        } else if (comp.type === 'CAPACITOR') {
            const capValues = ['10pF', '100pF', '1nF', '10nF', '100nF', '1µF', '10µF', '47µF', '100µF', '470µF'];
            const curCap = comp.capacitance || '100nF';
            const btns = capValues.map(v => `<div class="context-menu-item ${v === curCap ? 'active-freq' : ''}" data-action="capacitance" data-cap="${v}">⚡ ${v}</div>`).join('');
            extraOptions = btns;
        }

        const curRot = comp.rotation || 0;
        const rotOptions = [0, 90, 180, 270].map(deg =>
            `<span class="rotate-opt ${curRot === deg ? 'active' : ''}" data-deg="${deg}">${deg}°</span>`
        ).join('');

        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="info">ℹ️ معلومات</div>
            <div class="context-menu-item no-hover" style="flex-direction:column; align-items:flex-start; pointer-events:none;">
                <span style="margin-bottom:6px; font-size:11px; opacity:0.8; font-weight:600;">🔄 التدوير</span>
                <div class="rotate-options" style="pointer-events:all;">${rotOptions}</div>
            </div>
            <div class="context-menu-item" data-action="flip-h">↔️ عكس أفقي</div>
            <div class="context-menu-item" data-action="flip-v">↕️ عكس عمودي</div>
            ${extraOptions}
            <div class="context-menu-item danger" data-action="delete">🗑️ حذف</div>
        `;

        contextMenu.addEventListener('click', (ev) => {
            const action = ev.target.closest('.context-menu-item')?.dataset.action;
            const swatch = ev.target.closest('.color-swatch');

            if (action === 'delete') deleteComponent(compEl.id);
            if (action === 'info') selectComponent(compEl.id);

            const rotOpt = ev.target.closest('.rotate-opt');
            if (rotOpt) {
                const deg = parseInt(rotOpt.dataset.deg);
                comp.rotation = deg;
                renderComponent(comp);
                updateComponentVisuals(comp);
                updateAllWires();
                if (selectedCompId === compEl.id) showComponentInfo(comp);
                removeContextMenu();
                return;
            }

            if (action === 'flip-h') {
                const r = comp.rotation || 0;
                comp.rotation = r === 90 ? 270 : r === 270 ? 90 : r;
                if (comp.rotation === r) comp.rotation = (r + 180) % 360;
                renderComponent(comp);
                updateComponentVisuals(comp);
                updateAllWires();
                removeContextMenu();
                return;
            }

            // Select component (with Ctrl+click multi-select)
            if (currentTool === 'select' && !placingType) {
                const compEl = e.target.closest('.component');
                if (compEl && e.button === 0) {
                    if (e.ctrlKey) {
                        // Toggle multi-select
                        if (selectedCompIds.has(compEl.id)) {
                            selectedCompIds.delete(compEl.id);
                            compEl.classList.remove('selected', 'multi-selected');
                        } else {
                            selectedCompIds.add(compEl.id);
                            compEl.classList.add('multi-selected');
                        }
                        selectedCompId = compEl.id;
                    } else {
                        // Single select
                        clearMultiSelect();
                        selectComponent(compEl.id);
                    }
                    // ... rest of code
                }
            }

            if (action === 'flip-v') {
                const r = comp.rotation || 0;
                comp.rotation = (r + 180) % 360;
                renderComponent(comp);
                updateComponentVisuals(comp);
                updateAllWires();
                removeContextMenu();
                return;
            }

            if (swatch) {
                const newColor = swatch.dataset.color;
                const oldColor = comp.color;
                if (newColor !== oldColor) {
                    comp.color = newColor;
                    history.push({
                        type: 'PROP_CHANGE',
                        data: { id: comp.id, key: 'color', oldVal: oldColor, newVal: newColor }
                    });
                    renderComponent(comp);
                    updateComponentVisuals(comp);
                }
                removeContextMenu();
            }

            if (action === 'set-voltage') {
                const newVal = parseFloat(ev.target.closest('.context-menu-item').dataset.volt);
                const oldVal = (typeof comp.voltage === 'number') ? comp.voltage : 5;
                if (newVal !== oldVal) {
                    comp.voltage = newVal;
                    comp.pinStates[1] = newVal > 0 ? 1 : 0;   // VCC = 0V يصبح غير مُفعَّل
                    history.push({
                        type: 'PROP_CHANGE',
                        data: { id: comp.id, key: 'voltage', oldVal: oldVal, newVal: newVal }
                    });
                    renderComponent(comp);
                    simulate();
                }
                removeContextMenu();
            }

            if (action === 'resistance') {
                removeContextMenu();
                const r = comp.resistance || 330;
                const current_mA = (3 / r * 1000).toFixed(1);
                const input = prompt(`أدخل قيمة المقاومة بالأوم (Ω)\nالقيمة الحالية: ${formatResistance(r)}\nالتيار: ${current_mA}mA (مع LED)`, r);
                if (input !== null) {
                    const val = parseFloat(input);
                    if (!isNaN(val) && val > 0 && val !== r) {
                        comp.resistance = val;
                        history.push({
                            type: 'PROP_CHANGE',
                            data: { id: comp.id, key: 'resistance', oldVal: r, newVal: val }
                        });
                        renderComponent(comp);
                        // إعادة تصفير حالة astable لمنع تراكم التوقيت القديم
                        for (const [, c] of components) {
                            if (c.type === 'IC555') {
                                c._astableTimeAcc = 0;
                            }
                        }
                        simulate();
                        if (selectedCompId && components.get(selectedCompId)?.type === 'IC555') {
                            showComponentInfo(components.get(selectedCompId));
                        }
                    }
                }
            }

            if (action === 'capacitance') {
                const newCap = ev.target.dataset.cap;
                const oldCap = comp.capacitance || '100nF';
                if (newCap !== oldCap) {
                    comp.capacitance = newCap;
                    history.push({
                        type: 'PROP_CHANGE',
                        data: { id: comp.id, key: 'capacitance', oldVal: oldCap, newVal: newCap }
                    });
                    renderComponent(comp);
                    // إعادة تصفير حالة الـ astable على كل 555 في الدائرة لمنع
                    // تراكم القديم مع التوقيت الجديد (الذي كان يُسبّب "تجمّداً" ظاهرياً)
                    for (const [, c] of components) {
                        if (c.type === 'IC555') {
                            c._astableTimeAcc = 0;
                            if (c.timerState) {
                                c.timerState.output = 0;
                                c.timerState.discharge = 0;
                            }
                        }
                    }
                    // استدعاء simulate لإعادة حساب _astablePeriodHigh/Low بالقيم الجديدة
                    simulate();
                    if (selectedCompId && components.get(selectedCompId)?.type === 'IC555') {
                        showComponentInfo(components.get(selectedCompId));
                    }
                }
                removeContextMenu();
            }

            if (action) removeContextMenu();
        });
    } else if (wirePath) {
        contextMenu.innerHTML = `
            <div class="context-menu-item danger" data-action="delete">🗑️ حذف السلك</div>
        `;
        contextMenu.addEventListener('click', (ev) => {
            const action = ev.target.closest('.context-menu-item')?.dataset.action;
            if (action === 'delete') {
                e.stopPropagation();
                deleteWire(wirePath.dataset.wireId);
            }
            removeContextMenu();
        });
    }

    document.body.appendChild(contextMenu);
    // تموضع ذكي: إذا تخطّت القائمة حدود الشاشة، نُحرّكها داخلها
    positionContextMenuSmart(contextMenu, e.clientX, e.clientY);
});

// ==========================================
// CONTEXT MENU SMART POSITIONING
// ==========================================
// يُموضع القائمة قرب نقطة النقر، ولو لم تتسع للأسفل/اليمين يُحرّكها
// للأعلى/اليسار. إذا كانت أطول من الشاشة، CSS max-height يُظهر شريط تمرير.
function positionContextMenuSmart(menuEl, clickX, clickY) {
    const margin = 8;
    const rect = menuEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = clickX;
    let top  = clickY;

    // لو امتدت تحت الشاشة → اعرضها فوق نقطة النقر
    if (top + rect.height > vh - margin) {
        const aboveTop = clickY - rect.height;
        top = (aboveTop >= margin) ? aboveTop : margin;
    }
    // لو امتدت يمين الشاشة → أزحها لليسار
    if (left + rect.width > vw - margin) {
        left = Math.max(margin, vw - rect.width - margin);
    }
    // ضمان عدم خروجها من اليسار/الأعلى
    if (left < margin) left = margin;
    if (top  < margin) top  = margin;

    menuEl.style.left = left + 'px';
    menuEl.style.top  = top  + 'px';
}

document.addEventListener('click', () => removeContextMenu());

function removeContextMenu() {
    if (contextMenu) {
        contextMenu.remove();
        contextMenu = null;
    }
}

document.getElementById('btn-clear').addEventListener('click', () => {
    if (components.size === 0) return;
    componentsLayer.innerHTML = '';
    wireLayer.innerHTML = '';
    components.clear();
    wires.clear();
    selectedCompId = null;
    showInfoPlaceholder();
    cancelWireDrawing();
});

// ==========================================
// EXAMPLE CIRCUITS
// ==========================================
function clearAll() {
    componentsLayer.innerHTML = '';
    wireLayer.innerHTML = '';
    components.clear();
    wires.clear();
    compIdCounter = 0;
    wireIdCounter = 0;
    cancelWireDrawing();
    showInfoPlaceholder();
}

document.getElementById('btn-clear').addEventListener('click', () => {
    clearAll();
});

// =====================================================
// DROPDOWN — قائمة منسدلة للأمثلة
// =====================================================
// أي عنصر له class="dropdown" يدعم النقر على .dropdown-toggle
// لفتح/إغلاق .dropdown-menu التابع له. النقر خارج القائمة يغلقها.
function setupDropdowns() {
    document.querySelectorAll('.dropdown').forEach(dd => {
        const toggle = dd.querySelector('.dropdown-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            // أغلق أي dropdown آخر مفتوح
            document.querySelectorAll('.dropdown.open').forEach(other => {
                if (other !== dd) other.classList.remove('open');
            });
            dd.classList.toggle('open');
        });

        // عند اختيار عنصر من القائمة → أغلقها
        dd.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                dd.classList.remove('open');
            });
        });
    });

    // النقر خارج أي dropdown يُغلقها كلها
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown.open').forEach(dd => dd.classList.remove('open'));
        }
    });

    // Escape يُغلقها
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.dropdown.open').forEach(dd => dd.classList.remove('open'));
        }
    });
}
setupDropdowns();

// =====================================================
// EXAMPLES — أمثلة جاهزة. كل مثال يبني داخل منطقة البناء
// (BUILD_AREA) مع تباعد كافٍ بين المكونات ليستفيد من
// الـ smart routing والـ lane assignment الجديد.
// =====================================================

// --- Example 1: AND Gate (IC 7408) — مثال بسيط ---
document.getElementById('btn-example1').addEventListener('click', () => {
    clearAll();
    // المكونات: 2 مفاتيح → IC AND → مقاومة → LED → GND. VCC في الأعلى.
    const sw1 = createComponent('SWITCH',   200, 220);
    const sw2 = createComponent('SWITCH',   200, 320);
    const ic  = createComponent('IC7408',   460, 230);
    const res = createComponent('RESISTOR', 740, 270);
    const led = createComponent('LED',      900, 270);
    const vcc = createPoweredVCC(      640, 100);
    const gnd = createComponent('GND',      400, 500);

    led.color = 'green';
    renderComponent(led);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // مدخلات البوابة 1: pins 1 (1A), 2 (1B)
            createWire(sw1.id, 1, ic.id, 1);
            createWire(sw2.id, 1, ic.id, 2);
            // مخرج البوابة 1 (pin 3 = 1Y) → مقاومة → LED → GND
            createWire(ic.id, 3, res.id, 1);
            createWire(res.id, 2, led.id, 1);
            // الطاقة: VCC على pin 14، GND على pin 7
            createWire(vcc.id, 1, ic.id, 14);
            createWire(gnd.id, 1, ic.id, 7);

            recomputeWireLanes();
            updateAllWires();
            simulate();
            selectComponent(ic.id);
        });
    });
});

// --- Example 2: 4-Bit Comparator (IC 7485) ---
document.getElementById('btn-example2').addEventListener('click', () => {
    clearAll();
    // — DIP switches للمدخلات A و B، IC في الوسط، 3 LEDs للمخارج —
    const dipA = createComponent('DIP_SWITCH', 200, 200);    // A0..A3
    const dipB = createComponent('DIP_SWITCH', 200, 480);    // B0..B3
    const ic   = createComponent('IC7485',     560, 280);

    // 3 مخارج: A>B, A=B, A<B → كل واحد له مقاومة + LED
    const resGT = createComponent('RESISTOR', 880, 320);
    const resEQ = createComponent('RESISTOR', 880, 410);
    const resLT = createComponent('RESISTOR', 880, 500);
    const ledGT = createComponent('LED',     1040, 320);
    const ledEQ = createComponent('LED',     1040, 410);
    const ledLT = createComponent('LED',     1040, 500);

    // الطاقة
    const vccIC    = createPoweredVCC( 760, 100);   // VCC للـ IC
    const vccDip   = createPoweredVCC( 360, 380);   // VCC تغذية مفاتيح DIP
    const vccCasc  = createPoweredVCC( 460, 700);   // cascade A=B input HIGH
    const gnd      = createComponent('GND', 600, 770);

    ledGT.color = 'green';
    ledEQ.color = 'yellow';
    ledLT.color = 'red';
    renderComponent(ledGT);
    renderComponent(ledEQ);
    renderComponent(ledLT);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // تغذية مفاتيح DIP بالـ VCC
            createWire(vccDip.id, 1, dipA.id, 5);
            createWire(vccDip.id, 1, dipA.id, 6);
            createWire(vccDip.id, 1, dipA.id, 7);
            createWire(vccDip.id, 1, dipA.id, 8);
            createWire(vccDip.id, 1, dipB.id, 5);
            createWire(vccDip.id, 1, dipB.id, 6);
            createWire(vccDip.id, 1, dipB.id, 7);
            createWire(vccDip.id, 1, dipB.id, 8);

            // مخارج DIP_A → مدخلات A على الـ IC (pin 10=A0, 12=A1, 13=A2, 15=A3)
            createWire(dipA.id, 1, ic.id, 10);
            createWire(dipA.id, 2, ic.id, 12);
            createWire(dipA.id, 3, ic.id, 13);
            createWire(dipA.id, 4, ic.id, 15);

            // مخارج DIP_B → مدخلات B على الـ IC (pin 9=B0, 11=B1, 14=B2, 1=B3)
            createWire(dipB.id, 1, ic.id, 9);
            createWire(dipB.id, 2, ic.id, 11);
            createWire(dipB.id, 3, ic.id, 14);
            createWire(dipB.id, 4, ic.id, 1);

            // cascade inputs: A=B (pin 3) = HIGH، A>B (pin 4) = LOW، A<B (pin 2) = LOW
            createWire(vccCasc.id, 1, ic.id, 3);
            createWire(gnd.id, 1, ic.id, 2);
            createWire(gnd.id, 1, ic.id, 4);

            // مخارج المقارن: pins 5,6,7 → مقاومات → LEDs
            createWire(ic.id, 5, resGT.id, 1);
            createWire(resGT.id, 2, ledGT.id, 1);
            createWire(ic.id, 6, resEQ.id, 1);
            createWire(resEQ.id, 2, ledEQ.id, 1);
            createWire(ic.id, 7, resLT.id, 1);
            createWire(resLT.id, 2, ledLT.id, 1);

            // الطاقة: VCC pin 16، GND pin 8
            createWire(vccIC.id, 1, ic.id, 16);
            createWire(gnd.id, 1, ic.id, 8);

            recomputeWireLanes();
            updateAllWires();
            simulate();
            selectComponent(ic.id);
        });
    });
});

// --- Example 3: BCD → 7-Segment Display (IC 7447 + Common-Anode 7-Seg) ---
document.getElementById('btn-example3').addEventListener('click', () => {
    clearAll();
    // — 4 مفاتيح للـ BCD، IC في الوسط، شاشة 7-أجزاء على اليمين —
    const sw0 = createComponent('SWITCH', 200, 220);   // A = LSB → pin 7
    const sw1 = createComponent('SWITCH', 200, 300);   // B       → pin 1
    const sw2 = createComponent('SWITCH', 200, 380);   // C       → pin 2
    const sw3 = createComponent('SWITCH', 200, 460);   // D = MSB → pin 6
    const ic  = createComponent('IC7447', 500, 280);
    const seg = createComponent('SEVEN_SEG_CA', 850, 240);
    seg.color = 'green';
    renderComponent(seg);

    // الطاقة: VCC للـ IC، VCC للـ COM (لأن الشاشة Common-Anode)،
    // VCC لمداخل التحكم (LT, BI, RBI كلها active-LOW = HIGH تعطيلها)
    const vccIC    = createPoweredVCC( 700, 100);
    const vccSeg   = createPoweredVCC( 950, 100);
    const vccCtrl  = createPoweredVCC( 320, 580);
    const gnd      = createComponent('GND', 480, 660);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // مدخلات BCD حسب الـ datasheet: A=pin7, B=pin1, C=pin2, D=pin6
            createWire(sw0.id, 1, ic.id, 7);   // A
            createWire(sw1.id, 1, ic.id, 1);   // B
            createWire(sw2.id, 1, ic.id, 2);   // C
            createWire(sw3.id, 1, ic.id, 6);   // D

            // Active-LOW controls — اربطها بـ VCC لتعطيلها (HIGH = inactive)
            createWire(vccCtrl.id, 1, ic.id, 3);   // LT
            createWire(vccCtrl.id, 1, ic.id, 4);   // BI/RBO
            createWire(vccCtrl.id, 1, ic.id, 5);   // RBI

            // مخارج الـ IC → أطراف الشاشة (pin 13=a → seg pin 7, إلخ)
            createWire(ic.id, 13, seg.id, 7);   // a
            createWire(ic.id, 12, seg.id, 6);   // b
            createWire(ic.id, 11, seg.id, 4);   // c
            createWire(ic.id, 10, seg.id, 2);   // d
            createWire(ic.id, 9,  seg.id, 1);   // e
            createWire(ic.id, 15, seg.id, 9);   // f
            createWire(ic.id, 14, seg.id, 10);  // g

            // طاقة الـ IC والشاشة
            createWire(vccIC.id,  1, ic.id, 16);
            createWire(gnd.id,    1, ic.id, 8);
            createWire(vccSeg.id, 1, seg.id, 3);   // COM-1 (Common-Anode → VCC)
            createWire(vccSeg.id, 1, seg.id, 8);   // COM-2

            recomputeWireLanes();
            updateAllWires();
            simulate();
            selectComponent(ic.id);
        });
    });
});

// --- Example 4: 555 Timer in Astable Mode ---
document.getElementById('btn-example4').addEventListener('click', () => {
    clearAll();
    // — مذبذب astable: R1, R2, C يحدّدون التردد. الخرج (pin 3) → LED —
    const timer = createComponent('IC555', 500, 280);

    // R1 و R2 على شكل تسلسل بين VCC و الأرضي
    const r1 = createComponent('RESISTOR', 320, 180);
    r1.resistance = 1000;
    const r2 = createComponent('RESISTOR', 600, 180);
    r2.resistance = 10000;

    const cap = createComponent('CAPACITOR', 500, 460);
    cap.capacitance = '100µF';   // مكثّف كبير → تردّد بطيء (~0.7Hz) لإظهار التذبذب بصرياً

    // مقاومة الحماية + LED على المخرج
    const outRes = createComponent('RESISTOR', 760, 290);
    outRes.resistance = 330;
    const led = createComponent('LED', 940, 290);
    led.color = 'red';
    renderComponent(led);

    const vcc = createPoweredVCC( 500, 80);
    const gnd = createComponent('GND', 500, 580);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // VCC على pin 8 و pin 4 (RST: تفعيل المؤقت — active HIGH للتشغيل)
            createWire(vcc.id, 1, timer.id, 8);
            createWire(vcc.id, 1, timer.id, 4);
            // VCC → R1 → DISCH (pin 7) — الشحن عبر R1+R2، التفريغ عبر R2 من DISCH
            createWire(vcc.id, 1, r1.id, 1);
            createWire(r1.id, 2, timer.id, 7);
            createWire(r1.id, 2, r2.id, 1);
            // R2 → THRES (pin 6) و TRIG (pin 2) — مرتبطان بنفس النقطة
            createWire(r2.id, 2, timer.id, 6);
            createWire(r2.id, 2, timer.id, 2);
            // المكثف بين THRES و GND
            createWire(timer.id, 6, cap.id, 1);
            createWire(cap.id, 2, gnd.id, 1);
            // GND على pin 1
            createWire(timer.id, 1, gnd.id, 1);
            // المخرج → مقاومة → LED → (LED.GND داخلي)
            createWire(timer.id, 3, outRes.id, 1);
            createWire(outRes.id, 2, led.id, 1);

            recomputeWireLanes();
            updateAllWires();
            simulate();
            selectComponent(timer.id);
        });
    });
});

// --- Example 5: Pull-down + Physical Switches + AND Gate ---
// مثال تربوي: مفتاحان فيزيائيان، كلٌّ منهما مع مقاومة عادية موصولة بـ GND (= pull-down طبيعي)
// → AND gate → LED. عند ضغط الزرّين معاً فقط، الـ LED يضيء.
document.getElementById('btn-example5').addEventListener('click', () => {
    clearAll();

    // المكوّنات الرئيسية
    const sw1 = createComponent('SWITCH_PHYSICAL', 240, 200);   // مفتاح فيزيائي 1
    const sw2 = createComponent('SWITCH_PHYSICAL', 240, 380);   // مفتاح فيزيائي 2

    // مقاومتان عاديّتان (10kΩ) تعملان pull-down — كلّ واحدة بين نقطة الإدخال و GND
    const pd1 = createComponent('RESISTOR', 400, 280);
    pd1.resistance = 10000;
    const pd2 = createComponent('RESISTOR', 400, 460);
    pd2.resistance = 10000;

    const ic  = createComponent('IC7408', 580, 240);   // AND gate
    const res = createComponent('RESISTOR', 840, 280);
    res.resistance = 330;
    const led = createComponent('LED', 1000, 280);
    led.color = 'green';
    renderComponent(led);

    // الطاقة
    const vcc = createPoweredVCC(580, 80, 5);          // VCC للـ IC والمفاتيح
    const gnd = createComponent('GND', 600, 600);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // ============ الزرّ 1 ============
            // VCC → قطب 1 من المفتاح
            createWire(vcc.id, 1, sw1.id, 1);
            // قطب 2 → 1A على IC (نقطة الإدخال)
            createWire(sw1.id, 2, ic.id, 1);
            // نفس النقطة → مقاومة pull-down → GND
            createWire(sw1.id, 2, pd1.id, 1);
            createWire(pd1.id, 2, gnd.id, 1);

            // ============ الزرّ 2 ============
            createWire(vcc.id, 1, sw2.id, 1);
            createWire(sw2.id, 2, ic.id, 2);
            createWire(sw2.id, 2, pd2.id, 1);
            createWire(pd2.id, 2, gnd.id, 1);

            // ============ خرج البوابة → LED ============
            createWire(ic.id, 3, res.id, 1);
            createWire(res.id, 2, led.id, 1);

            // ============ طاقة الـ IC ============
            createWire(vcc.id, 1, ic.id, 14);   // VCC على pin 14
            createWire(gnd.id, 1, ic.id, 7);    // GND على pin 7

            recomputeWireLanes();
            updateAllWires();
            simulate();
            selectComponent(sw1.id);

            showToast('💡 اضغط الزرّين الفيزيائيَّين معاً ليضيء الـ LED', 'info');
        });
    });
});

// --- Example 6: 74193 Up Counter with 4 LEDs ---
// عدّاد تصاعدي 4-بت: زر فيزيائي → نبضة صعود على CPU → +1 على العدّاد
// المخارج Q0..Q3 تعرض القيمة بالنظام الثنائي على 4 LEDs
// PL=HIGH (لا تحميل)، MR=LOW (لا إعادة ضبط)، CPD=HIGH (لا عد تنازلي)
document.getElementById('btn-example6').addEventListener('click', () => {
    clearAll();

    // العدّاد في المنتصف
    const ic = createComponent('IC74193', 700, 320);

    // الزر الفيزيائي للعدّ التصاعدي + مقاومة pull-down (10kΩ)
    const btn = createComponent('PUSH_BUTTON_PHYSICAL', 280, 320);
    const pdR = createComponent('RESISTOR', 460, 460);
    pdR.resistance = 10000;

    // 4 LEDs مع مقاومات حماية (330Ω) على Q0..Q3
    // Q0 = pin 3 (LSB)، Q1 = pin 2، Q2 = pin 6، Q3 = pin 7 (MSB)
    const r0 = createComponent('RESISTOR', 980, 220);   r0.resistance = 330;
    const led0 = createComponent('LED', 1140, 220);     led0.color = 'red';
    const r1 = createComponent('RESISTOR', 980, 300);   r1.resistance = 330;
    const led1 = createComponent('LED', 1140, 300);     led1.color = 'yellow';
    const r2 = createComponent('RESISTOR', 980, 380);   r2.resistance = 330;
    const led2 = createComponent('LED', 1140, 380);     led2.color = 'green';
    const r3 = createComponent('RESISTOR', 980, 460);   r3.resistance = 330;
    const led3 = createComponent('LED', 1140, 460);     led3.color = 'blue';
    [led0, led1, led2, led3].forEach(l => renderComponent(l));

    // الطاقة
    const vcc = createPoweredVCC(700, 140, 5);
    const gnd = createComponent('GND', 700, 640);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // === طاقة الـ IC ===
            createWire(vcc.id, 1, ic.id, 16);   // VCC على pin 16
            createWire(gnd.id, 1, ic.id, 8);    // GND على pin 8

            // === ضبط أوضاع التحكم ===
            createWire(vcc.id, 1, ic.id, 11);   // PL = HIGH → تعطيل التحميل المتوازي
            createWire(gnd.id, 1, ic.id, 14);   // MR = LOW → تعطيل إعادة الضبط
            createWire(vcc.id, 1, ic.id, 4);    // CPD = HIGH → لا حافة صاعدة للعد التنازلي
            // P0..P3 = LOW (لا أهمية لأن PL=HIGH، لكن لتجنّب floating inputs)
            createWire(gnd.id, 1, ic.id, 15);   // P0
            createWire(gnd.id, 1, ic.id, 1);    // P1
            createWire(gnd.id, 1, ic.id, 10);   // P2
            createWire(gnd.id, 1, ic.id, 9);    // P3

            // === الزر مع pull-down → CPU (pin 5) ===
            createWire(vcc.id, 1, btn.id, 1);   // VCC → طرف 1 من الزر
            createWire(btn.id, 2, ic.id, 5);    // طرف 2 → CPU (إشارة الساعة)
            createWire(btn.id, 2, pdR.id, 1);   // طرف 2 → مقاومة pull-down
            createWire(pdR.id, 2, gnd.id, 1);   // المقاومة → GND

            // === المخارج Q0..Q3 → مقاومة → LED ===
            createWire(ic.id, 3, r0.id, 1);   createWire(r0.id, 2, led0.id, 1);   // Q0
            createWire(ic.id, 2, r1.id, 1);   createWire(r1.id, 2, led1.id, 1);   // Q1
            createWire(ic.id, 6, r2.id, 1);   createWire(r2.id, 2, led2.id, 1);   // Q2
            createWire(ic.id, 7, r3.id, 1);   createWire(r3.id, 2, led3.id, 1);   // Q3

            recomputeWireLanes();
            updateAllWires();
            simulate();
            selectComponent(btn.id);

            showToast('🔢 اضغط الزر لزيادة العدّاد. الـ LEDs تعرض القيمة الثنائية (Q3 Q2 Q1 Q0)', 'info');
        });
    });
});

// --- Example 7: 74193 + 7447 + 7-Segment Display ---
// تجربة شاملة: زر فيزيائي → عدّاد 4-بت → مفكّك BCD → شاشة سبعية
// • كل ضغطة → +1 على العدّاد → الشاشة تعرض الرقم
// • القيم 0-9: تعرض كأرقام عادية
// • القيم 10-15: تعرض رموزاً غير قياسية (7447 BCD لا hex)
// • القيمة 16 تعود لـ 0 (دورة العدّاد 4-بت)
document.getElementById('btn-example7').addEventListener('click', () => {
    clearAll();

    // المكونات الرئيسية
    const ic193 = createComponent('IC74193', 540, 320);
    const ic7447 = createComponent('IC7447', 940, 320);
    const seg = createComponent('SEVEN_SEG_CA', 1480, 240);
    seg.color = 'green';
    renderComponent(seg);

    // زر العدّ + pull-down (10kΩ)
    const btn = createComponent('PUSH_BUTTON_PHYSICAL', 200, 320);
    const pdR = createComponent('RESISTOR', 360, 460);
    pdR.resistance = 10000;

    // 7 مقاومات حماية للشاشة (330Ω) — قطعة لكل segment
    const ra = createComponent('RESISTOR', 1220, 100);   ra.resistance = 330;
    const rb = createComponent('RESISTOR', 1220, 180);   rb.resistance = 330;
    const rc = createComponent('RESISTOR', 1220, 260);   rc.resistance = 330;
    const rd = createComponent('RESISTOR', 1220, 340);   rd.resistance = 330;
    const re = createComponent('RESISTOR', 1220, 420);   re.resistance = 330;
    const rf = createComponent('RESISTOR', 1220, 500);   rf.resistance = 330;
    const rg = createComponent('RESISTOR', 1220, 580);   rg.resistance = 330;

    // مصادر الطاقة
    const vccMain  = createPoweredVCC(680, 100, 5);
    const vccSeg   = createPoweredVCC(1540, 100, 5);
    const gnd      = createComponent('GND', 680, 720);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // === طاقة 74193 + إعدادات التحكم ===
            createWire(vccMain.id, 1, ic193.id, 16);   // VCC
            createWire(gnd.id,     1, ic193.id, 8);    // GND
            createWire(vccMain.id, 1, ic193.id, 11);   // PL = HIGH (no load)
            createWire(gnd.id,     1, ic193.id, 14);   // MR = LOW (no reset)
            createWire(vccMain.id, 1, ic193.id, 4);    // CPD = HIGH (no down count)
            createWire(gnd.id,     1, ic193.id, 15);   // P0 = LOW
            createWire(gnd.id,     1, ic193.id, 1);    // P1 = LOW
            createWire(gnd.id,     1, ic193.id, 10);   // P2 = LOW
            createWire(gnd.id,     1, ic193.id, 9);    // P3 = LOW

            // === الزر + pull-down → CPU (pin 5) ===
            createWire(vccMain.id, 1, btn.id, 1);
            createWire(btn.id, 2, ic193.id, 5);        // CPU clock
            createWire(btn.id, 2, pdR.id, 1);
            createWire(pdR.id, 2, gnd.id, 1);

            // === مخارج 74193 → مدخلات BCD على 7447 ===
            // 7447 inputs (datasheet): A=pin7, B=pin1, C=pin2, D=pin6
            createWire(ic193.id, 3, ic7447.id, 7);     // Q0 (LSB) → A
            createWire(ic193.id, 2, ic7447.id, 1);     // Q1 → B
            createWire(ic193.id, 6, ic7447.id, 2);     // Q2 → C
            createWire(ic193.id, 7, ic7447.id, 6);     // Q3 (MSB) → D

            // === طاقة 7447 + تعطيل تحكمات active-LOW ===
            createWire(vccMain.id, 1, ic7447.id, 16);  // VCC
            createWire(gnd.id,     1, ic7447.id, 8);   // GND
            createWire(vccMain.id, 1, ic7447.id, 3);   // LT = HIGH (no lamp test)
            createWire(vccMain.id, 1, ic7447.id, 4);   // BI/RBO = HIGH (no blanking)
            createWire(vccMain.id, 1, ic7447.id, 5);   // RBI = HIGH (no ripple blank)

            // === مخارج 7447 → مقاومات → segments الشاشة ===
            createWire(ic7447.id, 13, ra.id, 1);   createWire(ra.id, 2, seg.id, 7);    // a
            createWire(ic7447.id, 12, rb.id, 1);   createWire(rb.id, 2, seg.id, 6);    // b
            createWire(ic7447.id, 11, rc.id, 1);   createWire(rc.id, 2, seg.id, 4);    // c
            createWire(ic7447.id, 10, rd.id, 1);   createWire(rd.id, 2, seg.id, 2);    // d
            createWire(ic7447.id, 9,  re.id, 1);   createWire(re.id, 2, seg.id, 1);    // e
            createWire(ic7447.id, 15, rf.id, 1);   createWire(rf.id, 2, seg.id, 9);    // f
            createWire(ic7447.id, 14, rg.id, 1);   createWire(rg.id, 2, seg.id, 10);   // g

            // === طاقة الشاشة (Common-Anode → VCC على COM-1 و COM-2) ===
            createWire(vccSeg.id, 1, seg.id, 3);
            createWire(vccSeg.id, 1, seg.id, 8);

            recomputeWireLanes();
            updateAllWires();
            simulate();
            selectComponent(btn.id);

            showToast('🔢 اضغط الزر — العدّاد يزيد والشاشة تعرض الرقم (0-9 صحيح، 10-15 رموز غير قياسية)', 'info');
        });
    });
});

// --- Example 8: Auto Counter — 555 Astable + 74193 + 7447 + 7-Segment ---
// النسخة الأوتوماتيكية من Example 7: IC 555 يُولّد نبضات ساعة مستمرّة
// تُغذّي العدّاد بدون الحاجة لزر يدوي. العدّاد يدور تلقائياً 0→15.
// • R1=1kΩ، R2=10kΩ، C1=47µF → f ≈ 1.46 Hz (مرئية للعين)
// • C2=10nF على CONT لتثبيت الفولتية المرجعية (اختياري)
// • الباقي مطابق لـ Example 7
document.getElementById('btn-example8').addEventListener('click', () => {
    clearAll();

    // ====== المؤقّت 555 في وضع astable ======
    const timer = createComponent('IC555', 260, 360);

    // المقاومات حسب الـ datasheet للتجربة الورقية: R1=1kΩ، R2=10kΩ
    const r1 = createComponent('RESISTOR', 100, 200);   r1.resistance = 1000;
    const r2 = createComponent('RESISTOR', 100, 320);   r2.resistance = 10000;

    // مكثّف التوقيت C1=47µF — ضمن نطاق التجربة (يعطي تردد ≈ 1.46 Hz)
    const c1 = createComponent('CAPACITOR', 160, 540);  c1.capacitance = '47µF';
    // مكثّف CONT الترشيحي C2=10nF (اختياري لكن مذكور في الـ datasheet)
    const c2 = createComponent('CAPACITOR', 400, 540);  c2.capacitance = '10nF';

    // ====== العدّاد 74193 ======
    const ic193 = createComponent('IC74193', 720, 360);

    // ====== المفكّك 7447 + شاشة + مقاومات حماية ======
    const ic7447 = createComponent('IC7447', 1120, 360);
    const seg = createComponent('SEVEN_SEG_CA', 1620, 280);
    seg.color = 'green';
    renderComponent(seg);

    const ra = createComponent('RESISTOR', 1340, 140);   ra.resistance = 330;
    const rb = createComponent('RESISTOR', 1340, 220);   rb.resistance = 330;
    const rc = createComponent('RESISTOR', 1340, 300);   rc.resistance = 330;
    const rd = createComponent('RESISTOR', 1340, 380);   rd.resistance = 330;
    const re = createComponent('RESISTOR', 1340, 460);   re.resistance = 330;
    const rf = createComponent('RESISTOR', 1340, 540);   rf.resistance = 330;
    const rg = createComponent('RESISTOR', 1340, 620);   rg.resistance = 330;

    // ====== مصادر الطاقة ======
    const vccMain = createPoweredVCC(720, 160, 5);
    const vccSeg  = createPoweredVCC(1680, 160, 5);
    const gnd     = createComponent('GND', 720, 760);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // ========== 555 Astable wiring (per Example 4) ==========
            // VCC على pin 8 و pin 4 (RST: تفعيل المؤقت)
            createWire(vccMain.id, 1, timer.id, 8);
            createWire(vccMain.id, 1, timer.id, 4);
            // VCC → R1 → DISCH (pin 7)
            createWire(vccMain.id, 1, r1.id, 1);
            createWire(r1.id, 2, timer.id, 7);
            // R1 → R2 (متّصلة من DISCH عبر pin 7)
            createWire(r1.id, 2, r2.id, 1);
            // R2 → THRES (pin 6) و TRIG (pin 2) معاً
            createWire(r2.id, 2, timer.id, 6);
            createWire(r2.id, 2, timer.id, 2);
            // C1 بين THRES (pin 6) و GND
            createWire(timer.id, 6, c1.id, 1);
            createWire(c1.id, 2, gnd.id, 1);
            // C2 بين CONT (pin 5) و GND (ترشيح اختياري)
            createWire(timer.id, 5, c2.id, 1);
            createWire(c2.id, 2, gnd.id, 1);
            // GND على pin 1
            createWire(timer.id, 1, gnd.id, 1);

            // ========== 555 output → 74193 CPU ==========
            createWire(timer.id, 3, ic193.id, 5);   // OUT → CPU

            // ========== 74193 power + control ==========
            createWire(vccMain.id, 1, ic193.id, 16);   // VCC
            createWire(gnd.id,     1, ic193.id, 8);    // GND
            createWire(vccMain.id, 1, ic193.id, 11);   // PL = HIGH (no load)
            createWire(gnd.id,     1, ic193.id, 14);   // MR = LOW (no reset)
            createWire(vccMain.id, 1, ic193.id, 4);    // CPD = HIGH (no down count)
            createWire(gnd.id,     1, ic193.id, 15);   // P0..P3 = LOW
            createWire(gnd.id,     1, ic193.id, 1);
            createWire(gnd.id,     1, ic193.id, 10);
            createWire(gnd.id,     1, ic193.id, 9);

            // ========== 74193 outputs → 7447 BCD inputs ==========
            // 7447 inputs (datasheet): A=pin7, B=pin1, C=pin2, D=pin6
            createWire(ic193.id, 3, ic7447.id, 7);    // Q0 → A (LSB)
            createWire(ic193.id, 2, ic7447.id, 1);    // Q1 → B
            createWire(ic193.id, 6, ic7447.id, 2);    // Q2 → C
            createWire(ic193.id, 7, ic7447.id, 6);    // Q3 → D (MSB)

            // ========== 7447 power + disable active-LOW controls ==========
            createWire(vccMain.id, 1, ic7447.id, 16);
            createWire(gnd.id,     1, ic7447.id, 8);
            createWire(vccMain.id, 1, ic7447.id, 3);   // LT = HIGH
            createWire(vccMain.id, 1, ic7447.id, 4);   // BI/RBO = HIGH
            createWire(vccMain.id, 1, ic7447.id, 5);   // RBI = HIGH

            // ========== 7447 outputs → resistors → segments ==========
            createWire(ic7447.id, 13, ra.id, 1);   createWire(ra.id, 2, seg.id, 7);    // a
            createWire(ic7447.id, 12, rb.id, 1);   createWire(rb.id, 2, seg.id, 6);    // b
            createWire(ic7447.id, 11, rc.id, 1);   createWire(rc.id, 2, seg.id, 4);    // c
            createWire(ic7447.id, 10, rd.id, 1);   createWire(rd.id, 2, seg.id, 2);    // d
            createWire(ic7447.id, 9,  re.id, 1);   createWire(re.id, 2, seg.id, 1);    // e
            createWire(ic7447.id, 15, rf.id, 1);   createWire(rf.id, 2, seg.id, 9);    // f
            createWire(ic7447.id, 14, rg.id, 1);   createWire(rg.id, 2, seg.id, 10);   // g

            // ========== شاشة Common-Anode → VCC مستقل ==========
            createWire(vccSeg.id, 1, seg.id, 3);
            createWire(vccSeg.id, 1, seg.id, 8);

            recomputeWireLanes();
            updateAllWires();
            simulate();
            selectComponent(timer.id);

            showToast('⚙️ المؤقّت 555 يُولّد نبضات الساعة تلقائياً — العدّاد يدور دون تدخّل (15 = شاشة فارغة، طبيعي)', 'info');
        });
    });
});

// ==========================================
// INITIALIZATION
// ==========================================
applyTransform();
showInfoPlaceholder();
updateHint();
wsPanX = 100;
wsPanY = 50;
applyTransform();

document.addEventListener('contextmenu', (e) => {
    if (placingType) {
        e.preventDefault();
        setTool('select');
        return;
    }
    if (wireStartComp) {
        e.preventDefault();
        cancelWireDrawing();
        return;
    }
});

const helpModal = document.getElementById('controls-modal');
const btnHelp = document.getElementById('btn-help');
const btnCloseHelp = document.getElementById('btn-close-help');
const closeSpan = document.querySelector('.close-modal');

function toggleHelpModal(show) {
    if (show) {
        helpModal.style.display = 'flex';
        helpModal.offsetHeight;
        helpModal.classList.add('show');
    } else {
        helpModal.classList.remove('show');
        setTimeout(() => {
            if (!helpModal.classList.contains('show')) {
                helpModal.style.display = 'none';
            }
        }, 200);
    }
}

if (btnHelp) {
    btnHelp.addEventListener('click', () => toggleHelpModal(true));
}
if (btnCloseHelp) {
    btnCloseHelp.addEventListener('click', () => toggleHelpModal(false));
}
if (closeSpan) {
    closeSpan.addEventListener('click', () => toggleHelpModal(false));
}
if (helpModal) {
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) toggleHelpModal(false);
    });
}
// ==========================================
// SAVE / LOAD — حفظ وتحميل المشروع
// ==========================================
const PROJECT_VERSION = 1;

function serializeProject() {
    // نحوّل Map إلى مصفوفة عادية لتسلسل JSON
    const compsArr = [];
    for (const [, c] of components) {
        // ننسخ المكون مع تجاهل الحقول الديناميكية المؤقتة
        const safe = JSON.parse(JSON.stringify(c));
        delete safe._prevClk;
        delete safe._edgeProcessed;
        delete safe._dragStartX;
        delete safe._dragStartY;
        compsArr.push(safe);
    }
    const wiresArr = [];
    for (const [, w] of wires) {
        wiresArr.push(JSON.parse(JSON.stringify(w)));
    }
    return {
        version: PROJECT_VERSION,
        savedAt: new Date().toISOString(),
        designer: 'IC Circuit Simulator',
        components: compsArr,
        wires: wiresArr,
        viewport: { panX: wsPanX, panY: wsPanY, zoom: wsZoom },
        counters: { comp: compIdCounter, wire: wireIdCounter }
    };
}

function saveProjectToFile() {
    if (components.size === 0) {
        showToast(t('toast.empty'), 'warning');
        return;
    }
    const data = serializeProject();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `circuit-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    showToast(t('toast.saved'), 'success');
}

function loadProjectFromData(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.components)) {
        showToast(t('toast.invalidFile'), 'error');
        return false;
    }
    if (data.version && data.version > PROJECT_VERSION) {
        showToast(t('toast.fileNewer'), 'warning');
    }

    // إفراغ المساحة الحالية بدون تسجيل في التاريخ
    history.isRestoring = true;
    try {
        const allCompIds = Array.from(components.keys());
        const allWireIds = Array.from(wires.keys());
        allWireIds.forEach(id => deleteWire(id, true));
        // حذف المكونات القديمة أيضاً — بدونها تختلط الدائرة المحمّلة بالدائرة الحالية
        allCompIds.forEach(id => deleteComponent(id, true));
        showInfoPlaceholder();

        // استرجاع المكونات
        data.components.forEach(c => restoreComponent(c));
        // استرجاع الأسلاك
        if (Array.isArray(data.wires)) {
            data.wires.forEach(w => restoreWire(w));
        }
        // استرجاع العدّادات بحيث لا تتعارض المعرّفات الجديدة
        if (data.counters) {
            compIdCounter = Math.max(compIdCounter, data.counters.comp || 0);
            wireIdCounter = Math.max(wireIdCounter, data.counters.wire || 0);
        }
        // استرجاع العرض
        if (data.viewport) {
            wsPanX = Number.isFinite(data.viewport.panX) ? data.viewport.panX : 100;
            wsPanY = Number.isFinite(data.viewport.panY) ? data.viewport.panY : 50;
            wsZoom = data.viewport.zoom || 1;
            applyTransform();
        }

        // إعادة الحساب وإفراغ التاريخ
        history.undoStack = [];
        history.redoStack = [];
        history.updateUI();
        recomputeWireLanes();
        updateAllWires();
        simulate();
        showToast(t('toast.loaded'), 'success');
        return true;
    } catch (err) {
        console.error('Load error:', err);
        showToast(t('toast.loadFailed'), 'error');
        return false;
    } finally {
        history.isRestoring = false;
    }
}

function loadProjectFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload
 = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            loadProjectFromData(data);
        } catch (e) {
            showToast(t('toast.invalidJSON'), 'error');
        }
    };
    reader.onerror = () => showToast(t('toast.readFailed'), 'error');
    reader.readAsText(file);
}

const btnSave = document.getElementById('btn-save-project');
if (btnSave) btnSave.addEventListener('click', saveProjectToFile);

const btnLoad = document.getElementById('btn-load-project');
const fileLoadInput = document.getElementById('file-load-input');
if (btnLoad && fileLoadInput) {
    btnLoad.addEventListener('click', () => fileLoadInput.click());
    fileLoadInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) loadProjectFromFile(f);
        e.target.value = '';
    });
}

function setupBuildAreaVisual() {
    const buildBoundary = document.getElementById('build-area-boundary');
    if (buildBoundary) {
        buildBoundary.style.left = BUILD_AREA.x + 'px';
        buildBoundary.style.top = BUILD_AREA.y +
 'px';
        buildBoundary.style.width = BUILD_AREA.width + 'px';
        buildBoundary.style.height = BUILD_AREA.height + 'px';
    }
}
setupBuildAreaVisual();

// ==========================================
// EXAM MODE — وضع الاختبار
// ==========================================
// يخفي قائمة الأمثلة ومسميات الأطراف (على الرقاقات وفي لوحة المعلومات)
// ويُبقي أرقام الأطراف فقط، كما في الرقاقة الحقيقية.
// الإخفاء كله عبر CSS (class "exam-mode" على <body>) فلا حاجة لإعادة الرسم.
//   • الزر في الـ header يبدّل الوضع (الخروج يتطلب تأكيداً).
//   • فتح الموقع بـ ?exam=1 يفعّل الوضع ويقفله (يختفي زر الخروج).
const EXAM_LOCKED = new URLSearchParams(window.location.search).get('exam') === '1';
let examMode = EXAM_LOCKED;
if (!examMode) {
    try { examMode = localStorage.getItem('icsim-exam') === '1'; } catch (e) {}
}

function updateExamUI() {
    document.body.classList.toggle('exam-mode', examMode);
    const btn = document.getElementById('btn-exam-mode');
    if (btn) {
        btn.classList.toggle('active', examMode);
        btn.style.display = EXAM_LOCKED ? 'none' : '';
        const label = btn.querySelector('.exam-btn-label');
        if (label) {
            label.textContent = (examMode && examExitAt)
                ? t('header.examExiting').replace('{time}', examExitRemainingText())
                : t(examMode ? 'header.examExit' : 'header.exam');
        }
    }
    const badge = document.getElementById('exam-badge');
    if (badge) {
        badge.textContent = (examMode && examExitAt)
            ? t('exam.badgeExiting').replace('{time}', examExitRemainingText())
            : t('exam.badge');
    }
    // أغلق قائمة الأمثلة إن كانت مفتوحة
    if (examMode) {
        const dd = document.getElementById('dropdown-examples');
        if (dd) dd.classList.remove('open');
    }
}

function setExamMode(on) {
    if (EXAM_LOCKED && !on) return;
    examMode = !!on;
    clearExamExitCountdown();
    try { localStorage.setItem('icsim-exam', examMode ? '1' : '0'); } catch (e) {}
    updateExamUI();
    showToast(t(examMode ? 'toast.examOn' : 'toast.examOff'), examMode ? 'warning' : 'success');
}

// — مهلة الخروج: إطفاء وضع الاختبار لا يتم فوراً، بل بعد دقيقتين —
// خلال المهلة يبقى الوضع فعّالاً (المسميات والأمثلة مخفية) ويظهر عدّ تنازلي.
// وقت الانتهاء يُحفظ في localStorage، فإعادة تحميل الصفحة لا تتجاوز المهلة.
const EXAM_EXIT_DELAY_MS = 2 * 60 * 1000;
let examExitAt = 0;            // الطابع الزمني لانتهاء المهلة (0 = لا خروج معلّق)
let examExitTimer = null;

function examExitRemainingText() {
    const sec = Math.max(0, Math.ceil((examExitAt - Date.now()) / 1000));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}

function clearExamExitCountdown() {
    examExitAt = 0;
    if (examExitTimer) { clearInterval(examExitTimer); examExitTimer = null; }
    try { localStorage.removeItem('icsim-exam-exit-at'); } catch (e) {}
}

function examExitTick() {
    if (!examExitAt) return;
    if (Date.now() >= examExitAt) setExamMode(false);   // انتهت المهلة → خروج فعلي
    else updateExamUI();
}

function startExamExitCountdown(endAt) {
    if (EXAM_LOCKED) return;
    examExitAt = endAt || (Date.now() + EXAM_EXIT_DELAY_MS);
    try { localStorage.setItem('icsim-exam-exit-at', String(examExitAt)); } catch (e) {}
    if (examExitTimer) clearInterval(examExitTimer);
    examExitTimer = setInterval(examExitTick, 500);
    updateExamUI();
}

// استئناف مهلة بدأت قبل إعادة تحميل الصفحة
if (examMode && !EXAM_LOCKED) {
    let storedExitAt = 0;
    try { storedExitAt = parseInt(localStorage.getItem('icsim-exam-exit-at'), 10) || 0; } catch (e) {}
    if (storedExitAt) {
        // لا نقبل وقتاً أبعد من المهلة الكاملة (تغيير ساعة الجهاز)
        startExamExitCountdown(Math.min(storedExitAt, Date.now() + EXAM_EXIT_DELAY_MS));
        examExitTick();
    }
}

const btnExamMode = document.getElementById('btn-exam-mode');
if (btnExamMode) {
    btnExamMode.addEventListener('click', () => {
        if (!examMode) { setExamMode(true); return; }
        if (EXAM_LOCKED) return;   // الرابط المقفل: لا خروج إطلاقاً
        if (examExitAt) {
            // نقرة ثانية أثناء العدّ التنازلي = إلغاء الخروج والبقاء في الاختبار
            clearExamExitCountdown();
            updateExamUI();
            showToast(t('toast.examExitCancelled'), 'warning');
            return;
        }
        if (!window.confirm(t('exam.confirmExit'))) return;
        startExamExitCountdown();
        showToast(t('toast.examExitStarted'), 'warning');
    });
}

// حماية إضافية: حتى لو استُدعي زر مثال برمجياً، لا يُحمَّل في وضع الاختبار
const examplesMenuEl = document.getElementById('examples-menu');
if (examplesMenuEl) {
    examplesMenuEl.addEventListener('click', (e) => {
        if (examMode) { e.stopImmediatePropagation(); e.preventDefault(); }
    }, true);
}

const btnToggleLang = document.getElementById('btn-toggle-lang');
if (btnToggleLang) {
    btnToggleLang.addEventListener('click', toggleLanguage);
}
applyTranslations();

const btnHardRefresh = document.getElementById('btn-hard-refresh');
if (btnHardRefresh) {
    btnHardRefresh.addEventListener('click', () => {
        showToast('Refreshing...', 'info');
        setTimeout(hardRefreshApp, 300);
    });
}
