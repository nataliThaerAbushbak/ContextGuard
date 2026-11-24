import type { CheckItem, ScreenItem } from '../types/audit.ts';

// Function to generate crisp SVG data URLs for realistic screenshots
function createSvgDataUrl(svgContent: string): string {
  const cleanSvg = svgContent.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}

export const ECOMMERCE_PRODUCT_PAGE_SVG = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#FBFBFB"/>
  <!-- Top Nav -->
  <rect width="800" height="54" fill="#FFFFFF" stroke="#EEEEEE" stroke-width="1"/>
  <circle cx="40" cy="27" r="10" fill="#B45309"/>
  <text x="60" y="32" font-family="-apple-system, sans-serif" font-size="14" font-weight="bold" fill="#1C1917">AURA APPAREL</text>
  <rect x="710" y="16" width="50" height="24" rx="12" fill="#F3F4F6"/>
  <text x="725" y="32" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#374151">Bag (0)</text>

  <!-- Product Container -->
  <g transform="translate(60, 80)">
    <!-- Image Box -->
    <rect width="320" height="360" rx="12" fill="#EAE6DF"/>
    <circle cx="160" cy="180" r="45" fill="#D6D0C7"/>
    <text x="160" y="245" font-family="-apple-system, sans-serif" font-size="13" font-weight="500" fill="#78716C" text-anchor="middle">Heavyweight Organic Tee</text>

    <!-- Details -->
    <g transform="translate(360, 20)">
      <text x="0" y="20" font-family="-apple-system, sans-serif" font-size="22" font-weight="700" fill="#1C1917">Heavyweight Organic Tee</text>
      <text x="0" y="48" font-family="-apple-system, sans-serif" font-size="18" font-weight="600" fill="#B45309">$49.00</text>
      <text x="0" y="80" font-family="-apple-system, sans-serif" font-size="13" fill="#78716C">Crafted with 100% organic cotton, relaxed fit, pre-shrunk fabric.</text>
      
      <!-- Size Selector -->
      <text x="0" y="130" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" fill="#4B5563">SELECT SIZE</text>
      <rect x="0" y="145" width="40" height="36" rx="6" fill="#1C1917"/>
      <text x="20" y="168" font-family="-apple-system, sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF" text-anchor="middle">M</text>
      <rect x="50" y="145" width="40" height="36" rx="6" fill="#FFFFFF" stroke="#E5E7EB"/>
      <text x="70" y="168" font-family="-apple-system, sans-serif" font-size="13" font-weight="500" fill="#374151" text-anchor="middle">L</text>
      <rect x="100" y="145" width="40" height="36" rx="6" fill="#FFFFFF" stroke="#E5E7EB"/>
      <text x="120" y="168" font-family="-apple-system, sans-serif" font-size="13" font-weight="500" fill="#374151" text-anchor="middle">XL</text>

      <!-- Primary Add Button -->
      <rect x="0" y="220" width="280" height="48" rx="8" fill="#B45309"/>
      <text x="140" y="250" font-family="-apple-system, sans-serif" font-size="15" font-weight="600" fill="#FFFFFF" text-anchor="middle">Add to Cart • $49.00</text>
      
      <text x="0" y="300" font-family="-apple-system, sans-serif" font-size="11" fill="#9CA3AF">✓ In stock and ready to ship within 24 hours</text>
    </g>
  </g>
</svg>
`);

export const ECOMMERCE_CART_DRAWER_SVG = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#1C1917" opacity="0.3"/>
  <rect x="420" y="0" width="380" height="500" fill="#FFFFFF"/>
  <text x="450" y="45" font-family="-apple-system, sans-serif" font-size="18" font-weight="700" fill="#1C1917">Your Bag (1)</text>
  <line x1="450" y1="65" x2="760" y2="65" stroke="#F3F4F6" stroke-width="1"/>

  <!-- Cart Item -->
  <g transform="translate(450, 90)">
    <rect width="70" height="70" rx="8" fill="#F3F4F6"/>
    <text x="85" y="25" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#1C1917">Heavyweight Organic Tee</text>
    <text x="85" y="45" font-family="-apple-system, sans-serif" font-size="12" fill="#78716C">Size: M · Qty: 1</text>
    <text x="85" y="65" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#B45309">$49.00</text>
  </g>

  <!-- Summary note (missing explicit tax & shipping breakdown!) -->
  <g transform="translate(450, 320)">
    <line x1="0" y1="0" x2="310" y2="0" stroke="#E5E7EB" stroke-width="1"/>
    <text x="0" y="30" font-family="-apple-system, sans-serif" font-size="14" fill="#4B5563">Subtotal</text>
    <text x="310" y="30" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#1C1917" text-anchor="end">$49.00</text>
    <text x="0" y="55" font-family="-apple-system, sans-serif" font-size="11" fill="#9CA3AF">Taxes &amp; shipping calculated in next checkout step</text>
    
    <rect x="0" y="80" width="310" height="46" rx="8" fill="#B45309"/>
    <text x="155" y="108" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#FFFFFF" text-anchor="middle">Proceed to Checkout →</text>
  </g>
</svg>
`);

