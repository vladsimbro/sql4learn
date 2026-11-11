// Additional original course lessons; existing module IDs, lesson IDs and task IDs are preserved.
import {foundationAdditions} from './curriculum-foundations.js';
import {advancedAdditions} from './curriculum-advanced.js';
import {specialistAdditions} from './curriculum-specialist.js';
export const curriculumAdditions=[...foundationAdditions,...advancedAdditions,...specialistAdditions];
export const curriculumGuides=Object.fromEntries(curriculumAdditions.map(item=>[item.id,item.guide]));
