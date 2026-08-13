import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('hardware-iot domain', () => {
  it('detects hardware-iot domain on a realistic embedded/IoT request', () => {
    const compiled = compileArchitect(
      'Build IoT firmware for an ESP32 microcontroller that reads temperature sensors over I2C and publishes readings via MQTT over Wi-Fi, with OTA firmware update support and low power sleep mode for battery life'
    );
    expect(compiled.domain).toBe('hardware-iot');
  });

  it('negative control: an unrelated web-focused request does not misclassify as hardware-iot', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('hardware-iot');
    expect(compiled.domain).toBe('web');
  });

  it('word-boundary regression: unrelated words do not falsely trigger hardware-iot keywords', () => {
    const state = runArchitectPipeline('This dashboard needs a sensory-friendly color scheme and a raspberry-flavored icon set for the app store listing');
    expect(state.domain).not.toBe('hardware-iot');
  });

  it('architect specialist produces hardware/IoT-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Design an embedded system for a smart home device using an STM32 microcontroller, Zigbee connectivity, sensor drivers over SPI, and an OTA update pipeline with a companion mobile app'
    );
    expect(compiled.domain).toBe('hardware-iot');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/firmware application layer|connectivity stack|OTA update pipeline|bootloader/i);
  });

  it('technical specialist surfaces a hardware/IoT-specific consideration', () => {
    const compiled = compileArchitect(
      'Design an embedded system for a smart home device using an STM32 microcontroller, Zigbee connectivity, sensor drivers over SPI, and an OTA update pipeline with a companion mobile app'
    );
    expect(compiled.domain).toBe('hardware-iot');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/memory\/flash budget|connectivity protocol|power management|OTA update safety|RTOS/i);
  });

  it('detects hardware-iot domain on a Matter/Thread smart-home request using newly added phrasings', () => {
    const compiled = compileArchitect(
      'Build a smart home device supporting the Matter protocol over a Thread network, with device telemetry sent to a cloud dashboard and CE certification for EU sale'
    );
    expect(compiled.domain).toBe('hardware-iot');
  });

  it('word-boundary regression: "digital twin" and "device fleet" style phrasing does not falsely trigger on unrelated words', () => {
    const state = runArchitectPipeline('The film has an evil twin subplot and a fleet of taxis racing through the city at night');
    expect(state.domain).not.toBe('hardware-iot');
  });

  it('surfaces the interoperability standard ambiguity field when Matter/Thread/ecosystem is unspecified', () => {
    const compiled = compileArchitect(
      'Build IoT firmware for an ESP32 microcontroller that reads temperature sensors over I2C and publishes readings via MQTT over Wi-Fi'
    );
    expect(compiled.domain).toBe('hardware-iot');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/interoperab\w*|ecosystem/i);
  });

  it('technical specialist surfaces the new EMI/RF coexistence consideration', () => {
    const compiled = compileArchitect(
      'Design an embedded system for a smart home device using an STM32 microcontroller, Zigbee connectivity, sensor drivers over SPI, and an OTA update pipeline with a companion mobile app'
    );
    expect(compiled.domain).toBe('hardware-iot');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/EMI|RF coexistence|electromagnetic interference/i);
  });
});