export const ECOMMERCE_CHECKOUT_SHIPPING_SVG = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#F9F8F6"/>
  <!-- Nav -->
  <rect width="800" height="50" fill="#FFFFFF" stroke="#EAE6DF" stroke-width="1"/>
  <text x="50" y="30" font-family="-apple-system, sans-serif" font-size="14" font-weight="bold" fill="#B45309">CHECKOUT</text>
  
  <g transform="translate(50, 75)">
    <text x="0" y="24" font-family="-apple-system, sans-serif" font-size="20" font-weight="700" fill="#1C1917">Shipping Address</text>
    
    <!-- Form Inputs -->
    <rect x="0" y="50" width="420" height="42" rx="6" fill="#FFFFFF" stroke="#D1D5DB"/>
    <text x="15" y="76" font-family="-apple-system, sans-serif" font-size="13" fill="#111827">nataly@acme-corp.design</text>
    
    <rect x="0" y="105" width="200" height="42" rx="6" fill="#FFFFFF" stroke="#D1D5DB"/>
    <text x="15" y="131" font-family="-apple-system, sans-serif" font-size="13" fill="#111827">Nataly</text>
    
    <rect x="220" y="105" width="200" height="42" rx="6" fill="#FFFFFF" stroke="#D1D5DB"/>
    <text x="235" y="131" font-family="-apple-system, sans-serif" font-size="13" fill="#111827">Abushbak</text>

    <rect x="0" y="160" width="420" height="42" rx="6" fill="#FFFFFF" stroke="#D1D5DB"/>
    <text x="15" y="186" font-family="-apple-system, sans-serif" font-size="13" fill="#111827">742 Evergreen Terrace</text>
    
    <rect x="0" y="215" width="180" height="42" rx="6" fill="#FFFFFF" stroke="#D1D5DB"/>
    <text x="15" y="241" font-family="-apple-system, sans-serif" font-size="13" fill="#111827">Springfield, OR</text>

    <rect x="200" y="215" width="220" height="42" rx="6" fill="#FFFFFF" stroke="#D1D5DB"/>
    <text x="215" y="241" font-family="-apple-system, sans-serif" font-size="13" fill="#111827">97477</text>

    <rect x="0" y="280" width="220" height="44" rx="8" fill="#B45309"/>
    <text x="110" y="307" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#FFFFFF" text-anchor="middle">Continue to Payment →</text>
  </g>

  <!-- Side summary -->
  <g transform="translate(520, 75)">
    <rect width="230" height="280" rx="10" fill="#FFFFFF" stroke="#EAE6DF"/>
    <text x="20" y="35" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#1C1917">Order Summary</text>
    <text x="20" y="70" font-family="-apple-system, sans-serif" font-size="13" fill="#6B7280">1 item in cart</text>
    <text x="210" y="70" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#1C1917" text-anchor="end">$49.00</text>
    <text x="20" y="100" font-family="-apple-system, sans-serif" font-size="13" fill="#6B7280">Standard Shipping</text>
    <text x="210" y="100" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#059669" text-anchor="end">FREE</text>
  </g>
