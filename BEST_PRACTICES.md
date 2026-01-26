# 🔧 أفضل الممارسات - Mawazen Legal Assistant

## CSS و Tailwind

### RTL Development
```tsx
// ✅ صحيح: استخدم rtl: prefix لجميع spacing
<Button className="rtl:mr-2 ml-2">
  <Icon />
  Click me
</Button>

// ❌ خطأ: لا تستخدم فقط ml-2
<Button className="ml-2">
  <Icon />
  Click me
</Button>
```

### Reduced Motion Support
```tsx
// ✅ صحيح: احترم تفضيلات المستخدم
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}

// ❌ خطأ: الـ animations تعمل دائماً
.card { animation: float 4s infinite; }
```

### Dark Mode Contrast
```css
/* ✅ صحيح: contrast جيد */
.dark a { color: #FFD700; } /* ratio: 6:1 */

/* ❌ خطأ: contrast ضعيف */
.dark a { color: #CCCCCC; } /* ratio: 2:1 */
```

### Mobile-First Responsive
```css
/* ✅ صحيح: mobile-first */
.container { padding: 1rem; }
@media (md) { .container { padding: 1.5rem; } }

/* ❌ خطأ: desktop-first */
.container { padding: 2rem; }
@media (max-width: 768px) { .container { padding: 1rem; } }
```

---

## React Components

### Performance Optimization
```tsx
// ✅ صحيح: استخدم React.memo للصفحات الثقيلة
export const Dashboard = React.memo(() => {
  return <div>...</div>;
});

// ✅ صحيح: lazy load الصفحات الكبيرة
const Dashboard = lazy(() => import('./Dashboard'));

// ✅ صحيح: استخدم useCallback للدوال المستخدمة في renders
const handleClick = useCallback(() => {
  // handler
}, [dependencies]);
```

### RTL Support in Components
```tsx
// ✅ صحيح: استخدم flex-row-reverse في RTL
<div className="flex rtl:flex-row-reverse">
  <IconComponent />
  <Text />
</div>

// ✅ صحيح: استخدم text-right للعناصر
<label className="text-right">التسمية</label>

// ❌ خطأ: الـ margins غير معكوسة
<Button className="ml-2">
  {/* margin ستكون على الجانب الخطأ */}
</Button>
```

### Accessibility
```tsx
// ✅ صحيح: استخدم semantic HTML
<button onClick={handleClick}>
  <Icon aria-hidden="true" />
  <span>Click me</span>
</button>

// ✅ صحيح: استخدم ARIA labels عند الحاجة
<button aria-label="Close dialog" onClick={onClose}>
  ×
</button>

// ❌ خطأ: استخدم divs كـ buttons
<div onClick={handleClick} role="button">
  Click me
</div>
```

---

## Design System

### Color Usage
```tsx
// ✅ صحيح: استخدم الذهب كـ accent فقط
<h1 className="text-gold">موازين</h1>
<Button className="btn-gold">Primary Action</Button>

// ⚠️ حذر: تجنب استخدام الذهب بكثرة
<div className="bg-gold text-gold border-gold">
  {/* إرهاق بصري */}
</div>
```

### Typography
```tsx
// ✅ صحيح: أحجام خطوط موحدة
<h1 className="text-3xl font-bold">Title</h1>
<h2 className="text-2xl font-semibold">Subtitle</h2>
<p className="text-base leading-relaxed">Body</p>

// ❌ خطأ: أحجام خطوط غير موحدة
<h1 style={{ fontSize: "32px" }}>Title</h1>
<h2 style={{ fontSize: "18px" }}>Subtitle</h2>
```

### Spacing
```tsx
// ✅ صحيح: استخدم Tailwind spacing scale
<div className="space-y-4">
  <Card className="p-6 sm:p-8 lg:p-10" />
  <Card className="p-6 sm:p-8 lg:p-10" />
</div>

// ❌ خطأ: custom spacing
<div style={{ gap: "18px" }}>
  <Card style={{ padding: "23px 14px" }} />
</div>
```

---

## Testing Checklist

### RTL Testing
```
✅ Text alignment correct (right-aligned)
✅ Icon margins reversed
✅ Flex containers reversed
✅ Dialog centered
✅ Sidebar positioned correctly
✅ Forms display correctly
```

### Accessibility Testing
```
✅ Tab navigation works
✅ Focus indicators visible
✅ Color contrast sufficient (≥4.5:1)
✅ Screen reader announces properly
✅ Keyboard shortcuts work
✅ prefers-reduced-motion respected
```

### Responsive Testing
```
✅ Mobile (320px): Text readable, buttons large
✅ Tablet (768px): Layout adapts
✅ Desktop (1024px): Full layout visible
✅ Images responsive
✅ Touch targets at least 44x44px
```

