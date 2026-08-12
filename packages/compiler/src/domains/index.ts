import type { DomainModule } from './types.js';
import { webDomain } from './web/index.js';
import { gameDomain } from './game/index.js';
import { brandingDomain } from './branding/index.js';
import { softwareDevelopmentDomain } from './software-development/index.js';
import { mobileDevelopmentDomain } from './mobile-development/index.js';
import { desktopDevelopmentDomain } from './desktop-development/index.js';
import { unityDomain } from './unity/index.js';
import { unrealDomain } from './unreal/index.js';
import { robloxDomain } from './roblox/index.js';
import { blenderDomain } from './blender/index.js';
import { graphicDesignDomain } from './graphic-design/index.js';
import { imageGenerationDomain } from './image-generation/index.js';
import { videoGenerationDomain } from './video-generation/index.js';
import { musicDomain } from './music/index.js';
import { writingDomain } from './writing/index.js';
import { researchDomain } from './research/index.js';
import { businessDomain } from './business/index.js';

export const DOMAIN_MODULES: DomainModule[] = [webDomain, gameDomain, brandingDomain, softwareDevelopmentDomain, mobileDevelopmentDomain, desktopDevelopmentDomain, unityDomain, unrealDomain, robloxDomain, blenderDomain, graphicDesignDomain, imageGenerationDomain, videoGenerationDomain, musicDomain, writingDomain, researchDomain, businessDomain];

/** Minimum score for a domain to be selected; below this, domain is 'unknown'. */
export const DOMAIN_CONFIDENCE_FLOOR = 1;

export { webDomain, gameDomain, brandingDomain, softwareDevelopmentDomain, mobileDevelopmentDomain, desktopDevelopmentDomain, unityDomain, unrealDomain, robloxDomain, blenderDomain, graphicDesignDomain, imageGenerationDomain, videoGenerationDomain, musicDomain, writingDomain, researchDomain, businessDomain };
export type { DomainModule } from './types.js';