</svg>
`);

export const ECOMMERCE_PAYMENT_SVG = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#F9F8F6"/>
  <rect width="800" height="500" fill="#FFFFFF" stroke="#EAE6DF" stroke-width="1"/>
  <text x="50" y="30" font-family="-apple-system, sans-serif" font-size="14" font-weight="bold" fill="#B45309">CHECKOUT • PAYMENT</text>
  
  <g transform="translate(50, 75)">
    <text x="0" y="24" font-family="-apple-system, sans-serif" font-size="20" font-weight="700" fill="#1C1917">Payment Details</text>
    <text x="0" y="48" font-family="-apple-system, sans-serif" font-size="12" fill="#6B7280">All transactions are encrypted and secured.</text>

    <!-- Card Fields -->
    <rect x="0" y="70" width="420" height="44" rx="6" fill="#FFFFFF" stroke="#D1D5DB"/>
    <text x="15" y="97" font-family="-apple-system, sans-serif" font-size="13" fill="#111827">4242 •••• •••• 4242</text>
    <rect x="360" y="80" width="45" height="24" rx="4" fill="#0F172A"/>
    <text x="382" y="96" font-family="-apple-system, sans-serif" font-size="10" font-weight="bold" fill="#FFFFFF" text-anchor="middle">VISA</text>

    <rect x="0" y="125" width="200" height="44" rx="6" fill="#FFFFFF" stroke="#D1D5DB"/>
    <text x="15" y="152" font-family="-apple-system, sans-serif" font-size="13" fill="#111827">12 / 28</text>

    <rect x="220" y="125" width="200" height="44" rx="6" fill="#FFFFFF" stroke="#D1D5DB"/>
    <text x="235" y="152" font-family="-apple-system, sans-serif" font-size="13" fill="#111827">••• (CVC)</text>

    <!-- Discrepancy Button: It says "Submit Order" instead of "Pay Now ($49.00)"! -->
    <rect x="0" y="210" width="420" height="50" rx="8" fill="#B45309"/>
    <text x="210" y="241" font-family="-apple-system, sans-serif" font-size="15" font-weight="600" fill="#FFFFFF" text-anchor="middle">Submit Order</text>
  </g>

  <!-- Side summary -->
  <g transform="translate(520, 75)">
    <rect width="230" height="280" rx="10" fill="#FFFFFF" stroke="#EAE6DF"/>
    <text x="20" y="35" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#1C1917">Total Due</text>
    <text x="20" y="70" font-family="-apple-system, sans-serif" font-size="24" font-weight="700" fill="#B45309">$49.00</text>
    <text x="20" y="100" font-family="-apple-system, sans-serif" font-size="12" fill="#6B7280">Tax included: $3.85</text>
  </g>
</svg>
`);

export const ECOMMERCE_CONFIRMATION_SVG = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#F9F8F6"/>
  <rect width="800" height="50" fill="#FFFFFF" stroke="#EAE6DF" stroke-width="1"/>
  
  <g transform="translate(200, 70)">
    <rect width="400" height="360" rx="16" fill="#FFFFFF" stroke="#EAE6DF"/>
    <!-- Success Icon -->
    <circle cx="200" cy="65" r="30" fill="#D1FAE5"/>
    <path d="M190 65 L197 72 L212 56" stroke="#065F46" stroke-width="3" fill="none" stroke-linecap="round"/>

    <text x="200" y="125" font-family="-apple-system, sans-serif" font-size="22" font-weight="700" fill="#1C1917" text-anchor="middle">Order confirmed!</text>
    <text x="200" y="150" font-family="-apple-system, sans-serif" font-size="13" fill="#78716C" text-anchor="middle">Order #CG-84920 has been placed successfully.</text>

    <line x1="40" y1="180" x2="360" y2="180" stroke="#F3F4F6" stroke-width="1"/>

    <text x="40" y="215" font-family="-apple-system, sans-serif" font-size="13" fill="#4B5563">Confirmation sent to:</text>
    <text x="360" y="215" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#1C1917" text-anchor="end">nataly@acme-corp.design</text>

    <text x="40" y="245" font-family="-apple-system, sans-serif" font-size="13" fill="#4B5563">Estimated delivery:</text>
    <text x="360" y="245" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#1C1917" text-anchor="end">Thursday, Oct 22</text>

    <text x="40" y="275" font-family="-apple-system, sans-serif" font-size="13" fill="#4B5563">Total paid:</text>
    <text x="360" y="275" font-family="-apple-system, sans-serif" font-size="15" font-weight="700" fill="#B45309" text-anchor="end">$49.00</text>

    <rect x="40" y="300" width="320" height="40" rx="8" fill="#1C1917"/>
    <text x="200" y="325" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#FFFFFF" text-anchor="middle">Continue Shopping</text>
  </g>
</svg>
`);

/**
 * Controlled Gold-Standard Benchmark:
 * 9 Source Requirements decomposed into 10 Atomic Checks.
 * Evaluated strictly against the 5 flow screenshots:
 * - 7 Explicit Pass
 * - 2 Discrepancies (Cart tax/delivery breakdown, Payment button copy)
 * - 1 Missing Evidence (Transient loading indicator)
 * Compliance Score = 7 / 10 = 70%
 */
export const DEFAULT_ECOMMERCE_REQUIREMENTS = `FEATURE: E-Commerce Guest Checkout Flow

