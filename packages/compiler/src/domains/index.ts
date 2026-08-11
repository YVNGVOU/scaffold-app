import type { DomainModule } from './types.js';
import { webDomain } from './web/index.js';
import { gameDomain } from './game/index.js';
import { brandingDomain } from './branding/index.js';

export const DOMAIN_MODULES: DomainModule[] = [webDomain, gameDomain, brandingDomain];

/** Minimum score for a domain to be selected; below this, domain is 'unknown'. */
export const DOMAIN_CONFIDENCE_FLOOR = 1;

export { webDomain, gameDomain, brandingDomain };
export type { DomainModule } from './types.js';
