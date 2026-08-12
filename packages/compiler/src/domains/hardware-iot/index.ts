import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. A bare 'mqtt' or 'i2c' keyword is already fairly
// safe, but generic-sounding terms like 'sensor', 'firmware', or 'gpio' can
// collide with unrelated words if matched as substrings — always match on
// word boundaries, never with .includes().
const KEYWORDS = [
  'iot', 'internet of things', 'firmware', 'embedded system', 'embedded systems',
  'microcontroller', 'esp32', 'esp8266', 'arduino', 'raspberry pi', 'stm32',
  'gpio', 'sensor', 'sensors', 'actuator', 'actuators', 'mqtt', 'zigbee',
  'z-wave', 'ble', 'bluetooth low energy', 'lora', 'lorawan', 'rtos',
  'freertos', 'i2c', 'spi', 'uart', 'pcb', 'circuit board', 'edge device',
  'edge computing', 'smart home', 'smart device', 'wearable device',
  'battery life', 'low power mode', 'ota update', 'over-the-air update',
  'device firmware', 'hardware prototype', 'breadboard', 'soldering',
  'ip rating', 'thingsboard', 'device provisioning',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const hardwareIotDomain: DomainModule = {
  id: 'hardware-iot',
  label: 'Hardware / IoT',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Firmware must operate within the target microcontroller\'s flash/RAM budget', category: 'constraint' },
    { text: 'Define connectivity protocol (Wi-Fi, BLE, Zigbee, LoRaWAN, cellular) and its power/range tradeoffs', category: 'functional' },
    { text: 'Support secure over-the-air (OTA) firmware updates with rollback on failure', category: 'functional' },
    { text: 'Define expected battery life / power budget for the device under normal use', category: 'constraint' },
    { text: 'Device must fail safely (defined behavior) on sensor fault or connectivity loss', category: 'constraint' },
    { text: 'Provision each device with a unique identity/credentials rather than a shared secret', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'connectivity protocol',
      description: 'The wireless/wired connectivity protocol (Wi-Fi, BLE, Zigbee, LoRaWAN, cellular, Ethernet) is unspecified',
      isResolved: (input) => /\b(wi-?fi|bluetooth|ble|zigbee|z-wave|lora\w*|cellular|4g|5g|nb-?iot|ethernet|rs-?485|can\s*bus)\b/i.test(input),
    },
    {
      field: 'power source',
      description: 'The power source (battery, mains-powered, solar, energy harvesting) and expected device lifespan on that power is unspecified',
      isResolved: (input) => /\b(battery|batteries|mains[- ]?powered|solar|energy\s+harvesting|rechargeable|coin\s*cell|power\s+supply)\b/i.test(input),
    },
    {
      field: 'target hardware platform',
      description: 'The target microcontroller/board or hardware platform is unspecified',
      isResolved: (input) => /\b(esp32|esp8266|arduino|raspberry\s*pi|stm32|nordic|nrf\d+|teensy|microcontroller|custom\s+pcb)\b/i.test(input),
    },
    {
      field: 'environmental conditions',
      description: 'The device\'s operating environment (indoor/outdoor, temperature range, moisture/dust exposure, IP rating) is unspecified',
      isResolved: (input) => /\b(outdoor|indoor|ip\d\d|waterproof|dustproof|temperature\s+range|weatherproof|enclosure)\b/i.test(input),
    },
    {
      field: 'data/cloud backend',
      description: 'Where telemetry data is sent and stored (local gateway, cloud IoT platform, self-hosted broker) is unspecified',
      isResolved: (input) => /\b(aws\s+iot|azure\s+iot|google\s+cloud\s+iot|thingsboard|mqtt\s+broker|local\s+gateway|self-?hosted)\b/i.test(input),
    },
    {
      field: 'manufacturing scale',
      description: 'Whether this is a one-off prototype or a design intended for volume manufacturing is unspecified',
      isResolved: (input) => /\b(prototype|proof\s+of\s+concept|poc|mass\s+production|manufactur\w*|volume\s+production|small\s+batch)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'hardware schematic/PCB design', dependsOn: [], note: 'Component selection, schematic capture, and PCB layout for the target board' },
    { component: 'bootloader', dependsOn: ['hardware schematic/PCB design'], note: 'Minimal startup code responsible for verifying and loading firmware, and enabling OTA rollback' },
    { component: 'firmware application layer', dependsOn: ['bootloader'], note: 'Main device logic: sensor reads, actuator control, state machine, running on bare-metal or an RTOS' },
    { component: 'sensor/actuator drivers', dependsOn: ['firmware application layer'], note: 'Hardware abstraction layer for I2C/SPI/UART peripherals (sensors, motors, displays, relays)' },
    { component: 'connectivity stack', dependsOn: ['firmware application layer'], note: 'Wi-Fi/BLE/Zigbee/LoRaWAN radio stack and protocol implementation (e.g. MQTT client, CoAP)' },
    { component: 'device provisioning service', dependsOn: ['connectivity stack'], note: 'Unique device identity/certificate issuance and first-boot pairing/claiming flow' },
    { component: 'cloud/edge ingestion backend', dependsOn: ['connectivity stack'], note: 'MQTT broker or IoT platform (AWS IoT, Azure IoT Hub, ThingsBoard, self-hosted) receiving telemetry and issuing commands' },
    { component: 'OTA update pipeline', dependsOn: ['bootloader', 'cloud/edge ingestion backend'], note: 'Signed firmware build/publish pipeline with staged rollout and rollback on boot failure' },
    { component: 'companion app / dashboard', dependsOn: ['cloud/edge ingestion backend'], note: 'Mobile or web interface for device configuration, telemetry visualization, and control' },
    { component: 'enclosure and power design', dependsOn: ['hardware schematic/PCB design'], note: 'Physical enclosure (IP rating, thermal dissipation) and power delivery/battery management circuitry' },
  ],
  technicalConsiderations: [
    { aspect: 'memory/flash budget', note: 'Fit firmware image and runtime RAM usage within the target microcontroller\'s flash and RAM limits; account for OTA needing space for a second firmware slot', category: 'constraints' },
    { aspect: 'connectivity protocol tradeoffs', note: 'Choose a protocol matching range/power/bandwidth needs: BLE for short-range low-power, Wi-Fi for high-bandwidth mains-powered devices, LoRaWAN/NB-IoT for long-range low-data-rate battery devices, Zigbee/Z-Wave for mesh home automation', category: 'functionalRequirements' },
    { aspect: 'RTOS vs bare-metal', note: 'Decide between bare-metal loop and an RTOS (FreeRTOS, Zephyr) based on task concurrency needs — an RTOS adds scheduling overhead but simplifies multi-peripheral timing', category: 'functionalRequirements' },
    { aspect: 'power management', note: 'Use sleep/deep-sleep modes, duty-cycled radio wake-ups, and peripheral power gating to hit the target battery life; measure actual current draw, not just datasheet typical values', category: 'constraints' },
    { aspect: 'OTA update safety', note: 'Sign firmware images, verify signatures before flashing, and implement a rollback mechanism (dual-bank/A-B partitioning) so a bad OTA push cannot brick devices in the field', category: 'functionalRequirements' },
    { aspect: 'sensor calibration and drift', note: 'Account for sensor calibration, temperature compensation, and drift over the device\'s operating lifetime, especially for analog sensors', category: 'functionalRequirements' },
    { aspect: 'bus protocol selection', note: 'Choose I2C (multi-device, lower speed), SPI (faster, more pins), or UART based on peripheral requirements and pin budget on the target MCU', category: 'preferences' },
    { aspect: 'clock/timing accuracy', note: 'Define timing/synchronization requirements (RTC drift, NTP sync over network, or GPS time source) if the device must timestamp events accurately', category: 'preferences' },
    { aspect: 'manufacturing test/provisioning', note: 'Define an end-of-line factory test and provisioning flow (flashing unique credentials, verifying peripherals) if moving beyond a handful of prototype units', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'first-time setup flow', note: 'Design an out-of-box pairing/provisioning flow (BLE onboarding to Wi-Fi credentials, QR code claim) that works without a screen on the device itself', category: 'functionalRequirements' },
    { aspect: 'status feedback without a screen', note: 'Use LEDs, buzzers, or haptic patterns to communicate device state (connecting, error, low battery) on hardware with no display', category: 'functionalRequirements' },
    { aspect: 'companion app clarity', note: 'Keep the companion app/dashboard\'s device status and control surface simple — most IoT users abandon setup flows that require technical troubleshooting', category: 'preferences' },
    { aspect: 'offline/degraded connectivity behavior', note: 'Define what the device does and shows the user when connectivity drops — silent failure erodes trust faster than a clear "offline" indicator', category: 'functionalRequirements' },
    { aspect: 'physical accessibility', note: 'Ensure buttons, ports, and indicators are usable given the device\'s physical form factor and installation context (e.g. wall-mounted, worn, embedded in furniture)', category: 'preferences' },
    { aspect: 'notification fatigue', note: 'Throttle and prioritize push notifications/alerts from the device so users do not disable notifications entirely out of fatigue', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'unique device credentials', note: 'Provision each device with a unique key/certificate at manufacture time rather than a shared secret baked into firmware — a single leaked shared key compromises the entire fleet', category: 'constraints' },
    { aspect: 'firmware signing', note: 'Sign firmware images and verify the signature in the bootloader before flashing, preventing unsigned/malicious firmware from being installed via OTA or physical access', category: 'constraints' },
    { aspect: 'transport encryption', note: 'Encrypt telemetry and command traffic in transit (TLS for MQTT/HTTPS, DTLS for CoAP) rather than relying on the connectivity layer alone', category: 'constraints' },
    { aspect: 'secure boot and debug port lockdown', note: 'Enable secure boot and disable/lock JTAG or serial debug interfaces on production units to prevent firmware extraction or tampering via physical access', category: 'constraints' },
    { aspect: 'default credentials', note: 'Never ship devices with a hardcoded default password or open admin interface — require a forced credential change or unique per-device provisioning', category: 'constraints' },
    { aspect: 'key/secret storage', note: 'Store cryptographic keys in a secure element or hardware-backed key store where available, rather than in plaintext flash readable via a debug port', category: 'constraints' },
    { aspect: 'fleet revocation', note: 'Support revoking a compromised device\'s credentials/certificate without needing to physically recall the unit', category: 'functionalRequirements' },
  ],
  creativeConsiderations: [
    { aspect: 'industrial design', note: 'Establish the enclosure\'s form factor, materials, and finish appropriate to the installation context (consumer countertop device vs. rugged outdoor sensor)', category: 'preferences' },
    { aspect: 'indicator/light language', note: 'Design a consistent, minimal light/color language for LED status indicators so behavior states are recognizable without a manual', category: 'preferences' },
    { aspect: 'unboxing and first impression', note: 'For consumer-facing hardware, treat unboxing and initial physical setup as part of the product experience, not an afterthought', category: 'preferences' },
    { aspect: 'brand consistency across app and device', note: 'Keep the companion app\'s visual language consistent with the physical device\'s design so the product reads as one coherent system', category: 'preferences' },
    { aspect: 'sound design for alerts', note: 'If the device has a speaker/buzzer, design distinct, non-jarring tones for different alert types rather than a single generic beep', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'connectivity loss testing', note: 'Test device behavior across Wi-Fi/BLE dropout, weak signal, and full offline periods, including reconnection and any buffered-data replay behavior', category: 'functionalRequirements' },
    { aspect: 'power cycle and brownout testing', note: 'Test behavior under sudden power loss, brownout voltage conditions, and rapid power-cycling to catch corrupted state or failure to reboot cleanly', category: 'constraints' },
    { aspect: 'OTA rollback testing', note: 'Deliberately push a broken firmware image in a test environment and confirm the device rolls back to the previous working image rather than bricking', category: 'functionalRequirements' },
    { aspect: 'environmental stress testing', note: 'Test the device across its rated temperature/humidity range and, if outdoor-rated, verify the claimed IP rating with actual ingress testing', category: 'constraints' },
    { aspect: 'battery life validation', note: 'Measure actual battery life under realistic duty cycles rather than trusting datasheet current draw figures, which rarely match real-world radio/sensor activity', category: 'functionalRequirements' },
    { aspect: 'sensor accuracy verification', note: 'Validate sensor readings against a calibrated reference instrument across the expected operating range, not just at room temperature', category: 'functionalRequirements' },
    { aspect: 'fleet-scale failure modes', note: 'Consider failure modes that only appear at fleet scale: thundering-herd reconnect after an outage, OTA rollout overwhelming the update server, clock drift across thousands of devices', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'battery life vs high-power connectivity',
      note: 'Requiring a long battery life (months/years) alongside a high-power connectivity choice (continuous Wi-Fi or cellular) is a known-infeasible combination — those radios draw far more current than a coin-cell or small battery can sustain for extended periods; a low-power protocol (BLE, LoRaWAN) or duty-cycled operation is required.',
      category: 'constraints',
      triggerA: /\b(months?|years?)\s+of\s+battery\s+life|\blong\s+battery\s+life\b/i,
      triggerB: /\b(continuous|always-?on)\s+(wi-?fi|cellular|4g|5g)\b/i,
    },
    {
      aspect: 'timeline vs custom PCB manufacturing',
      note: 'An extremely short delivery timeline (days) alongside custom PCB design and manufacturing is infeasible — PCB fabrication and assembly turnaround typically takes days-to-weeks even before accounting for design and validation time.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(custom\s+pcb|custom\s+circuit\s+board|new\s+pcb\s+design)\b/i,
    },
    {
      aspect: 'no budget vs mass manufacturing',
      note: 'A "no budget"/hobbyist-scale constraint alongside a request for mass-production manufacturing (tooling, certification, supply chain) is unrealistic scope for the stated resources — volume manufacturing requires capital for tooling, compliance testing (FCC/CE), and component sourcing at scale.',
      category: 'constraints',
      triggerA: /\b(no\s+budget|shoestring\s+budget|hobbyist\s+budget)\b/i,
      triggerB: /\b(mass\s+production|mass\s+manufactur\w*|volume\s+manufactur\w*)\b/i,
    },
  ],
};
