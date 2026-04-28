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
const APP_VERSION = '20250428-1';

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
        // ⚠️ ملاحظة: لا نمسح "icsim-exam-active" حتى يبقى نمط الاختبار مفعّلاً
        // بعد التحديث (هذا حماية ضد محاولة الطالب الخروج بـ refresh)
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
        'header.examples':      'Examples',
        'header.examples.tooltip': 'Load an example circuit',
        'header.clearAll':      'Clear All',
        'header.save.tooltip':  'Save circuit as JSON',
        'header.load.tooltip':  'Load circuit from JSON',
        'header.langToggle.tooltip': 'Switch language',
        'header.langToggle.label': 'العربية',     // النص داخل الزر يعرض اللغة المقابلة
        'header.refresh.tooltip': 'Force refresh from server (bypass cache)',
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
        'comp.switch.name':     'Toggle Switch',
        'comp.switch.desc':     'HIGH / LOW',
        'comp.dip.name':        'DIP Switch',
        'comp.dip.desc':        '4-Bit DIP Switch',
        'comp.push.name':       'Push Button',
        'comp.push.desc':       'Momentary Switch',
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

        // === Developer + Exam Mode ===
        'dev.loginTitle':       'Developer Login',
        'dev.username':         'Username',
        'dev.password':         'Password',
        'dev.welcome':          'Welcome, developer',
        'dev.wrongCreds':       'Wrong credentials',
        'dev.panelTitle':       'Developer Panel',
        'dev.panelHint':        'Set the password students must use to exit exam mode. Students enter exam mode with code 0000.',
        'dev.exitPassword':     'Exam exit password',
        'dev.entryHint':        'Students enter exam mode with code:',
        'dev.examStatus':       'Exam mode status',
        'dev.examInactive':     'inactive',
        'dev.examActive':       'Exam mode is currently ACTIVE',
        'dev.forceExit':        'End exam mode now',
        'dev.passwordRequired': 'Password required',
        'dev.passwordSaved':    'Exit password saved',
        'dev.saveFailed':       'Failed to save',
        'dev.cancel':           'Cancel',
        'dev.ok':               'OK',
        'dev.save':             'Save',
        'dev.close':            'Close',
        // === أداة hash ===
        'dev.changeDevPwd':     'Change developer password',
        'dev.changeDevPwdHint': 'Generate a hash for your new password, then paste it into app.js on GitHub mobile.',
        'dev.newDevPwd':        'New password',
        'dev.newDevPwdPh':      'Enter new password to hash',
        'dev.generateHash':     'Generate hash',
        'dev.hashResult':       'Hash result — copy this and paste into app.js',
        'dev.hashInstructions': 'Open app.js on GitHub mobile, find the line starting with "const DEV_PASSWORD_HASH", and replace the value between quotes with this hash. Commit, then press 🔄 in the app.',
        'dev.copy':             'Copy',
        'dev.copied':           'Copied to clipboard',
        'dev.copyManual':       'Select and copy manually',
        'dev.hashGenerated':    'Hash generated',
        'exam.enter':           'Exam',
        'exam.enterTooltip':    'Enter exam mode (code 0000)',
        'exam.entryTitle':      'Enter Exam Mode',
        'exam.entryCode':       'Entry code',
        'exam.wrongCode':       'Wrong entry code',
        'exam.alreadyActive':   'Exam mode is already active',
        'exam.entered':         'Exam mode activated',
        'exam.exited':          'Exam mode ended',
        'exam.wrongPassword':   'Wrong password',
        'exam.exitTitle':       'Exit exam mode',
        'exam.enterPassword':   'Enter exit password',
        'exam.cantClear':       'Cannot clear during exam mode',
        'exam.cantLoad':        'Cannot load during exam mode',
        'exam.cantUseExamples': 'Examples are disabled in exam mode',
        'exam.exit':            'Exit Exam',
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
        'header.examples':      'أمثلة',
        'header.examples.tooltip': 'تحميل دائرة مثال',
        'header.clearAll':      'مسح الكل',
        'header.save.tooltip':  'حفظ الدائرة كـ JSON',
        'header.load.tooltip':  'تحميل دائرة من JSON',
        'header.langToggle.tooltip': 'تبديل اللغة',
        'header.langToggle.label': 'English',
        'header.refresh.tooltip': 'تحديث قسري من الخادم (تجاوز الكاش)',
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
        'comp.switch.name':     'مفتاح ثنائي',
        'comp.switch.desc':     'HIGH / LOW',
        'comp.dip.name':        'مفتاح DIP',
        'comp.dip.desc':        'مفتاح DIP رباعي',
        'comp.push.name':       'زر ضاغط',
        'comp.push.desc':       'مفتاح لحظي',
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

        // === Developer + Exam Mode ===
        'dev.loginTitle':       'تسجيل دخول المطوّر',
        'dev.username':         'اسم المستخدم',
        'dev.password':         'كلمة المرور',
        'dev.welcome':          'مرحباً بك أيها المطوّر',
        'dev.wrongCreds':       'بيانات غير صحيحة',
        'dev.panelTitle':       'لوحة المطوّر',
        'dev.panelHint':        'حدّد كلمة المرور التي يحتاجها الطلاب للخروج من نمط الاختبار. الطلاب يدخلون نمط الاختبار برمز 0000.',
        'dev.exitPassword':     'كلمة مرور خروج الاختبار',
        'dev.entryHint':        'يدخل الطلاب نمط الاختبار بالرمز:',
        'dev.examStatus':       'حالة نمط الاختبار',
        'dev.examInactive':     'غير مفعّل',
        'dev.examActive':       'نمط الاختبار مُفعّل حالياً',
        'dev.forceExit':        'إنهاء نمط الاختبار فوراً',
        'dev.passwordRequired': 'كلمة المرور مطلوبة',
        'dev.passwordSaved':    'تم حفظ كلمة مرور الخروج',
        'dev.saveFailed':       'فشل الحفظ',
        'dev.cancel':           'إلغاء',
        'dev.ok':               'موافق',
        'dev.save':             'حفظ',
        'dev.close':            'إغلاق',
        // === أداة hash ===
        'dev.changeDevPwd':     'تغيير كلمة مرور المطوّر',
        'dev.changeDevPwdHint': 'ولّد بصمة (hash) لكلمة المرور الجديدة، ثم الصقها في app.js على GitHub من هاتفك.',
        'dev.newDevPwd':        'كلمة المرور الجديدة',
        'dev.newDevPwdPh':      'أدخل كلمة المرور الجديدة',
        'dev.generateHash':     'توليد البصمة',
        'dev.hashResult':       'البصمة — انسخها والصقها في app.js',
        'dev.hashInstructions': 'افتح app.js على GitHub من هاتفك، ابحث عن السطر "const DEV_PASSWORD_HASH"، واستبدل القيمة داخل علامتَي الاقتباس بهذه البصمة. ثم Commit، ثم اضغط 🔄 في التطبيق.',
        'dev.copy':             'نسخ',
        'dev.copied':           'تم النسخ',
        'dev.copyManual':       'حدّد وانسخ يدوياً',
        'dev.hashGenerated':    'تم توليد البصمة',
        'exam.enter':           'اختبار',
        'exam.enterTooltip':    'دخول نمط الاختبار (الرمز 0000)',
        'exam.entryTitle':      'الدخول إلى نمط الاختبار',
        'exam.entryCode':       'رمز الدخول',
        'exam.wrongCode':       'رمز الدخول خاطئ',
        'exam.alreadyActive':   'نمط الاختبار مُفعّل بالفعل',
        'exam.entered':         'تم تفعيل نمط الاختبار',
        'exam.exited':          'تم إنهاء نمط الاختبار',
        'exam.wrongPassword':   'كلمة المرور خاطئة',
        'exam.exitTitle':       'الخروج من نمط الاختبار',
        'exam.enterPassword':   'أدخل كلمة مرور الخروج',
        'exam.cantClear':       'لا يمكن المسح في نمط الاختبار',
        'exam.cantLoad':        'لا يمكن التحميل في نمط الاختبار',
        'exam.cantUseExamples': 'الأمثلة معطّلة في نمط الاختبار',
        'exam.exit':            'خروج من الاختبار',
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
        evaluate(pinStates) {
            const g = (p) => pinStates[p] || 0;
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
            const g = (p) => pinStates[p] || 0;
            const pin2Grounded = isPinGrounded(comp, 2, nets);
            const pin4Grounded = isPinGrounded(comp, 4, nets);
            const pin3High = g(3) === 1;

            if (!pin2Grounded || !pin3High || !pin4Grounded) {
                return { 5: 0, 6: 0, 7: 0 };
            }

            const A = [g(10), g(12), g(13), g(15)];
            const B = [g(9), g(11), g(14), g(1)];

            for (let i = 3; i >= 0; i--) {
                if (A[i] > B[i]) return { 5: 1, 6: 0, 7: 0 };
                if (A[i] < B[i]) return { 5: 0, 6: 0, 7: 1 };
            }
            return { 5: 0, 6: 1, 7: 0 };
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
        evaluate(pinStates) {
            const g = (p) => pinStates[p] || 0;
            // BCD inputs per datasheet: A=pin7 (LSB), B=pin1, C=pin2, D=pin6 (MSB)
            const A = g(7), B = g(1), C = g(2), D = g(6);
            const bcd = A + B * 2 + C * 4 + D * 8;

            // Auxiliary inputs (active LOW): pin 4 = BI̅, pin 3 = LT̅, pin 5 = RBI̅
            if (g(4) === 0) return { 13: 1, 12: 1, 11: 1, 10: 1, 9: 1, 15: 1, 14: 1 }; // BI̅=0 → blank
            if (g(3) === 0) return { 13: 0, 12: 0, 11: 0, 10: 0, 9: 0, 15: 0, 14: 0 }; // LT̅=0 → all segments
            if (g(5) === 0 && bcd === 0) return { 13: 1, 12: 1, 11: 1, 10: 1, 9: 1, 15: 1, 14: 1 }; // RBI̅=0 & BCD=0 → blank

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
            const g = (p) => pinStates[p] || 0;
            if (comp.counterValue === undefined) comp.counterValue = 0;
            if (!comp._prevClk) comp._prevClk = { up: 0, dn: 0 };

            // CPU=Pin5, CPD=Pin4, MR=Pin14, PL=Pin11 (active LOW)
            const CPU = g(5), CPD = g(4), MR = g(14), PL = g(11);

            if (MR === 1) {
                // Master Reset (active HIGH) — يصفّر العدّاد
                comp.counterValue = 0;
            } else if (PL === 0) {
                // Parallel Load (active LOW) — يحمّل P0..P3
                comp.counterValue = g(15) + g(1) * 2 + g(10) * 4 + g(9) * 8;
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
            // TCU = LOW عند العد إلى 15 و CPU=1
            // TCD = LOW عند العد إلى 0  و CPD=1
            const TCU = (v === 15 && CPU === 1) ? 0 : 1;
            const TCD = (v === 0 && CPD === 1) ? 0 : 1;

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
                ['Q = 1111, CPU = 1', 'TCU = 0 (Carry)'],
                ['Q = 0000, CPD = 1', 'TCD = 0 (Borrow)']
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
            const g = (p) => pinStates[p] || 0;

            if (comp.timerState === undefined) {
                comp.timerState = {
                    output: 0,
                    discharge: 0,
                    lastTrigger: 0,
                    lastThreshold: 0
                };
            }

            const state = comp.timerState;
            const reset = g(4);
            const trigger = g(2);
            const threshold = g(6);

            if (reset === 0) {
                state.output = 0;
                state.discharge = 0;
                return { 3: 0, 7: 0 };
            }

            if (trigger === 0) {
                state.output = 1;
                state.discharge = 0;
            } else if (threshold === 1) {
                state.output = 0;
                state.discharge = 1;
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
        const action = this.undoStack.pop();
        this.redoStack.push(action);
        this.isRestoring = true;
        this.apply(action, true);
        this.isRestoring = false;
        this.updateUI();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const action = this.redoStack.pop();
        this.undoStack.push(action);
        this.isRestoring = true;
        this.apply(action, false);
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
        dir = pinNum === 1 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };
    } else if (comp.type === 'PUSH_BUTTON') {
        dir = pinNum === 1 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };
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
    if (comp.type === 'SWITCH' || comp.type === 'PUSH_BUTTON') return 12;
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
        comp.state = 0;
        comp.pinStates = { 1: 0 };
    } else if (type === 'PUSH_BUTTON') {
        comp.state = 0;
        comp.pinStates = { 1: 0, 2: 0 };
    } else if (type === 'DIP_SWITCH') {
        comp.state = [0, 0, 0, 0];
        comp.pinStates = { 1: 0, 2: 0, 3: 0, 4: 0 };
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
        comp.voltage = '5V';
        comp.pinStates = { 1: 1 };
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
        <div class="switch-pin" data-comp="${comp.id}" data-pin="2">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="2"></div>
        </div>
    `;
}

function renderPushButton(el, comp) {
    el.classList.add('push-button-component');
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
    el.innerHTML = `
        <div class="vcc-symbol">+${comp.voltage || '5V'}</div>
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

    if (comp.type === 'SWITCH') {
        const body = el.querySelector('.switch-body');
        if (body) body.classList.toggle('on', !!comp.state);
    } else if (comp.type === 'PUSH_BUTTON') {
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
        el.classList.toggle('unpowered', !powered);
    }

    const dots = el.querySelectorAll('.pin-dot');
    dots.forEach(dot => {
        const pinNum = parseInt(dot.dataset.pin);
        const val = comp.pinStates[pinNum] || 0;
        dot.classList.toggle('high', !!val);
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

// ==========================================
// SIMULATION ENGINE
// ==========================================
function simulate() {
    const nets = buildNets();

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

    for (let iter = 0; iter < 20; iter++) {
        let changed = false;

        for (const net of nets) {
            let value = 0;
            for (const pin of net) {
                const comp = components.get(pin.comp);
                if (!comp) continue;
                if (comp.type === 'VCC') {
                    value = 1;
                } else if (comp.type === 'GND') {
                    // value stays 0
                } else if (comp.type === 'RESISTOR' || comp.type === 'CAPACITOR' || comp.type === 'SWITCH' || comp.type === 'PUSH_BUTTON') {
                    const otherPin = pin.pin === 1 ? 2 : 1;
                    value = value || (comp.pinStates[otherPin] || 0);
                } else if (comp.type === 'DIP_SWITCH') {
                    const pairs = { 1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 };
                    const otherPin = pairs[pin.pin];
                    if (otherPin) {
                        value = value || (comp.pinStates[otherPin] || 0);
                    }
                } else if (isICType(comp.type)) {
                    const def = IC_DEFINITIONS[comp.type];
                    const pinDef = def.pins.find(p => p.num === pin.pin);
                    if (pinDef && pinDef.type === 'output') {
                        value = value || (comp.pinStates[pin.pin] || 0);
                    }
                }
            }

            for (const pin of net) {
                const comp = components.get(pin.comp);
                if (!comp) continue;
                if (comp.type === 'LED') {
                    if (comp.pinStates[1] !== value) { comp.pinStates[1] = value; changed = true; }
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
                } else if (comp.type === 'RESISTOR' || comp.type === 'CAPACITOR') {
                    if (comp.pinStates[pin.pin] !== value) { comp.pinStates[pin.pin] = value; changed = true; }
                } else if (isICType(comp.type)) {
                    const def = IC_DEFINITIONS[comp.type];
                    const pinDef = def.pins.find(p => p.num === pin.pin);
                    if (pinDef && (pinDef.type === 'input' || pinDef.type === 'power')) {
                        if (comp.pinStates[pin.pin] !== value) {
                            comp.pinStates[pin.pin] = value;
                            changed = true;
                        }
                    }
                }
            }
        }

        for (const [, comp] of components) {
            if (isICType(comp.type)) {
                if (!isICPowered(comp)) {
                    const def = IC_DEFINITIONS[comp.type];
                    def.pins.forEach(p => {
                        if (p.type === 'output' && comp.pinStates[p.num] !== 0) {
                            comp.pinStates[p.num] = 0;
                            changed = true;
                        }
                    });
                    continue;
                }
                const def = IC_DEFINITIONS[comp.type];
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

    for (const [, wire] of wires) {
        const fromComp = components.get(wire.from.comp);
        const toComp = components.get(wire.to.comp);
        let active = false;

        if (fromComp) {
            if (fromComp.type === 'VCC') active = true;
            else if (fromComp.type === 'SWITCH') active = !!fromComp.state;
            else active = !!(fromComp.pinStates[wire.from.pin]);
        }
        if (toComp && !active) {
            if (toComp.type === 'VCC') active = true;
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

    for (const [, wire] of wires) {
        merge(wire.from.comp, wire.from.pin, wire.to.comp, wire.to.pin);
    }

    for (const [id, comp] of components) {
        if (comp.type === 'SWITCH') {
            if (comp.state) merge(id, 1, id, 2);
        } else if (comp.type === 'PUSH_BUTTON') {
            if (comp.state) merge(id, 1, id, 2);
        } else if (comp.type === 'DIP_SWITCH') {
            const states = comp.state;
            for (let i = 0; i < 4; i++) {
                if (states[i]) {
                    merge(id, i + 1, id, 8 - i);
                }
            }
        }
    }

    return nets.filter(n => n.length > 0);
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
            <div class="info-title">مفتاح تبديل</div>
            <div class="info-subtitle">Toggle Switch — ${comp.state ? 'HIGH (1)' : 'LOW (0)'}</div>
            <div class="info-section">
                <div class="info-section-title">الحالة</div>
                <p style="color: ${comp.state ? 'var(--high)' : 'var(--text-muted)'}; font-size:18px; font-weight:700; text-align:center; padding:10px;">
                    ${comp.state ? '⬤ HIGH (1)' : '○ LOW (0)'}
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">الاستخدام</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    انقر على المفتاح لتبديل الحالة بين HIGH و LOW. قم بتوصيل المخرج بمدخل IC عبر سلك.
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
                    <span class="pin-state-name">Pin ${p.num} (${escapeHTML(p.name)})</span>
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
            <div class="info-section">
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
                <span class="pin-state-name">Pin ${p.num} (${nameDisplay})</span>
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
        <div class="info-section">
            <div class="info-section-title">${t('info.section.pinout')}</div>
            <div class="pinout-diagram">${escapeHTML(def.pinout)}</div>
        </div>
        <div class="info-section">
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
        extraInfo.className = 'info-section';
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
                <span class="pin-state-name">Pin ${p.num} (${nameDisplay})</span>
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
    btn.addEventListener('click', () => {
        setTool(btn.dataset.tool);
    });
});

function setTool(tool) {
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

    wsContainer.dataset.toolLabel = '';
    const toolNames = { select: 'اختيار', wire: 'سلك', delete: 'حذف', 'cut-wire': 'قطع سلك' };
    if (tool !== 'select') wsContainer.dataset.toolLabel = toolNames[tool] || tool;

    statusTool.textContent = `🔧 الأداة: ${toolNames[tool] || tool}`;
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
    else if (type === 'SWITCH') tempComp.state = 0;
    else if (type === 'LED') { tempComp.state = 0; tempComp.color = 'red'; }
    else if (type === 'VCC') tempComp.voltage = '5V';
    else if (type === 'RESISTOR') tempComp.resistance = 330;
    else if (type === 'CAPACITOR') tempComp.capacitance = '100nF';

    ghostPreview = document.createElement('div');
    ghostPreview.className = 'component ghost-preview';
    ghostPreview.style.position = 'absolute';
    ghostPreview.style.pointerEvents = 'none';
    ghostPreview.style.opacity = '0.45';
    ghostPreview.style.zIndex = '1000';
    ghostPreview.style.filter = 'blur(0.5px)';

    if (isICType(type)) renderIC(ghostPreview, tempComp);
    else if (type === 'SWITCH') {
        ghostPreview.classList.add('switch-component');
        ghostPreview.innerHTML = '<div class="switch-body"><div class="switch-track"><div class="switch-knob"></div></div><span class="switch-label">OFF</span></div>';
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
                comp.pinStates[1] = comp.state;
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
                simulate();
                updateComponentVisuals(comp);
                const releaseHandler = () => {
                    comp.state = 0;
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

document.getElementById('btn-zoom-fit').addEventListener('click', () => {
    wsZoom = 1;
    wsPanX = 0;
    wsPanY = 0;
    applyTransform();
    updateAllWires();
});

function applyTransform() {
    workspace.style.transform = `translate(${wsPanX}px, ${wsPanY}px) scale(${wsZoom})`;
    zoomLevelText.textContent = Math.round(wsZoom * 100) + '%';
}

document.getElementById('btn-zoom-out').addEventListener('click', () => {
    wsZoom = Math.max(0.3, wsZoom - 0.15);
    applyTransform();
    updateAllWires();
});

document.getElementById('btn-zoom-fit').addEventListener('click', () => {
    wsZoom = 1;
    // Center the workspace on the buildable area when fitting
    wsPanX = 100;
    wsPanY = 50;
    applyTransform();
    updateAllWires();
});

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
            extraOptions = `<div class="context-menu-item" data-action="voltage">⚡ تغيير الجهد (${comp.voltage || '5V'})</div>`;
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

            if (action === 'voltage') {
                const volts = ['5V', '3.3V', '12V'];
                const currIdx = volts.indexOf(comp.voltage || '5V');
                const oldVal = comp.voltage || '5V';
                const newVal = volts[(currIdx + 1) % volts.length];

                comp.voltage = newVal;
                history.push({
                    type: 'PROP_CHANGE',
                    data: { id: comp.id, key: 'voltage', oldVal: oldVal, newVal: newVal }
                });

                renderComponent(comp);
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
});

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
    if (examMode) { showToast('⚠️ ' + t('exam.cantUseExamples', 'Examples are disabled in exam mode'), 'warning'); return; }
    clearAll();
    // المكونات: 2 مفاتيح → IC AND → مقاومة → LED → GND. VCC في الأعلى.
    const sw1 = createComponent('SWITCH',   200, 220);
    const sw2 = createComponent('SWITCH',   200, 320);
    const ic  = createComponent('IC7408',   460, 230);
    const res = createComponent('RESISTOR', 740, 270);
    const led = createComponent('LED',      900, 270);
    const vcc = createComponent('VCC',      640, 100);
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
    if (examMode) { showToast('⚠️ ' + t('exam.cantUseExamples', 'Examples are disabled in exam mode'), 'warning'); return; }
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
    const vccIC    = createComponent('VCC', 760, 100);   // VCC للـ IC
    const vccDip   = createComponent('VCC', 360, 380);   // VCC تغذية مفاتيح DIP
    const vccCasc  = createComponent('VCC', 460, 700);   // cascade A=B input HIGH
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
    if (examMode) { showToast('⚠️ ' + t('exam.cantUseExamples', 'Examples are disabled in exam mode'), 'warning'); return; }
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
    const vccIC    = createComponent('VCC', 700, 100);
    const vccSeg   = createComponent('VCC', 950, 100);
    const vccCtrl  = createComponent('VCC', 320, 580);
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
    if (examMode) { showToast('⚠️ ' + t('exam.cantUseExamples', 'Examples are disabled in exam mode'), 'warning'); return; }
    clearAll();
    // — مذبذب astable: R1, R2, C يحدّدون التردد. الخرج (pin 3) → LED —
    const timer = createComponent('IC555', 500, 280);

    // R1 و R2 على شكل تسلسل بين VCC و الأرضي
    const r1 = createComponent('RESISTOR', 320, 180);
    r1.resistance = 1000;
    const r2 = createComponent('RESISTOR', 600, 180);
    r2.resistance = 10000;

    const cap = createComponent('CAPACITOR', 500, 460);

    // مقاومة الحماية + LED على المخرج
    const outRes = createComponent('RESISTOR', 760, 290);
    outRes.resistance = 330;
    const led = createComponent('LED', 940, 290);
    led.color = 'red';
    renderComponent(led);

    const vcc = createComponent('VCC', 500, 80);
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
        allCompIds.forEach(id => deleteComponent(id, true));
        const allWireIds = Array.from(wires.keys());
        allWireIds.forEach(id => deleteWire(id, true));

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
            wsPanX = data.viewport.panX || 100;
            wsPanY = data.viewport.panY || 50;
            wsZoom = data.viewport.zoom || 1;
            applyTransform();
        }

        // إعادة الحساب وإفراغ التاريخ
        history.undoStack = [];
        history.redoStack = [];
        history.updateUI();
        recomputeWireLanes();             // وزّع الأسلاك على lanes بعد التحميل
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
    reader.onload = (ev) => {
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

// ربط الأزرار
const btnSaveProject = document.getElementById('btn-save-project');
const btnLoadProject = document.getElementById('btn-load-project');
const fileLoadInput = document.getElementById('file-load-input');

if (btnSaveProject) {
    btnSaveProject.addEventListener('click', saveProjectToFile);
}
if (btnLoadProject && fileLoadInput) {
    btnLoadProject.addEventListener('click', () => fileLoadInput.click());
    fileLoadInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) loadProjectFromFile(file);
        e.target.value = ''; // السماح بإعادة تحميل نفس الملف
    });
}

// ==========================================
// BUILD AREA VISUAL — رسم حدود منطقة البناء
// ==========================================
function setupBuildAreaVisual() {
    const buildBoundary = document.getElementById('build-area-boundary');
    if (buildBoundary) {
        buildBoundary.style.left = BUILD_AREA.x + 'px';
        buildBoundary.style.top = BUILD_AREA.y + 'px';
        buildBoundary.style.width = BUILD_AREA.width + 'px';
        buildBoundary.style.height = BUILD_AREA.height + 'px';
    }
}
setupBuildAreaVisual();

// ==========================================
// LANGUAGE TOGGLE — ربط زر تبديل اللغة
// ==========================================
const btnToggleLang = document.getElementById('btn-toggle-lang');
if (btnToggleLang) {
    btnToggleLang.addEventListener('click', toggleLanguage);
}
// تطبيق الترجمة على كل العناصر عند تحميل الصفحة (بناءً على اللغة المحفوظة)
applyTranslations();

// ============================================================
// DEVELOPER MODE + EXAM MODE — مود المطور ونمط الاختبار
// ============================================================
// ============================================================
// EXAM MODE + DEVELOPER MODE — نمط الاختبار + مود المطور
// ============================================================
// التصميم البسيط:
//   • الدخول إلى نمط الاختبار: رمز ثابت "0000" — متاح لأي مستخدم
//     (زر في الـ header). نمط الاختبار يخفي أسماء الأطراف فقط.
//   • الخروج: كلمة مرور يحدّدها المطوّر (تُحفظ في localStorage)
//     افتراضياً "admin" حتى يغيّرها المطور.
//   • مود المطوّر: Ctrl+Shift+D، username=ahmad، password=102030405060
//     يُتيح تعديل كلمة مرور خروج الاختبار + إنهاءه فوراً.
//   • التقييم التلقائي للأسلاك مُعطّل حالياً (سيُضاف لاحقاً).

const DEV_USERNAME = 'ahmad';

// ============================================================
// كلمة مرور المطور — مُخزّنة كـ SHA-256 hash، ليست نصّاً صريحاً
// ============================================================
// لتحديث كلمة المرور:
//   1. ادخل التطبيق → اضغط زر 🔑 المخفي في لوحة المطور
//   2. أدخل كلمة المرور الجديدة → احصل على الـ hash
//   3. افتح GitHub على هاتفك → app.js → edit ✏️ → استبدل القيمة أسفل
//   4. Commit & wait — انتظر ~10 ثوانٍ، اضغط 🔄 في التطبيق
//
// كلمة المرور الحالية: 102030405060
const DEV_HASH_SALT = 'icsim-dev-2025';                                          // ثابت — لا تغيّره
const DEV_PASSWORD_HASH = '90cfb849a2dbcca653eef606789f2faf3cc15883c3c456b18ea35103d8809002';

// — حساب SHA-256 hash لأيّ نصّ —
async function sha256Hex(text) {
    const buf = new TextEncoder().encode(text);
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

// — التحقّق من كلمة المرور (async لأن SHA-256 async في المتصفح) —
async function verifyDevPassword(input) {
    const h = await sha256Hex(DEV_HASH_SALT + (input || ''));
    return h === DEV_PASSWORD_HASH;
}

// — توليد hash لكلمة مرور جديدة (للمطوّر، ليكتبها في GitHub) —
async function generatePasswordHash(newPwd) {
    return await sha256Hex(DEV_HASH_SALT + (newPwd || ''));
}

// ============================================================
// تشويش (obfuscation) لكلمة مرور خروج الاختبار في localStorage
// ============================================================
// السبب: لو حفظنا "admin" نصاً صريحاً، أي طالب يفتح F12 →
// Application → LocalStorage يراها فوراً. التشويش يخفيها عن
// النظر السريع. ليس أمناً حقيقياً (يمكن فكّه بقراءة الكود)
// لكنه كافٍ لمنع الكشف العفوي.
const EXAM_OBFUSCATE_KEY = 'icsim-2025-exam-x9';

function _obfuscate(text) {
    let xored = '';
    for (let i = 0; i < text.length; i++) {
        xored += String.fromCharCode(
            text.charCodeAt(i) ^ EXAM_OBFUSCATE_KEY.charCodeAt(i % EXAM_OBFUSCATE_KEY.length)
        );
    }
    // base64 لجعل الناتج آمن للتخزين كنصّ
    try { return btoa(unescape(encodeURIComponent(xored))); } catch (e) { return null; }
}

function _deobfuscate(encoded) {
    try {
        const xored = decodeURIComponent(escape(atob(encoded)));
        let result = '';
        for (let i = 0; i < xored.length; i++) {
            result += String.fromCharCode(
                xored.charCodeAt(i) ^ EXAM_OBFUSCATE_KEY.charCodeAt(i % EXAM_OBFUSCATE_KEY.length)
            );
        }
        return result;
    } catch (e) {
        return null;
    }
}

const EXAM_ENTRY_CODE = '0000';                   // ثابت — للدخول السريع
const EXAM_DEFAULT_EXIT_PWD = 'admin';            // افتراضي حتى يعدّله المطور
const LS_KEY_EXAM_EXIT_PWD = 'icsim-exam-exit-pwd';
const LS_KEY_EXAM_ACTIVE  = 'icsim-exam-active';  // حالة نمط الاختبار (يبقى بعد التحديث)

let examMode = false;

// === حفظ/استعادة حالة نمط الاختبار في localStorage ===
// السبب: نريد أن يبقى نمط الاختبار مفعّلاً حتى لو حدّث الطالب الصفحة (F5)
// أو أغلق المتصفح وأعاد فتحه. الخروج فقط بكلمة المرور.
function persistExamModeState() {
    try {
        if (examMode) {
            localStorage.setItem(LS_KEY_EXAM_ACTIVE, '1');
        } else {
            localStorage.removeItem(LS_KEY_EXAM_ACTIVE);
        }
    } catch (e) { /* localStorage معطّل */ }
}

function isExamModePersisted() {
    try {
        return localStorage.getItem(LS_KEY_EXAM_ACTIVE) === '1';
    } catch (e) { return false; }
}

// كلمة مرور الخروج: تُقرأ من localStorage (يحدّدها المطور)، أو القيمة الافتراضية
// تُخزَّن مشوَّشة لإخفائها عن من يفتح localStorage في DevTools
const EXAM_PWD_OBF_PREFIX = 'obf:';

function getExamExitPassword() {
    try {
        const saved = localStorage.getItem(LS_KEY_EXAM_EXIT_PWD);
        if (!saved) return EXAM_DEFAULT_EXIT_PWD;
        // الصيغة الجديدة (مشوَّشة): obf:base64...
        if (saved.startsWith(EXAM_PWD_OBF_PREFIX)) {
            const decoded = _deobfuscate(saved.slice(EXAM_PWD_OBF_PREFIX.length));
            if (decoded && decoded.length > 0) return decoded;
        } else {
            // ترحيل البيانات القديمة (نصّ صريح): أعد كتابتها مشوَّشة
            if (saved.length > 0) {
                setExamExitPassword(saved);
                return saved;
            }
        }
    } catch (e) { /* localStorage معطّل */ }
    return EXAM_DEFAULT_EXIT_PWD;
}

function setExamExitPassword(newPwd) {
    if (!newPwd || newPwd.length < 1) return false;
    try {
        const obf = _obfuscate(newPwd);
        if (!obf) return false;
        localStorage.setItem(LS_KEY_EXAM_EXIT_PWD, EXAM_PWD_OBF_PREFIX + obf);
        return true;
    } catch (e) {
        return false;
    }
}

// ===== الدخول إلى نمط الاختبار (للجميع برمز 0000) =====
function enterExamMode() {
    examMode = true;
    document.body.classList.add('exam-mode');
    persistExamModeState();                         // ← يبقى بعد التحديث
    const btnExitExam = document.getElementById('btn-exit-exam');
    if (btnExitExam) btnExitExam.style.display = '';
    showToast('📝 ' + t('exam.entered', 'Exam mode activated'), 'success');
    return true;
}

// ===== الخروج (يتطلّب كلمة مرور المطور) =====
function exitExamMode(password) {
    const correct = getExamExitPassword();
    if (password !== correct) {
        showToast('❌ ' + t('exam.wrongPassword', 'Wrong password'), 'error');
        return false;
    }
    examMode = false;
    document.body.classList.remove('exam-mode');
    persistExamModeState();                         // ← يُمسح من localStorage
    const btnExitExam = document.getElementById('btn-exit-exam');
    if (btnExitExam) btnExitExam.style.display = 'none';
    showToast('✅ ' + t('exam.exited', 'Exam mode ended'), 'success');
    return true;
}

// ===== إنهاء فوري بدون كلمة مرور (للمطوّر فقط، من لوحته) =====
function forceExitExamMode() {
    examMode = false;
    document.body.classList.remove('exam-mode');
    persistExamModeState();                         // ← يُمسح من localStorage
    const btnExitExam = document.getElementById('btn-exit-exam');
    if (btnExitExam) btnExitExam.style.display = 'none';
    showToast('✅ ' + t('exam.exited', 'Exam mode ended'), 'success');
}

// ===== استعادة الحالة عند تحميل الصفحة =====
// تُستدعى بعد جاهزية الـ DOM، تستعيد نمط الاختبار إذا كان مفعّلاً قبل التحديث
function restoreExamModeIfPersisted() {
    if (!isExamModePersisted()) return;
    examMode = true;
    document.body.classList.add('exam-mode');
    const btnExitExam = document.getElementById('btn-exit-exam');
    if (btnExitExam) btnExitExam.style.display = '';
    // لا نعرض toast — الطالب يعرف أنه في نمط الاختبار
}

// ============================================================
// MODAL HELPERS — لتسجيل الدخول وإدخال كلمات المرور
// ============================================================
function showPromptModal({ title, fields, onConfirm, onCancel }) {
    // fields = [{ name, label, type, value? }, ...]
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay dev-modal-overlay';
    overlay.innerHTML = `
        <div class="modal-content dev-modal" role="dialog" aria-modal="true">
            <div class="modal-header">
                <h3>${escapeHTML(title)}</h3>
                <span class="close-modal" data-action="cancel">&times;</span>
            </div>
            <div class="modal-body dev-modal-body">
                ${fields.map(f => `
                    <label class="dev-field">
                        <span>${escapeHTML(f.label)}</span>
                        <input type="${f.type || 'text'}" name="${escapeHTML(f.name)}"
                               value="${escapeHTML(f.value || '')}" autocomplete="off">
                    </label>
                `).join('')}
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-secondary" data-action="cancel">${escapeHTML(t('dev.cancel', 'Cancel'))}</button>
                <button class="modal-btn modal-btn-primary" data-action="confirm">${escapeHTML(t('dev.ok', 'OK'))}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    const getValues = () => {
        const out = {};
        overlay.querySelectorAll('input').forEach(i => out[i.name] = i.value);
        return out;
    };

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { close(); if (onCancel) onCancel(); }
        const action = e.target.dataset.action;
        if (action === 'cancel') { close(); if (onCancel) onCancel(); }
        if (action === 'confirm') {
            const v = getValues();
            close();
            if (onConfirm) onConfirm(v);
        }
    });
    overlay.querySelector('input')?.focus();
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); const v = getValues(); close(); if (onConfirm) onConfirm(v); }
        if (e.key === 'Escape') { close(); if (onCancel) onCancel(); }
    });
}

// ============================================================
// DEVELOPER LOGIN + PANEL
// ============================================================
function showDevLogin() {
    showPromptModal({
        title: t('dev.loginTitle', 'Developer Login'),
        fields: [
            { name: 'username', label: t('dev.username', 'Username') },
            { name: 'password', label: t('dev.password', 'Password'), type: 'password' }
        ],
        onConfirm: async (vals) => {
            // التحقّق: اسم المستخدم مطابق + hash كلمة المرور مطابق
            const usernameOK = (vals.username || '').trim() === DEV_USERNAME;
            const passwordOK = await verifyDevPassword(vals.password);
            if (usernameOK && passwordOK) {
                showToast('✅ ' + t('dev.welcome', 'Welcome, developer'), 'success');
                showDevPanel();
            } else {
                showToast('❌ ' + t('dev.wrongCreds', 'Wrong credentials'), 'error');
            }
        }
    });
}

function showDevPanel() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay dev-modal-overlay';
    const isExamActive = examMode;
    const currentExitPwd = getExamExitPassword();
    overlay.innerHTML = `
        <div class="modal-content dev-modal">
            <div class="modal-header">
                <h3>🛠️ ${escapeHTML(t('dev.panelTitle', 'Developer Panel'))}</h3>
                <span class="close-modal" data-action="close">&times;</span>
            </div>
            <div class="modal-body dev-modal-body">
                <p style="margin:0 0 8px; font-size:13px; color:var(--text-secondary);">
                    ${escapeHTML(t('dev.panelHint', 'Set the password students must use to exit exam mode. Students enter exam mode with code 0000.'))}
                </p>

                <!-- إعداد كلمة مرور الخروج -->
                <label class="dev-field">
                    <span>${escapeHTML(t('dev.exitPassword', 'Exam exit password'))}</span>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <input type="text" id="dev-exit-pwd-input" value="${escapeHTML(currentExitPwd)}"
                               style="flex:1;" autocomplete="off">
                        <button class="modal-btn modal-btn-primary" data-action="save-pwd" style="padding:6px 14px;">
                            💾 ${escapeHTML(t('dev.save', 'Save'))}
                        </button>
                    </div>
                </label>
                <p class="dev-warn" style="margin-top:-4px;">
                    ${escapeHTML(t('dev.entryHint', 'Students enter exam mode with code:'))} <b>${EXAM_ENTRY_CODE}</b>
                </p>

                <!-- حالة نمط الاختبار -->
                ${isExamActive ? `
                    <div class="dev-status-active">
                        ⚠️ ${escapeHTML(t('dev.examActive', 'Exam mode is currently ACTIVE'))}
                    </div>
                    <button class="modal-btn modal-btn-danger" data-action="force-exit">
                        🛑 ${escapeHTML(t('dev.forceExit', 'End exam mode now'))}
                    </button>
                ` : `
                    <div class="dev-info-row">
                        <span>${escapeHTML(t('dev.examStatus', 'Exam mode status'))}</span>
                        <span style="color:var(--text-muted);">${escapeHTML(t('dev.examInactive', 'inactive'))}</span>
                    </div>
                `}

                <!-- ============================================ -->
                <!-- أداة توليد Hash لكلمة مرور المطور الجديدة     -->
                <!-- ============================================ -->
                <div class="dev-section-divider"></div>
                <div class="dev-section-title">🔑 ${escapeHTML(t('dev.changeDevPwd', 'Change developer password'))}</div>
                <p class="dev-warn" style="margin-top:0;">
                    ${escapeHTML(t('dev.changeDevPwdHint', 'Generate a hash for your new password, then paste it into app.js on GitHub.'))}
                </p>
                <label class="dev-field">
                    <span>${escapeHTML(t('dev.newDevPwd', 'New password'))}</span>
                    <input type="text" id="dev-new-pwd-input" placeholder="${escapeHTML(t('dev.newDevPwdPh', 'Enter new password to hash'))}"
                           autocomplete="off">
                </label>
                <button class="modal-btn modal-btn-primary" data-action="generate-hash" style="width:100%;">
                    🔐 ${escapeHTML(t('dev.generateHash', 'Generate hash'))}
                </button>

                <div id="dev-hash-output" class="dev-hash-output" style="display:none;">
                    <label class="dev-field">
                        <span>${escapeHTML(t('dev.hashResult', 'Hash result — copy this and paste into app.js'))}</span>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <input type="text" id="dev-hash-result" readonly style="flex:1; font-family:var(--font-mono); font-size:11px;">
                            <button class="modal-btn modal-btn-primary" data-action="copy-hash" style="padding:6px 14px;">
                                📋 ${escapeHTML(t('dev.copy', 'Copy'))}
                            </button>
                        </div>
                    </label>
                    <p class="dev-warn">
                        ${escapeHTML(t('dev.hashInstructions', 'Open app.js on GitHub mobile, find the line starting with "const DEV_PASSWORD_HASH", and replace the value between quotes with this hash. Commit, then press 🔄 in the app.'))}
                    </p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-secondary" data-action="close">${escapeHTML(t('dev.close', 'Close'))}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const pwdInput = overlay.querySelector('#dev-exit-pwd-input');
    pwdInput?.focus();
    pwdInput?.select();

    overlay.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        if (e.target === overlay || action === 'close') { overlay.remove(); return; }
        if (action === 'save-pwd') {
            const newPwd = pwdInput.value.trim();
            if (newPwd.length < 1) {
                showToast('❌ ' + t('dev.passwordRequired', 'Password required'), 'error');
                return;
            }
            if (setExamExitPassword(newPwd)) {
                showToast('✅ ' + t('dev.passwordSaved', 'Exit password saved'), 'success');
            } else {
                showToast('❌ ' + t('dev.saveFailed', 'Failed to save'), 'error');
            }
        }
        if (action === 'force-exit') {
            overlay.remove();
            forceExitExamMode();
        }
        if (action === 'generate-hash') {
            const newPwdInput = overlay.querySelector('#dev-new-pwd-input');
            const newPwd = (newPwdInput?.value || '').trim();
            if (newPwd.length < 1) {
                showToast('❌ ' + t('dev.passwordRequired', 'Password required'), 'error');
                return;
            }
            const hash = await generatePasswordHash(newPwd);
            const out = overlay.querySelector('#dev-hash-output');
            const resultEl = overlay.querySelector('#dev-hash-result');
            if (resultEl) resultEl.value = hash;
            if (out) out.style.display = 'block';
            showToast('✅ ' + t('dev.hashGenerated', 'Hash generated'), 'success');
        }
        if (action === 'copy-hash') {
            const resultEl = overlay.querySelector('#dev-hash-result');
            if (resultEl && resultEl.value) {
                try {
                    await navigator.clipboard.writeText(resultEl.value);
                    showToast('📋 ' + t('dev.copied', 'Copied to clipboard'), 'success');
                } catch (err) {
                    // fallback: حدّد النصّ ليتمكّن المستخدم من النسخ يدوياً
                    resultEl.select();
                    showToast('⚠️ ' + t('dev.copyManual', 'Select and copy manually'), 'warning');
                }
            }
        }
    });

    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') overlay.remove();
        if (e.key === 'Enter' && document.activeElement === pwdInput) {
            overlay.querySelector('[data-action="save-pwd"]')?.click();
        }
    });
}

// ===== مودال الدخول إلى نمط الاختبار (للجميع، رمز 0000) =====
function showExamEntry() {
    if (examMode) {
        showToast('⚠️ ' + t('exam.alreadyActive', 'Exam mode is already active'), 'warning');
        return;
    }
    showPromptModal({
        title: t('exam.entryTitle', 'Enter Exam Mode'),
        fields: [{ name: 'code', label: t('exam.entryCode', 'Entry code'), type: 'password' }],
        onConfirm: (v) => {
            if ((v.code || '').trim() === EXAM_ENTRY_CODE) {
                enterExamMode();
            } else {
                showToast('❌ ' + t('exam.wrongCode', 'Wrong entry code'), 'error');
            }
        }
    });
}

function promptExitExam() {
    showPromptModal({
        title: t('exam.exitTitle', 'Exit exam mode'),
        fields: [{ name: 'pwd', label: t('exam.enterPassword', 'Enter exit password'), type: 'password' }],
        onConfirm: (v) => exitExamMode(v.pwd || '')
    });
}

// ============================================================
// SHORTCUTS + UI WIRING — اختصارات + ربط
// ============================================================
// طريقَتان للوصول لـ Developer Login:
//   1. الكمبيوتر: Ctrl + Shift + D
//   2. الهاتف:    اضغط مطوّلاً على اللوغو ⚡ لمدة 3 ثوانٍ
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        showDevLogin();
    }
}, true);

// long-press على اللوغو (للهاتف بشكل أساسي، يعمل أيضاً بالماوس)
(function setupLogoLongPress() {
    const logoEl = document.querySelector('.logo-icon');
    if (!logoEl) return;

    // منع تأثيرات الـ long-press الافتراضية على الموبايل (callout, selection)
    logoEl.style.webkitTouchCallout = 'none';
    logoEl.style.userSelect = 'none';
    logoEl.style.webkitUserSelect = 'none';
    logoEl.style.cursor = 'pointer';

    let pressTimer = null;
    let pressActive = false;
    const PRESS_DURATION_MS = 3000;     // ٣ ثوانٍ — يكفي لمنع الفتح بالخطأ

    const startPress = (e) => {
        if (pressActive) return;
        pressActive = true;
        // مؤشر بصري خفيف أن هناك شيئاً يحدث
        logoEl.style.transform = 'scale(0.92)';
        logoEl.style.transition = `transform ${PRESS_DURATION_MS}ms ease-out, filter ${PRESS_DURATION_MS}ms`;
        logoEl.style.filter = 'brightness(1.4) drop-shadow(0 0 8px gold)';
        pressTimer = setTimeout(() => {
            pressActive = false;
            pressTimer = null;
            // أعد المظهر الطبيعي
            logoEl.style.transform = '';
            logoEl.style.filter = '';
            logoEl.style.transition = '';
            // افتح Dev Login
            showDevLogin();
        }, PRESS_DURATION_MS);
    };

    const cancelPress = () => {
        pressActive = false;
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        // أعد المظهر فوراً
        logoEl.style.transition = 'transform 0.15s, filter 0.15s';
        logoEl.style.transform = '';
        logoEl.style.filter = '';
    };

    // نستخدم Pointer Events لأنها تُوحِّد الماوس واللمس والقلم
    logoEl.addEventListener('pointerdown', startPress);
    logoEl.addEventListener('pointerup', cancelPress);
    logoEl.addEventListener('pointercancel', cancelPress);
    logoEl.addEventListener('pointerleave', cancelPress);
    // منع قائمة السياق (right-click / long-press على الهاتف)
    logoEl.addEventListener('contextmenu', (e) => e.preventDefault());
})();

// زر "Exit Exam" في الـ header (يظهر فقط في نمط الاختبار)
const btnExitExam = document.getElementById('btn-exit-exam');
if (btnExitExam) {
    btnExitExam.addEventListener('click', promptExitExam);
}

// زر "Enter Exam" في الـ header (متاح للجميع برمز 0000)
const btnEnterExam = document.getElementById('btn-enter-exam');
if (btnEnterExam) {
    btnEnterExam.addEventListener('click', showExamEntry);
}

// زر "🔄 Hard Refresh" في الـ header
const btnHardRefresh = document.getElementById('btn-hard-refresh');
if (btnHardRefresh) {
    btnHardRefresh.addEventListener('click', () => {
        showToast('🔄 ' + t('refresh.refreshing', 'Refreshing from server…'), 'info');
        // تأخير قليل ليرى المستخدم الـ toast
        setTimeout(hardRefreshApp, 300);
    });
}

// === استعادة نمط الاختبار إذا كان مفعّلاً قبل تحديث الصفحة ===
restoreExamModeIfPersisted();

// منع clearAll أثناء الاختبار إلا بكلمة المرور
const _origClearAll = (typeof clearAll === 'function') ? clearAll : null;
if (_origClearAll) {
    clearAll = function (...args) {
        if (examMode) {
            showToast('⚠️ ' + t('exam.cantClear', 'Cannot clear during exam mode'), 'warning');
            return;
        }
        return _origClearAll.apply(this, args);
    };
}

// منع تحميل مشروع أثناء الاختبار
const _origLoadProjectFromData = (typeof loadProjectFromData === 'function') ? loadProjectFromData : null;
if (_origLoadProjectFromData) {
    loadProjectFromData = function (...args) {
        if (examMode) {
            showToast('⚠️ ' + t('exam.cantLoad', 'Cannot load during exam mode'), 'warning');
            return false;
        }
        return _origLoadProjectFromData.apply(this, args);
    };
}