1. As a shopper, I can select a size option (M, L, XL) and add the Heavyweight Organic Tee ($49.00) to my cart.
2. The cart drawer opens automatically upon adding the item and clearly displays the item details, price, and item quantity.
3. The user can proceed seamlessly from the cart drawer directly into checkout with a primary action button.
4. The cart drawer must display a final total that already includes tax and delivery charges.
5. On the shipping screen, the user can fill in contact email and shipping address fields.
6. On the payment screen, the user can enter credit card details.
7. The payment screen primary CTA must be labeled exactly 'Pay Now ($49.00)'.
8. A visible loading indicator must appear while payment is being processed before the confirmation screen.
9. The user receives an order confirmation receipt with an order ID (e.g. #CG-84920) and delivery estimate, with return navigation back to the catalog.`;

export const DEFAULT_SAMPLE_SCREENS: ScreenItem[] = [
  {
    id: 'screen-1',
    step_number: 1,
    label: 'Product page',
    imageUrl: ECOMMERCE_PRODUCT_PAGE_SVG,
    file_name: '01_product_page.png',
  },
  {
    id: 'screen-2',
    step_number: 2,
    label: 'Cart drawer',
    imageUrl: ECOMMERCE_CART_DRAWER_SVG,
    file_name: '02_cart_drawer.png',
  },
  {
    id: 'screen-3',
    step_number: 3,
    label: 'Checkout',
    imageUrl: ECOMMERCE_CHECKOUT_SHIPPING_SVG,
    file_name: '03_checkout_shipping.png',
  },
  {
    id: 'screen-4',
    step_number: 4,
    label: 'Payment',
    imageUrl: ECOMMERCE_PAYMENT_SVG,
    file_name: '04_checkout_payment.png',
  },
  {
    id: 'screen-5',
    step_number: 5,
    label: 'Confirmation',
    imageUrl: ECOMMERCE_CONFIRMATION_SVG,
    file_name: '05_order_confirmation.png',
  },
];

export const DEFAULT_SAMPLE_CHECKS: CheckItem[] = [
  {
    id: 'check-1',
    text: 'As a shopper, I can select a size option (M, L, XL) and add the Heavyweight Organic Tee ($49.00) to my cart.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'check-2',
    text: 'The cart drawer opens automatically upon adding the item and clearly displays the item details, price, and item quantity.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'check-3',
    text: 'The user can proceed seamlessly from the cart drawer directly into checkout with a primary action button.',
    category: 'Navigation',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'check-4',
    text: 'The cart drawer must display a final total that already includes tax and delivery charges.',
    category: 'States',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'check-5',
    text: 'On the shipping screen, the user can fill in contact email and shipping address fields.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'check-6',
    text: 'On the payment screen, the user can enter credit card details.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'check-7',
    text: "The payment screen primary CTA must be labeled exactly 'Pay Now ($49.00)'.",
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'check-8',
    text: 'A visible loading indicator must appear while payment is being processed before the confirmation screen.',
    category: 'States',
    is_ambiguous: false,
    included: true,
  },
  {
    id: 'check-9',
    text: 'The user receives an order confirmation receipt with an order ID (e.g. #CG-84920) and delivery estimate, with return navigation back to the catalog.',
    category: 'Core flow',
    is_ambiguous: false,
    included: true,
  },
];

export interface SampleProjectCard {
  id: string;
  category: 'Web app' | 'Mobile app' | 'Checkout' | 'SaaS';
  number: string;
  title: string;
  description: string;
  checks_count: number;
  screens_count: number;
  requirements: string;
  checks: CheckItem[];
  screens: ScreenItem[];
}

export const SAMPLE_PROJECTS: SampleProjectCard[] = [
  {
    id: 'sample-checkout',
    number: '01',
    category: 'Checkout',
    title: 'E-commerce checkout',
    description: 'Purchase flow, totals, copy and confirmation states.',
    checks_count: 9,
    screens_count: 5,
    requirements: DEFAULT_ECOMMERCE_REQUIREMENTS,
    checks: DEFAULT_SAMPLE_CHECKS,
    screens: DEFAULT_SAMPLE_SCREENS,
  },
  {
    id: 'sample-onboarding',
    number: '02',
    category: 'Web app',
    title: 'Account onboarding',
    description: 'Validation, navigation, empty states and completion.',
    checks_count: 4,
    screens_count: 3,
    requirements: `FEATURE: New User Onboarding
1. User provides workspace name and team size.
2. Form validates work email format before proceeding.
3. Step indicator marks current progress step 1 of 3.
4. Empty dashboard displays guided checklist.`,
    checks: [
      { id: 'ob-1', text: 'User provides workspace name and team size', category: 'Core flow', is_ambiguous: false, included: true },
      { id: 'ob-2', text: 'Work email is validated for business domain', category: 'Errors', is_ambiguous: false, included: true },
      { id: 'ob-3', text: 'Step indicator marks current progress step', category: 'Navigation', is_ambiguous: false, included: true },
      { id: 'ob-4', text: 'Initial empty state shows guided onboarding steps', category: 'States', is_ambiguous: false, included: true },
    ],
    screens: DEFAULT_SAMPLE_SCREENS.slice(0, 3),
  },
  {
    id: 'sample-password-reset',
    number: '03',
    category: 'SaaS',
    title: 'Password reset',
    description: 'Error recovery, validation and confirmation.',
    checks_count: 3,
    screens_count: 3,
    requirements: `FEATURE: Self-Service Password Reset
1. User enters registered account email on forgot password screen.
2. System sends 6-digit verification code.
3. New password requires 12+ characters and symbols.`,
    checks: [
      { id: 'pw-1', text: 'User can enter email on forgot password screen', category: 'Core flow', is_ambiguous: false, included: true },
      { id: 'pw-2', text: 'Verification code input has auto-focus', category: 'Navigation', is_ambiguous: true, clarification_question: 'Is auto-focus strictly required on mobile browsers?', included: true },
      { id: 'pw-3', text: 'Password complexity meter updates in real-time', category: 'States', is_ambiguous: false, included: true },
    ],
    screens: DEFAULT_SAMPLE_SCREENS.slice(0, 3),
  },
  {
    id: 'sample-subscription-upgrade',
    number: '04',
    category: 'SaaS',
    title: 'Subscription upgrade',
    description: 'Plan choice, payment confirmation and account state.',
    checks_count: 3,
    screens_count: 3,
    requirements: `FEATURE: Subscription Tier Upgrade
1. Pricing modal compares Pro vs Enterprise tiers.
2. Annual billing toggle applies discounted calculation.
3. Payment confirmation displays immediate active plan badge.`,
    checks: [
      { id: 'sub-1', text: 'Plan comparison highlights current vs upgraded tier', category: 'Core flow', is_ambiguous: false, included: true },
      { id: 'sub-2', text: 'Annual billing toggle applies discounted calculation', category: 'States', is_ambiguous: false, included: true },
      { id: 'sub-3', text: 'Payment confirmation displays immediate active plan badge', category: 'States', is_ambiguous: false, included: true },
    ],
    screens: DEFAULT_SAMPLE_SCREENS.slice(0, 3),
  },
  {
    id: 'sample-team-invitation',
    number: '05',
    category: 'Web app',
    title: 'Team invitation',
    description: 'Invites, permissions and member confirmation.',
    checks_count: 3,
    screens_count: 3,
    requirements: `FEATURE: Team Member Invitations
1. Admin enters batch email addresses with pill badge separation.
2. Role dropdown selects Admin, Editor, or Viewer.
3. Pending invites table has instant revoke action.`,
    checks: [
      { id: 'inv-1', text: 'Batch email entry with pill badge separation', category: 'Core flow', is_ambiguous: false, included: true },
      { id: 'inv-2', text: 'Role selector enforces principle of least privilege', category: 'States', is_ambiguous: false, included: true },
      { id: 'inv-3', text: 'Pending invites table has instant revoke action', category: 'Navigation', is_ambiguous: false, included: true },
    ],
    screens: DEFAULT_SAMPLE_SCREENS.slice(0, 3),
  },
  {
    id: 'sample-search-filters',
    number: '06',
    category: 'Mobile app',
    title: 'Search & filters',
    description: 'Persistence, empty states and reset behavior.',
    checks_count: 3,
    screens_count: 3,
    requirements: `FEATURE: Product Catalog Search & Faceted Filtering
1. Instant search debounces query input by 300ms.
2. Zero results screen shows actionable clear filter CTA.
3. Filter pill count accurately reflects active filter count.`,
    checks: [
      { id: 'sf-1', text: 'Instant search filters catalog results', category: 'Core flow', is_ambiguous: false, included: true },
      { id: 'sf-2', text: 'Zero results screen shows actionable clear filter CTA', category: 'Errors', is_ambiguous: false, included: true },
      { id: 'sf-3', text: 'Filter pill count accurately reflects active filter count', category: 'States', is_ambiguous: false, included: true },
    ],
    screens: DEFAULT_SAMPLE_SCREENS.slice(0, 3),
  },
];
