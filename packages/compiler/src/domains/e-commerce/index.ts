import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Plain substring matching would let bare keywords like 'cart' or 'pay' match
// inside unrelated words, silently inflating scores on inputs that have
// nothing to do with e-commerce.
const KEYWORDS = [
  'e-commerce', 'ecommerce', 'online store', 'webstore', 'web store',
  'checkout', 'shopping cart', 'cart', 'storefront', 'shopify', 'woocommerce',
  'payment gateway', 'stripe', 'paypal', 'inventory sync', 'inventory management',
  'sku', 'product catalog', 'order fulfillment', 'shipping integration',
  'shipping rates', 'point of sale', 'pos system', 'marketplace listing',
  'abandoned cart', 'subscription billing', 'wishlist', 'coupon code',
  'shopping cart abandonment', 'return policy', 'refund processing',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const eCommerceDomain: DomainModule = {
  id: 'e-commerce',
  label: 'E-Commerce',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Support a secure, PCI-compliant checkout flow', category: 'functional' },
    { text: 'Define supported payment methods and processor(s)', category: 'constraint' },
    { text: 'Product catalog must support inventory tracking to avoid overselling', category: 'functional' },
    { text: 'Define shipping regions, carriers, and rate calculation strategy', category: 'constraint' },
    { text: 'Order confirmation and shipping-status notifications for customers', category: 'preference' },
    { text: 'Support tax calculation appropriate to the sale jurisdiction(s)', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'payment processor',
      description: 'Payment gateway/processor (Stripe, PayPal, Shopify Payments, etc.) is unspecified',
      isResolved: (input) => /(stripe|paypal|braintree|square|adyen|shopify payments|payment gateway|payment processor)/i.test(input),
    },
    {
      field: 'catalog scale',
      description: 'Approximate product catalog size (dozens vs. thousands of SKUs) is unspecified',
      isResolved: (input) => /\b(sku|products?|catalog|items?)\b.*\d|\d+\s*(skus?|products?|items?)/i.test(input),
    },
    {
      field: 'inventory source of truth',
      description: 'Whether inventory is managed in-app or synced from an external system (POS, ERP, warehouse) is unspecified',
      isResolved: (input) => /(inventory sync|erp|pos system|point of sale|warehouse management|external inventory|sync inventory)/i.test(input),
    },
    {
      field: 'shipping scope',
      description: 'Shipping regions/countries served and carrier integrations are unspecified',
      isResolved: (input) => /(shipping|domestic|international|carrier|fedex|ups|usps|dhl|fulfillment)/i.test(input),
    },
    {
      field: 'platform vs custom-built',
      description: 'Whether this runs on an existing platform (Shopify, WooCommerce, Magento) or is custom-built is unspecified',
      isResolved: (input) => /(shopify|woocommerce|magento|bigcommerce|custom[- ]built|headless commerce|custom platform)/i.test(input),
    },
    {
      field: 'return/refund policy',
      description: 'Return, refund, and exchange policy handling is unspecified',
      isResolved: (input) => /(return policy|refund|exchange|rma|money[- ]back)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'storefront UI', dependsOn: [], note: 'Customer-facing product browsing, search, and category pages' },
    { component: 'product catalog service', dependsOn: [], note: 'SKU/variant data model, pricing, and catalog search/indexing' },
    { component: 'cart and checkout service', dependsOn: ['product catalog service'], note: 'Cart state, price/tax calculation, and checkout session flow' },
    { component: 'payment gateway integration', dependsOn: ['cart and checkout service'], note: 'PCI-compliant payment capture via processor (Stripe/PayPal/etc.), tokenization, and 3D Secure handling' },
    { component: 'order management system', dependsOn: ['payment gateway integration'], note: 'Order creation, status lifecycle, and fulfillment handoff' },
    { component: 'inventory sync service', dependsOn: ['product catalog service'], note: 'Reconciles stock levels with warehouse/POS/ERP to prevent overselling' },
    { component: 'shipping integration', dependsOn: ['order management system'], note: 'Rate shopping and label generation via carrier APIs (FedEx/UPS/USPS/DHL)' },
    { component: 'customer account service', dependsOn: [], note: 'Login, order history, saved addresses, and payment methods' },
    { component: 'admin/back-office dashboard', dependsOn: ['order management system', 'inventory sync service'], note: 'Merchant-facing order, inventory, and catalog management' },
    { component: 'notifications service', dependsOn: ['order management system'], note: 'Order confirmation, shipping updates, and abandoned-cart emails' },
  ],
  technicalConsiderations: [
    { aspect: 'payment gateway', note: 'Select a PCI DSS-compliant payment processor (Stripe, Adyen, Braintree) and use hosted fields/tokenization so raw card data never touches your servers', category: 'constraints' },
    { aspect: 'platform choice', note: 'Decide between a hosted platform (Shopify, BigCommerce), an open-source platform (WooCommerce, Magento), or a headless/custom build based on scale and customization needs', category: 'functionalRequirements' },
    { aspect: 'inventory consistency', note: 'Define how inventory counts stay consistent across storefront, POS, and warehouse to avoid overselling during high-traffic events (flash sales, restocks)', category: 'functionalRequirements' },
    { aspect: 'tax calculation', note: 'Integrate a tax engine (Avalara, TaxJar, or platform-native) to handle jurisdiction-specific sales tax/VAT correctly', category: 'constraints' },
    { aspect: 'shipping rate calculation', note: 'Determine whether shipping rates are flat, table-based, or live-quoted via carrier APIs, and how rate accuracy affects margin', category: 'functionalRequirements' },
    { aspect: 'catalog search and indexing', note: 'Choose a search/indexing solution (Algolia, Elasticsearch, platform-native) suited to catalog size and faceted filtering needs', category: 'preferences' },
    { aspect: 'performance under load', note: 'Plan for traffic spikes (sales events, product launches) with caching, CDN, and checkout queueing to prevent downtime during peak demand', category: 'preferences' },
    { aspect: 'currency and locale', note: 'Define multi-currency/multi-language support if selling internationally, including pricing display and conversion strategy', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'checkout friction', note: 'Minimize checkout steps (guest checkout, saved payment methods, autofill) since each added step increases cart abandonment', category: 'functionalRequirements' },
    { aspect: 'product discovery', note: 'Design filtering, sorting, and search relevance so customers can find products quickly in large catalogs', category: 'functionalRequirements' },
    { aspect: 'cart visibility', note: 'Keep cart contents and running total persistently visible/accessible so customers always know what they are about to buy', category: 'preferences' },
    { aspect: 'trust signals', note: 'Surface trust signals at checkout (security badges, clear return policy, real customer reviews) to reduce purchase hesitation', category: 'preferences' },
    { aspect: 'mobile checkout', note: 'Optimize checkout for mobile (large tap targets, mobile wallet support like Apple Pay/Google Pay) given majority mobile traffic on most storefronts', category: 'functionalRequirements' },
    { aspect: 'order status transparency', note: 'Give customers clear, self-service visibility into order status and shipment tracking to reduce support inquiries', category: 'preferences' },
    { aspect: 'abandoned cart recovery', note: 'Design a non-intrusive abandoned-cart recovery flow (email/SMS reminder) that respects opt-in preferences', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'PCI compliance', note: 'Never store raw card numbers/CVV; use tokenization and a PCI DSS-compliant processor, and scope PCI SAQ level correctly for the integration method chosen', category: 'constraints' },
    { aspect: 'fraud prevention', note: 'Implement fraud screening (AVS/CVV checks, velocity limits, 3D Secure) to reduce chargeback and stolen-card risk', category: 'constraints' },
    { aspect: 'account takeover protection', note: 'Protect customer accounts with rate-limited login, MFA options, and secure password reset flows given stored payment/address data', category: 'constraints' },
    { aspect: 'PII and address data', note: 'Encrypt and restrict access to stored customer PII (addresses, order history, phone numbers) and define data retention/deletion policy', category: 'constraints' },
    { aspect: 'webhook verification', note: 'Verify payment/shipping webhook signatures (e.g. Stripe webhook secrets) to prevent spoofed order or refund events', category: 'functionalRequirements' },
    { aspect: 'admin access control', note: 'Restrict back-office/admin dashboard access with role-based permissions so staff cannot view or export more customer data than their role requires', category: 'constraints' },
    { aspect: 'unsafe assumptions', note: 'Flag any implicit assumption that discount codes, prices, or cart totals are trusted from the client without server-side revalidation', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'brand-consistent merchandising', note: 'Use product photography, layout, and imagery style consistent with brand identity so the storefront does not read as a generic template', category: 'preferences' },
    { aspect: 'category page hierarchy', note: 'Design category/collection pages with clear visual hierarchy so featured and high-margin products get appropriate prominence', category: 'functionalRequirements' },
    { aspect: 'promotional moments', note: 'Plan visual treatment for sales/promotions (banners, badges, countdown timers) that stays consistent with the broader design system', category: 'preferences' },
    { aspect: 'product imagery standards', note: 'Establish consistent product photography standards (background, angles, zoom) across the catalog for a cohesive shopping experience', category: 'constraints' },
    { aspect: 'seasonal refresh', note: 'Consider how the storefront visual theme adapts for seasonal campaigns without requiring a full redesign each time', category: 'preferences' },
    { aspect: 'micro-interactions', note: 'Use tasteful micro-interactions (add-to-cart confirmation, quantity steppers) that reinforce purchase confidence without adding friction', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'checkout edge cases', note: 'Test checkout with zero-item cart, out-of-stock item added to cart, expired payment method, and declined card scenarios', category: 'functionalRequirements' },
    { aspect: 'inventory race conditions', note: 'Test concurrent purchases of the last unit of a low-stock item to confirm no overselling occurs', category: 'constraints' },
    { aspect: 'discount/coupon abuse', note: 'Test coupon codes for stacking, expiry enforcement, minimum-order requirements, and single-use-per-customer limits', category: 'functionalRequirements' },
    { aspect: 'payment failure handling', note: 'Verify graceful handling of payment gateway timeouts, partial failures, and duplicate-submission prevention on checkout', category: 'constraints' },
    { aspect: 'shipping calculation accuracy', note: 'Test shipping rate calculation across weight/dimension edge cases and unsupported destination addresses', category: 'preferences' },
    { aspect: 'order lifecycle contradictions', note: 'Check for contradictions such as "no accounts required" alongside "customers can view order history"', category: 'constraints' },
    { aspect: 'refund/cancellation flow', note: 'Define acceptance criteria for order cancellation and refund flows, including partial refunds and post-fulfillment returns', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'budget vs custom payment infrastructure',
      note: 'A minimal/shoestring budget alongside a custom-built payment processing system is a known-infeasible combination — PCI-compliant payment infrastructure requires significant engineering and compliance investment; an off-the-shelf gateway is almost always the right call at low budgets.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(custom|build our own|in-house)\s+(payment processing|payment system|payment gateway)\b/i,
    },
    {
      aspect: 'timeline vs full-catalog migration',
      note: 'An extremely short delivery timeline alongside a full store migration (thousands of SKUs, historical orders, existing customer accounts) is high-risk — catalog and data migration at scale typically requires weeks of validation regardless of team size.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(migrat\w*|thousands of (skus?|products?))\b/i,
    },
    {
      aspect: 'no accounts vs order history',
      note: 'Requiring guest-only checkout with no customer accounts is incompatible with also requiring customers to view past order history or saved payment methods online without authentication.',
      category: 'constraints',
      triggerA: /\b(guest[- ]only|no (?:customer )?accounts?|without (?:an? )?account)\b/i,
      triggerB: /\b(order history|saved payment methods?|view (?:past|previous) orders?)\b/i,
    },
  ],
};
