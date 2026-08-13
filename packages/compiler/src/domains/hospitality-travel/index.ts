import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Plain substring matching would let bare keywords like 'inn' match inside
// unrelated words like "inning" or "beginning" — silently inflating scores
// on inputs that have nothing to do with hospitality/travel.
const KEYWORDS = [
  'hotel', 'hospitality', 'reservation system', 'booking system', 'booking engine',
  'itinerary', 'travel agency', 'guest experience', 'guest services', 'check-in',
  'check-out', 'front desk', 'concierge', 'room inventory', 'occupancy rate',
  'vacation rental', 'short-term rental', 'airbnb', 'resort', 'hostel',
  'bed and breakfast', 'restaurant reservation', 'table reservation', 'flight booking',
  'itinerary planner', 'travel booking', 'itinerary planning', 'loyalty program', 'amenities',
  'cancellation policy', 'seasonal demand', 'peak season', 'overbooking',
  'housekeeping', 'room service', 'property management system', 'PMS integration',
  'group booking', 'wedding block', 'room block', 'no-show policy', 'minimum stay',
  'boutique hotel', 'motel', 'glamping', 'campground booking', 'tour operator',
  'excursion booking', 'ticketing platform', 'destination management', 'guest portal',
  'self check-in', 'kiosk check-in', 'travel itinerary app', 'multi-city trip',
  'layover', 'boarding pass', 'guest review', 'star rating', 'welcome amenity',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const hospitalityTravelDomain: DomainModule = {
  id: 'hospitality-travel',
  label: 'Hospitality / Travel',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define the reservation/booking flow (search, availability check, hold, confirm, pay)', category: 'functional' },
    { text: 'Support real-time inventory/availability updates to prevent double-booking', category: 'functional' },
    { text: 'Define cancellation, modification, and refund policy', category: 'constraint' },
    { text: 'Handle seasonal/peak-demand pricing and capacity constraints', category: 'preference' },
    { text: 'Provide confirmation and reminder notifications (email/SMS) to guests', category: 'preference' },
    { text: 'Define group/block booking handling (room blocks, group rates, rooming lists) separately from individual bookings', category: 'functional' },
    { text: 'Define no-show and late-arrival policy, including hold-time before releasing an unclaimed reservation', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'property/service type',
      description: 'The type of property or service (hotel, restaurant, vacation rental, flight/tour booking) is unspecified',
      isResolved: (input) => /\b(hotel|resort|hostel|bed and breakfast|vacation rental|restaurant|flight|tour|cruise|airbnb)\b/i.test(input),
    },
    {
      field: 'capacity/inventory model',
      description: 'How capacity is tracked (rooms, tables, seats, units) and its limits is unspecified',
      isResolved: (input) => /\b(rooms?|tables?|seats?|units?|inventory|capacity|occupancy)\b/i.test(input),
    },
    {
      field: 'booking channel',
      description: 'Whether bookings come direct, via OTA/third-party channels, or both is unspecified',
      isResolved: (input) => /\b(direct booking|third[- ]party|OTA|channel manager|expedia|booking\.com|api integration|direct only|direct-only)\b/i.test(input),
    },
    {
      field: 'payment/deposit handling',
      description: 'Payment timing (deposit, pay-at-property, full prepayment) and processor is unspecified',
      isResolved: (input) => /\b(deposit|prepay|pay at (the )?(hotel|property|check-?in)|payment processor|stripe|credit card)\b/i.test(input),
    },
    {
      field: 'guest communication',
      description: 'How guests are notified/contacted (confirmation, reminders, special requests) is unspecified',
      isResolved: (input) => /\b(confirmation|reminder|notification|special request|email|sms|guest communication)\b/i.test(input),
    },
    {
      field: 'seasonality/demand pattern',
      description: 'Seasonal or peak-demand fluctuation and its effect on pricing/capacity is unspecified',
      isResolved: (input) => /\b(season\w*|peak|off-?peak|high demand|low demand|holiday surge)\b/i.test(input),
    },
    {
      field: 'individual vs group booking',
      description: 'Whether the system must support group/block bookings (weddings, conferences, tour groups) alongside individual bookings is unspecified',
      isResolved: (input) => /\b(group booking|room block|wedding block|block of rooms|conference block|tour group|group rate)\b/i.test(input),
    },
    {
      field: 'check-in method',
      description: 'How guests check in (staffed front desk, self/kiosk check-in, mobile/digital key) is unspecified',
      isResolved: (input) => /\b(self check-?in|kiosk|mobile key|digital key|front desk|staffed check-?in|keyless entry)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'search/availability engine', dependsOn: [], note: 'Real-time inventory search across dates/units/guests' },
    { component: 'inventory/capacity manager', dependsOn: [], note: 'Tracks rooms/tables/seats and prevents overbooking via holds and locking' },
    { component: 'reservation/booking flow', dependsOn: ['search/availability engine', 'inventory/capacity manager'], note: 'Search to hold to confirm to pay booking pipeline' },
    { component: 'pricing/rate engine', dependsOn: ['inventory/capacity manager'], note: 'Seasonal/dynamic pricing, rate plans, promotions' },
    { component: 'payment processing', dependsOn: ['reservation/booking flow'], note: 'Deposits, full prepayment, refunds, PCI-compliant processor integration' },
    { component: 'channel manager integration', dependsOn: ['inventory/capacity manager'], note: 'Syncs availability/rates with OTAs (Booking.com, Expedia, Airbnb)' },
    { component: 'guest communication system', dependsOn: ['reservation/booking flow'], note: 'Confirmation, reminder, and cancellation notifications (email/SMS)' },
    { component: 'front-desk/staff console', dependsOn: ['reservation/booking flow'], note: 'Check-in/check-out workflow, guest profile, special-request handling' },
    { component: 'loyalty/CRM module', dependsOn: ['guest communication system'], note: 'Repeat-guest recognition, loyalty points, targeted offers' },
    { component: 'reporting/analytics dashboard', dependsOn: ['inventory/capacity manager', 'pricing/rate engine'], note: 'Occupancy rate, revenue per available unit, seasonal demand trends' },
    { component: 'group/block booking manager', dependsOn: ['inventory/capacity manager', 'reservation/booking flow'], note: 'Holds room/table blocks for events and groups, tracks pickup vs. attrition against the contracted block, and releases unused units by the cutoff date' },
    { component: 'self/kiosk check-in module', dependsOn: ['reservation/booking flow', 'front-desk/staff console'], note: 'Guest-facing self-service or kiosk check-in with ID verification and digital-key issuance, falling back to staffed desk on failure' },
  ],
  technicalConsiderations: [
    { aspect: 'inventory locking', note: 'Use atomic holds/locking on inventory during checkout to prevent race-condition double-bookings under concurrent requests', category: 'constraints' },
    { aspect: 'channel manager sync', note: 'Define how availability and rates stay synchronized across direct booking and third-party OTA channels (polling vs. webhook push)', category: 'functionalRequirements' },
    { aspect: 'payment integration', note: 'Select a PCI-DSS compliant payment processor and define deposit vs. full-payment capture timing', category: 'constraints' },
    { aspect: 'timezone handling', note: 'Store and display check-in/check-out times and availability windows in the correct property-local timezone, not just UTC or client-local', category: 'functionalRequirements' },
    { aspect: 'rate/pricing engine', note: 'Design a rate-plan and dynamic/seasonal pricing engine (peak-season multipliers, length-of-stay discounts, last-minute rates)', category: 'functionalRequirements' },
    { aspect: 'scalability for peak demand', note: 'Plan for seasonal traffic spikes (holiday booking rushes) with caching and load-tested availability search', category: 'preferences' },
    { aspect: 'offline/degraded connectivity', note: 'Define front-desk behavior when connectivity drops mid-check-in (local queueing, sync-on-reconnect)', category: 'constraints' },
    { aspect: 'third-party API reliability', note: 'Handle OTA/channel-manager API outages or rate limits gracefully without corrupting local inventory state', category: 'constraints' },
    { aspect: 'group block attrition and pickup', note: 'Track group/wedding block pickup against contracted attrition thresholds and auto-release unclaimed rooms back to general inventory by the cutoff date', category: 'functionalRequirements' },
    { aspect: 'legacy PMS integration', note: 'Define the integration path (API, SFTP batch, or middleware) with the property\'s existing property-management system, since many hotels run decades-old on-prem PMS software with limited or no modern API', category: 'constraints' },
    { aspect: 'digital key / kiosk failure fallback', note: 'Design a graceful fallback to staffed check-in when self-service kiosk hardware, ID scanning, or digital-key provisioning fails', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'booking flow clarity', note: 'Keep the search-to-confirmation booking flow to as few steps as possible, with visible progress and no surprise fees at checkout', category: 'functionalRequirements' },
    { aspect: 'availability calendar', note: 'Provide a clear, at-a-glance availability calendar showing bookable vs. sold-out dates and any minimum-stay restrictions', category: 'functionalRequirements' },
    { aspect: 'guest self-service', note: 'Allow guests to view, modify, or cancel their own reservation without contacting staff, within policy limits', category: 'preferences' },
    { aspect: 'mobile booking experience', note: 'Ensure the booking flow and confirmation are fully usable on mobile, since a large share of travel bookings happen on phones', category: 'functionalRequirements' },
    { aspect: 'transparent pricing', note: 'Show taxes, resort fees, and cleaning/service fees upfront rather than only at final checkout to avoid guest trust issues', category: 'constraints' },
    { aspect: 'accessibility of listings', note: 'Surface accessibility features (step-free access, accessible rooms/tables) clearly in listings and filters', category: 'preferences' },
    { aspect: 'multilingual/currency support', note: 'Consider multilingual content and local currency display for an international guest base', category: 'preferences' },
    { aspect: 'special-request capture', note: 'Give guests a clear place to record special requests (late check-in, dietary needs, accessible room, celebration) and surface it to staff at the right workflow step, not buried in free text no one reads', category: 'functionalRequirements' },
    { aspect: 'group organizer view', note: 'For block/group bookings, give the group organizer a dedicated view of rooming list, pickup vs. block size, and payment responsibility (individual vs. master account)', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'guest PII handling', note: 'Guest data (name, contact info, ID/passport numbers for check-in) must be stored encrypted and access-restricted to authorized staff roles', category: 'constraints' },
    { aspect: 'payment data', note: 'Never store raw card numbers; use a tokenized/PCI-compliant payment processor and avoid logging payment details', category: 'constraints' },
    { aspect: 'staff role permissions', note: 'Define role-based access so front-desk staff, managers, and housekeeping see only the guest/reservation data relevant to their role', category: 'constraints' },
    { aspect: 'booking manipulation', note: 'Prevent unauthorized modification of reservations via guessable booking-confirmation codes or unauthenticated modification links', category: 'constraints' },
    { aspect: 'channel API credentials', note: 'Secure OTA/channel-manager API keys and rotate them; a leaked key can expose inventory and rate data or allow fraudulent bookings', category: 'constraints' },
    { aspect: 'fraud/chargeback risk', note: 'Add fraud checks (address/card mismatch, rapid repeat bookings) for high-value or last-minute reservations', category: 'preferences' },
    { aspect: 'ID/passport document handling', note: 'Government ID or passport images captured for check-in (especially via self-check-in/kiosk) must be stored encrypted with a defined retention and deletion period, not retained indefinitely', category: 'constraints' },
    { aspect: 'digital key security', note: 'Mobile/digital room keys must expire automatically at checkout and be revocable immediately if a guest reports a lost device', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'brand experience', note: 'Reflect the property or service brand (boutique, luxury, budget, family-friendly) consistently across the booking site and confirmation emails', category: 'preferences' },
    { aspect: 'imagery quality', note: 'Use high-quality, representative photography of rooms/venues/amenities — mismatched expectations are a leading cause of guest complaints', category: 'preferences' },
    { aspect: 'guest journey storytelling', note: 'Design the pre-arrival, stay, and post-stay touchpoints as a coherent guest journey rather than isolated transactional screens', category: 'preferences' },
    { aspect: 'seasonal/promotional theming', note: 'Consider seasonal visual theming or promotions (holiday packages, off-peak deals) that align with demand cycles', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'overbooking edge case', note: 'Test concurrent booking attempts on the last available room/table to confirm no double-booking occurs', category: 'constraints' },
    { aspect: 'cancellation/refund flow', note: 'Verify cancellation within and outside the stated policy window produces correct refund/no-refund outcomes', category: 'functionalRequirements' },
    { aspect: 'rate calculation accuracy', note: 'Test seasonal pricing, multi-night stays, taxes, and fees calculate correctly across date ranges spanning rate changes', category: 'functionalRequirements' },
    { aspect: 'channel sync consistency', note: 'Verify a booking made on one channel (direct site) correctly decrements availability shown on all synced OTA channels', category: 'constraints' },
    { aspect: 'contradiction check', note: 'Check for contradictions such as "no online payments" alongside "instant confirmed booking", which normally requires payment guarantee', category: 'constraints' },
    { aspect: 'timezone/date boundary bugs', note: 'Test check-in/check-out and midnight-crossing bookings near timezone and daylight-saving transitions', category: 'preferences' },
    { aspect: 'no-show and late cancellation handling', note: 'Define and test behavior for no-shows and late cancellations against the stated policy', category: 'preferences' },
    { aspect: 'group block release edge case', note: 'Test that a group block auto-releases unclaimed rooms to general inventory at the cutoff date without releasing rooms already picked up by named guests', category: 'functionalRequirements' },
    { aspect: 'kiosk/self-check-in fallback', note: 'Test that a failed self-check-in (ID scan failure, kiosk hardware fault) correctly routes the guest to staffed front-desk check-in without losing the reservation state', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'no payment processing vs instant confirmation',
      note: 'Requiring instantly confirmed bookings without any payment/deposit guarantee is high-risk — without payment commitment, no-show and overbooking rates rise sharply, undermining the stated guarantee.',
      category: 'constraints',
      triggerA: /\bno (online )?payments?\b|\bpay at (the )?(property|check-?in)\b/i,
      triggerB: /\b(instant(ly)?|guaranteed) confirm(ed|ation)?\b/i,
    },
    {
      aspect: 'shoestring budget vs multi-channel integration',
      note: 'A near-zero/shoestring budget alongside full OTA channel-manager integration (Booking.com, Expedia, Airbnb) is a known-infeasible combination — channel APIs, certification, and ongoing sync infrastructure require proportional budget.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(channel manager|OTA|booking\.com|expedia|airbnb)\s+(integration|sync|api)?\b/i,
    },
    {
      aspect: 'single-property capacity vs peak-season unlimited demand',
      note: 'A fixed, single-property room/table inventory alongside a requirement to "never turn away" guests during peak season is physically infeasible without overflow/partner arrangements — hard capacity limits cannot flex past the physical unit count.',
      category: 'constraints',
      triggerA: /\b(never turn away|always accommodate|unlimited (bookings|guests|capacity))\b/i,
      triggerB: /\b(peak season|holiday surge|high demand)\b/i,
    },
    {
      aspect: 'fully self-service check-in vs mandatory ID verification',
      note: 'Requiring fully unattended/no-staff self-check-in alongside mandatory in-person government-ID verification is contradictory — ID verification either needs a staffed step or a certified remote-verification service, which a purely kiosk-free unattended flow does not provide on its own.',
      category: 'constraints',
      triggerA: /\b(fully unattended|no[- ]staff|staffless|contactless[- ]only)\s+check-?in\b/i,
      triggerB: /\b(mandatory|required)\s+(in-person\s+)?(id|government id|passport)\s+verification\b/i,
    },
  ],
};