### Performance Testing
```
✅ Lighthouse score > 80
✅ First Contentful Paint < 1.8s
✅ Largest Contentful Paint < 2.5s
✅ Cumulative Layout Shift < 0.1
✅ Bundle size < 3MB gzipped
```

---

## Icon Guidelines

### Using Built-in Icons
```tsx
// ✅ صحيح: استخدم LegalIcons للعمليات القانونية
import { CaseIcon, DocumentIcon } from '@/components/icons/LegalIcons';

<CaseIcon className="h-6 w-6 text-gold" />

// ✅ صحيح: استخدم lucide-react للأيقونات العامة
import { Plus, Trash2 } from 'lucide-react';

<Plus className="h-4 w-4 rtl:mr-2 ml-2" />
```

### Icon Sizing
```tsx
// ✅ صحيح: أحجام موحدة
// Headers: h-8 w-8
// Buttons: h-4 w-4
// Cards: h-6 w-6
// Decorative: h-10 w-10

<Plus className="h-4 w-4" /> {/* buttons */}
<CaseIcon className="h-6 w-6" /> {/* cards */}
```

### Icon Colors
```tsx
// ✅ صحيح: ألوان واضحة
<Plus className="text-gold" /> {/* primary */}
<Trash2 className="text-red-500" /> {/* destructive */}
<CheckCircle className="text-green-500" /> {/* success */}

// ❌ خطأ: ألوان فاتحة
<Plus className="text-gray-400" /> {/* غير واضح */}
```

---

## Animation Guidelines

### Respectful Motion
```css
/* ✅ صحيح: احترم prefers-reduced-motion */
.card {
  animation: float 4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .card { animation: none; }
}

/* ❌ خطأ: الـ animations تعمل دائماً */
.card { animation: float 4s ease-in-out infinite; }
```

### Animation Duration
```css
/* ✅ صحيح: animations سريعة وناعمة */
.transition { transition: all 300ms ease; } /* buttons */
.animation { animation: slide 500ms ease; } /* page load */

/* ⚠️ حذر: animations طويلة */
.animation { animation: float 4s ease infinite; }
```

---

## Performance Tips

### Code Splitting
```tsx
// ✅ صحيح: lazy load الصفحات الثقيلة
const Dashboard = lazy(() => import('./Dashboard'));
const Analytics = lazy(() => import('./Analytics'));

// استخدم مع Suspense
<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>
```

### Query Optimization
```tsx
// ✅ صحيح: دمج queries إذا أمكن
const { data } = trpc.dashboard.all.useQuery();

// ❌ خطأ: queries متعددة متوازية
const { data: stats } = trpc.dashboard.stats.useQuery();
const { data: cases } = trpc.dashboard.cases.useQuery();
const { data: clients } = trpc.dashboard.clients.useQuery();
```

### Image Optimization
```tsx
// ✅ صحيح: استخدم Next Image أو responsive images
<img src={img} alt="description" loading="lazy" />

// ❌ خطأ: صور بدون optimization
<img src={img} alt="description" />
```

---

## Git Commits

### Good Commit Messages
```
✅ "fix: improve RTL support for button icons"
✅ "feat: add dark mode contrast improvements"
✅ "perf: optimize dashboard queries"

❌ "fix stuff"
❌ "update"
❌ "changes"
```

### Commit Size
```
✅ صحيح: commits صغيرة ومركزة
   - واحدة لـ RTL fixes
   - واحدة لـ dark mode
   - واحدة لـ responsive

❌ خطأ: commits ضخمة
   - تغييرات شاملة في ملف واحد
   - multiple unrelated changes
```

---

## Documentation

### Code Comments
```tsx
// ✅ صحيح: comments مفيدة
// Reverse flex direction for RTL context
<div className="flex rtl:flex-row-reverse">

// ⚠️ خطأ: comments غير ضرورية
// This is a div
<div>

// ✅ صحيح: comments لـ complex logic
// Batch multiple queries to reduce API calls
const { data } = trpc.dashboard.all.useQuery();
```

### README Updates
```
✅ وثّق التغييرات الكبيرة
✅ أضف أمثلة على الاستخدام الصحيح
✅ اشرح سبب التغييرات
❌ لا توثق التغييرات الصغيرة
```

---

## Resources

### Useful Links
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)
- [Web.dev Performance](https://web.dev/performance)
- [MDN Web Docs](https://developer.mozilla.org)

### Tools
- Lighthouse (Chrome DevTools)
- axe DevTools (Accessibility)
- WAVE (WebAIM)
- Responsively App
- BrowserStack

---

## Final Notes

✨ **Remember:**
- دائماً اختبر على أجهزة فعلية
- احترم تفضيلات المستخدم
- أولويتك يجب أن تكون الوضوح والأمان
- الأداء مهمة، لكن الوصول أهم
- التوثيق يوفر الوقت لاحقاً

🎯 **الهدف: تطبيق احترافي آمن وسهل الاستخدام للجميع**

---

**آخر تحديث:** 2024
